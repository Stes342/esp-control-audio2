console.log('Preload script loaded');
//const { contextBridge } = require('electron')
//const storage = require('./storage')

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('storageAPI', {
  loadModules: () => ipcRenderer.invoke('loadModules'),
  saveModules: (modules) => ipcRenderer.invoke('saveModules', modules),
  upsertModule: (module) => ipcRenderer.invoke('upsertModule', module),
  removeModule: (mac) => ipcRenderer.invoke('removeModule', mac),
  deleteModule: (mac) => ipcRenderer.invoke('deleteModule', mac),
  getGroups: () => ipcRenderer.invoke('loadGroups'),   
  setGroups: (groups) => ipcRenderer.invoke('saveGroups', groups),
  loadScheduler: () => ipcRenderer.invoke('loadScheduler'),
  saveScheduler: (scheduler) => ipcRenderer.invoke('saveScheduler', scheduler),
  loadLog: () => ipcRenderer.invoke('loadLog'),
  appendLog: (entry) => ipcRenderer.invoke('appendLog', entry)
});
