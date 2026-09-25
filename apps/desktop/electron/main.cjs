const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

let mainWindow;
const configFile = () => path.join(app.getPath('userData'), 'desktop-config.json');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(configFile(), 'utf8')); } catch { return { dataPath: app.getPath('userData') }; }
}
function writeConfig(config) { fs.mkdirSync(path.dirname(configFile()), { recursive: true }); fs.writeFileSync(configFile(), JSON.stringify(config, null, 2)); return config; }

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 1100, minHeight: 700, backgroundColor: '#f5f8fc', title: 'MediFlow', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false } });
  const url = process.env.MEDIFLOW_WEB_URL || 'http://localhost:3000';
  mainWindow.loadURL(url);
  if (process.env.NODE_ENV === 'development') mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  ipcMain.handle('desktop:get-config', () => readConfig());
  ipcMain.handle('desktop:choose-data-path', async () => { const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }); if (result.canceled || !result.filePaths[0]) return readConfig(); return writeConfig({ ...readConfig(), dataPath: result.filePaths[0] }); });
  ipcMain.handle('desktop:set-data-path', (_event, dataPath) => writeConfig({ ...readConfig(), dataPath }));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
