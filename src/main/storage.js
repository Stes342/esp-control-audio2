const fs = require('fs');
const path = require('path');



const electron = require('electron');
const app = electron.app || electron.remote.app;
const dbPath = path.join(app.getPath('userData'), 'modules.json');

function loadModules() {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(data);
    // Если структура изменилась — поддержи старый формат
    if (Array.isArray(db)) return db; // старый вид — только модули
    return db.modules || [];
  } catch (e) {
    return [];
  }
}

function saveModules(modules) {
  const db = loadDB();
  db.modules = modules;
  saveDB(db);
}

function upsertModule(module) {
  const modules = loadModules();
  const index = modules.findIndex(m => m.mac === module.mac);

  if (index !== -1) {
    modules[index] = { ...modules[index], ...module };
  } else {
    modules.push(module);
  }

  saveModules(modules);
}

function deleteModule(mac) {
  const db = loadDB();
  db.modules = db.modules.filter(m => m.mac !== mac);
  saveDB(db);
}

function removeModule(mac) {
  deleteModule(mac);
}

// ===== 🔥 Добавляем поддержку групп! =====

function loadGroups() {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(data);
    return db.groups || [];
  } catch (e) {
    return [];
  }
}

function saveGroups(groups) {
  const db = loadDB();
  db.groups = groups;
  saveDB(db);
}

// ===== 🗃️ Общие утилиты =====

function loadDB() {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    if (Array.isArray(db)) {
      // старый формат — только модули
      return { modules: db, groups: [] };
    }
    return db;
  } catch {
    return { modules: [], groups: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

// ===== ✅ Экспорт =====

module.exports = {
  loadModules,
  saveModules,
  upsertModule,
  deleteModule,
  removeModule,
  loadGroups,
  saveGroups
};
