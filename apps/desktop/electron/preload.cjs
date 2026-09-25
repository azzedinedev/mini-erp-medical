const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mediflowDesktop', {
  getConfig: () => ipcRenderer.invoke('desktop:get-config'),
  chooseDataPath: () => ipcRenderer.invoke('desktop:choose-data-path'),
  setDataPath: (dataPath) => ipcRenderer.invoke('desktop:set-data-path', dataPath),
});
