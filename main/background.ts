import path from 'path'
import { app, ipcMain, dialog } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { store } from './store'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1200,
    height: 800,
    minWidth: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
    autoUpdater.checkForUpdatesAndNotify()
    log.transports.file.level = 'info'
    autoUpdater.logger = log
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...')
    })
    autoUpdater.on('update-available', (info) => {
      log.info('Update available.')
    })
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available.')
    })
    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater. ' + err)
    })
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = 'Download speed: ' + progressObj.bytesPerSecond
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
      log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
      log.info(log_message)
    })
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded')
      dialog
        .showMessageBox({
          type: 'info',
          buttons: ['Khởi động lại', 'Để sau'],
          title: 'Đã có bản cập nhật mới!',
          message: 'Có bản cập nhật mới đã được tải xuống. Khởi động lại ứng dụng để cập nhật.',
          detail: 'Một số cải tiến và sửa lỗi đã được thực hiện.'
        })
        .then((returnValue) => {
          if (returnValue.response === 0) autoUpdater.quitAndInstall()
        })
    })
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
      const savePath = item.getSavePath()
      item.once('done', (event, state) => {
        if (state === 'completed') {
          console.log('Download successfully')
        } else {
          console.log(`Download failed: ${state}`)
        }
      })
    })
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val)
})
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val)
})
