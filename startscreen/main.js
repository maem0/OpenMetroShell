const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
      width: 1280,
      height: 768,
      fullscreen: true,
      frame: false,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true
      }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

ipcMain.on('quit-app', () => {
  app.quit()
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