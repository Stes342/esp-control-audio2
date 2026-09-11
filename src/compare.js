
 const fs = require('fs');
 const path = require('path');
 
 
 
 const electron = require('electron');
 const app = electron.app || electron.remote.app;
 const dbPath = path.join(app.getPath('userData'), 'modules.json');
 
function createEmptyScheduler() {
  return {
    audioUrls: [],
    playlists: [],
    events: [],
    daySchedulers: [],
    calendarAssignments: []
  };
}

function createEmptyDB() {
  return {
    modules: [],
    groups: [],
    scheduler: createEmptyScheduler()
  };
}

function normalizeDB(db) {
  if (Array.isArray(db)) {
    return {
      ...createEmptyDB(),
      modules: db
    };
   }

  if (!db || typeof db !== 'object') {
    return createEmptyDB();
  }

  return {
    ...db,
    modules: Array.isArray(db.modules) ? db.modules : [],
    groups: Array.isArray(db.groups) ? db.groups : [],
    scheduler: {
      ...createEmptyScheduler(),
      ...(db.scheduler && typeof db.scheduler === 'object' ? db.scheduler : {}),
      audioUrls: Array.isArray(db.scheduler?.audioUrls) ? db.scheduler.audioUrls : [],
      playlists: Array.isArray(db.scheduler?.playlists) ? db.scheduler.playlists : [],
      events: Array.isArray(db.scheduler?.events) ? db.scheduler.events : [],
      daySchedulers: Array.isArray(db.scheduler?.daySchedulers) ? db.scheduler.daySchedulers : [],
      calendarAssignments: Array.isArray(db.scheduler?.calendarAssignments) ? db.scheduler.calendarAssignments : []
    }
  };
}

function loadModules() {
  return loadDB().modules;
 }
 
 function saveModules(modules) {
   const db = loadDB();
  db.modules = Array.isArray(modules) ? modules : [];
   saveDB(db);
  return db.modules;
 }
 
 function upsertModule(module) {
   const modules = loadModules();
   const index = modules.findIndex(m => m.mac === module.mac);
 
   if (index !== -1) {
     modules[index] = { ...modules[index], ...module };
   } else {
     modules.push(module);
   }
  return saveModules(modules);
 }
 
 function deleteModule(mac) {
   const db = loadDB();
   db.modules = db.modules.filter(m => m.mac !== mac);
   saveDB(db);
  return db.modules;
 }
 
 function removeModule(mac) {
  return deleteModule(mac);
 }
 
 // ===== 🔥 Добавляем поддержку групп! =====
 
 function loadGroups() {
  return loadDB().groups;
 }
 
 function saveGroups(groups) {
   const db = loadDB();
  db.groups = Array.isArray(groups) ? groups : [];
   saveDB(db);
  return db.groups;
}

// ===== 🗓️ Поддержка scheduler =====

function loadScheduler() {
  return loadDB().scheduler;
}

function saveScheduler(scheduler) {
  const db = loadDB();
  db.scheduler = normalizeDB({ scheduler }).scheduler;
  saveDB(db);
  return db.scheduler;
 }
 
 // ===== 🗃️ Общие утилиты =====
 
 function loadDB() {
   try {
    return normalizeDB(JSON.parse(fs.readFileSync(dbPath, 'utf-8')));
   } catch {
    return createEmptyDB();
   }
 }
 
 function saveDB(db) {
  const normalizedDB = normalizeDB(db);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(normalizedDB, null, 2), 'utf-8');
 }
 
 // ===== ✅ Экспорт =====
 
 module.exports = {
   loadModules,
   saveModules,
   upsertModule,
   deleteModule,
   removeModule,
   loadGroups,
  saveGroups,
  loadScheduler,
  saveScheduler
 };
