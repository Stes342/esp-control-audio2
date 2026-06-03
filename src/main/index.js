const { app, BrowserWindow } = require('electron')
const path = require('path')
const authMap = {}

const { ipcMain } = require('electron');
const storage = require('./storage.js');

ipcMain.handle('loadModules', () => {
  return storage.loadModules();
});

ipcMain.handle('saveModules', (event, modules) => {
  return storage.saveModules(modules);
});

ipcMain.handle('upsertModule', (event, module) => {
  return storage.upsertModule(module);
});

ipcMain.handle('deleteModule', (event, mac) => {
  return storage.deleteModule(mac);
});
ipcMain.handle('removeModule', async (event, mac) => {
  await storage.removeModule(mac);
  // Возвращай обновленный список, если нужно
  return storage.loadModules();
});
ipcMain.handle('loadGroups', () => storage.loadGroups()); // группы
ipcMain.handle('saveGroups', (_, groups) => {
  console.log('[IPC] saveGroups called:', groups);
  return storage.saveGroups(groups);
});
ipcMain.handle('loadScheduler', () => storage.loadScheduler());
ipcMain.handle('saveScheduler', (_, scheduler) => {
  return storage.saveScheduler(scheduler);
});



let mainWindow
console.log('Preload script path:', path.join(__dirname, 'preload.js'));
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // ✅ подключение preload
      contextIsolation: true,                      // ✅ обязательно
      nodeIntegration: false                       // ✅ обязательно
    }
  })

  const isDev = !app.isPackaged

  if (isDev) {
    // Режим разработки — подключаемся к Vite dev-серверу
    //mainWindow.loadURL('http://localhost:5173')
    const indexPath = path.resolve(__dirname, '../../dist/renderer/index.html')
    mainWindow.loadURL(`file://${indexPath}`)
  } else {
    // Режим продакшена — загружаем готовый index.html
    const indexPath = path.resolve(__dirname, '../../dist/renderer/index.html')
    mainWindow.loadURL(`file://${indexPath}`)
  }

  // Опционально:
   mainWindow.webContents.openDevTools()
}

//app.whenReady().then(createWindow)
// Загружаем авторизационные данные из базы при старте
app.whenReady().then(async () => {
  const modules = await storage.loadModules();
  for (const m of modules) {
    if (m.login && m.password) {
      const authHeader = 'Basic ' + Buffer.from(`${m.login}:${m.password}`).toString('base64');
      authMap[m.ip] = {
        user: m.login,
        pass: m.password,
        authHeader
      };
      //console.log('[BOOTSTRAP] Loaded credentials into authMap for', m.ip);
    }
  }

  createWindow(); // ← теперь после загрузки логинов
});


const express = require('express')
//const fetch = require('node-fetch')
const http = require('http')

// Прокси-сервер на 3000 порту
const proxyApp = express()
const proxyServer = http.createServer(proxyApp)

proxyApp.use('/proxy/:ip', async (req, res) => {
  const { ip } = req.params
  const { user, pass } = req.query
  const targetPath = req.originalUrl.split(`/proxy/${ip}`)[1] || '/'
  const fetch = (await import('node-fetch')).default
  //console.log('[PROXY] >>> New proxy request to', ip, 'path:', targetPath)
  //console.log('[PROXY] Query user/pass:', user, pass)

  const key = ip

  // Если переданы user/pass — сохраняем
  if (user && pass) {
    authMap[key] = {
      user,
      pass,
      authHeader: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
    }
  }

  // Достаём сохранённый authHeader
  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded'
  }

  // 1. Пытаемся взять логин/пароль из памяти
  let authHeader = null
  if (authMap[key]) {
    //console.log('[PROXY] Using credentials from authMap for', ip)
    authHeader = authMap[key].authHeader
  }

  // 2. Иначе ищем в базе (storage)
  if (!authHeader) {
    const allModules = await storage.loadModules()
    const module = allModules.find(m => m.ip === ip)

    //console.log('[PROXY] Looking for stored credentials for', ip)
    //console.log('[PROXY] Found in DB:', module)

    if (module?.login && module?.password) {
      authHeader = 'Basic ' + Buffer.from(`${module.login}:${module.password}`).toString('base64')

      authMap[key] = {
        user: module.login,
        pass: module.password,
        authHeader
      }

      //console.log('[PROXY] Loaded credentials from DB and saved to authMap:', authMap[key])
    } else {
      //console.log('[PROXY] No credentials found in DB')
    }
  }



  // 3. Если нашли — добавляем в headers
  if (authHeader) {
    headers['Authorization'] = authHeader
  }


  try {
    const url = `http://${ip}${targetPath}`
    const options = {
      method: req.method,
      headers: {
        ...headers,
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded'
      }
    }

    // Только если есть тело (POST или PUT), читаем вручную
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await new Promise((resolve, reject) => {
        let data = ''
        req.on('data', chunk => data += chunk)
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })
      options.body = body
    }
    
    //console.log('[PROXY] FETCHING:', url);
    //console.log('[PROXY] HEADERS:', options.headers);
    const response = await fetch(url, options)

    const contentType = response.headers.get('content-type') || 'text/plain'
    const buffer = await response.buffer()

    if (contentType.includes('text/html')) {
      let html = buffer.toString()

      html = html.replace(
        /<head>/i,
        `<head><base href="http://localhost:3000/proxy/${ip}/">`
      )

      html = html.replace(
        '</head>',
        `<script>
          const origFetch = window.fetch;
          window.fetch = function(url, opts) {
            if (typeof url === 'string' && url.startsWith('/')) {
              url = 'http://localhost:3000/proxy/${ip}' + url;
            }
            return origFetch.call(this, url, opts);
          };

          window.addEventListener("DOMContentLoaded", () => {
            const form = document.getElementById('userAccessForm');
            if (!form) return;

            // Новый submit handler
            const newForm = form.cloneNode(true);
            newForm.onsubmit = function(e) {
              e.preventDefault();
              const formData = new URLSearchParams();

              newForm.querySelectorAll('input').forEach(input => {
                if (input.type === 'checkbox') {
                  if (input.checked) {
                    formData.append(input.name, 'on');
                  }
                  // не добавляем вообще, если не отмечен
                } else {
                  formData.append(input.name, input.value);
                }
              });

              fetch('/set_user_access', {
                method: 'POST',
                body: formData
              })
              .then(r => r.text())
              .then(t => alert(t));
            };
            form.replaceWith(newForm);
          });
        </script></head>`
      );


      // Заменяем fetch('/getAccess') → fetch('http://localhost:3000/proxy/${ip}/getAccess')
      html = html.replace(
        /fetch\(\s*['"]\/getAccess['"]\s*\)/g,
        `fetch("http://localhost:3000/proxy/${ip}/getAccess")`
      )

      // Подмена fetch('/...')
      html = html.replace(
        /fetch\(\s*(['"])\/(.*?)\1\s*\)/g,
        (match, quote, path) => `fetch("http://localhost:3000/proxy/${ip}/${path}")`
      )

      // Подмена src="/..." и href="/..."
      html = html.replace(
        /(href|src)=["']\/(.*?)["']/g,
        `$1="http://localhost:3000/proxy/${ip}/$2"`
      )

      console.log('--- MODIFIED HTML ---')
      console.log(html.slice(0, 1000))
      console.log('--- END ---')

      res.status(response.status).set('Content-Type', contentType).send(html)

    } else {
      res.status(response.status).set('Content-Type', contentType).send(buffer)
    }

  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message)
  }
})




proxyServer.listen(3000, () => {
  console.log('🔁 Proxy server running at http://localhost:3000')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

