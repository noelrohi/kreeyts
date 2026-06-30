import { app, BrowserWindow, dialog, ipcMain } from "electron"
import { autoUpdater, type UpdateDownloadedEvent } from "electron-updater"
import type { AssetwellUpdateInfo } from "@assetwell/desktop-bridge"

import { IPC_CHANNELS } from "./shared/channels"

const UPDATE_CHECK_DELAY_MS = 3_000
const DISABLE_AUTO_UPDATES = process.env.ASSETWELL_DISABLE_AUTO_UPDATES === "1"
const DOWNLOAD_NOTIFICATION = {
  title: "{appName} update ready",
  body: "{appName} version {version} has downloaded and will install when you quit the app.",
}

let hasConfigured = false
let hasStarted = false
let downloadedUpdate: AssetwellUpdateInfo | null = null

export function registerUpdaterIpc() {
  ipcMain.handle(IPC_CHANNELS.updater.getDownloadedUpdate, () => {
    return downloadedUpdate
  })

  ipcMain.handle(IPC_CHANNELS.updater.installDownloadedUpdate, () => {
    if (!downloadedUpdate) return false

    autoUpdater.quitAndInstall()
    return true
  })
}

export function startAutoUpdates() {
  if (hasStarted || !canUseAutoUpdater()) return

  hasStarted = true
  configureAutoUpdater()

  setTimeout(() => {
    void autoUpdater
      .checkForUpdatesAndNotify(DOWNLOAD_NOTIFICATION)
      .catch(logUpdaterError)
  }, UPDATE_CHECK_DELAY_MS)
}

export async function checkForUpdatesFromMenu() {
  const owner = BrowserWindow.getFocusedWindow()

  if (downloadedUpdate) {
    const { response } = await showUpdateDialog(
      owner,
      "An update is ready",
      `Assetwell ${downloadedUpdate.version} has downloaded and is ready to install.`,
      ["Restart and Install", "Later"],
    )

    if (response === 0) autoUpdater.quitAndInstall()
    return
  }

  if (DISABLE_AUTO_UPDATES) {
    await showUpdateDialog(
      owner,
      "Updates are disabled",
      "Automatic updates are disabled for this build by ASSETWELL_DISABLE_AUTO_UPDATES.",
    )
    return
  }

  if (!app.isPackaged || isDevRuntime()) {
    await showUpdateDialog(
      owner,
      "Updates are available in packaged builds",
      "Run a signed production build of Assetwell to check for updates from GitHub Releases.",
    )
    return
  }

  configureAutoUpdater()

  try {
    const result = await autoUpdater.checkForUpdatesAndNotify(
      DOWNLOAD_NOTIFICATION,
    )

    if (result && !result.isUpdateAvailable) {
      await showUpdateDialog(
        owner,
        "Assetwell is up to date",
        `You're running Assetwell ${app.getVersion()}.`,
      )
    }
  } catch (error) {
    logUpdaterError(error)
    await showUpdateDialog(
      owner,
      "Couldn't check for updates",
      "Please try again later.",
    )
  }
}

function canUseAutoUpdater() {
  return app.isPackaged && !isDevRuntime() && !DISABLE_AUTO_UPDATES
}

function isDevRuntime() {
  return Boolean(process.env.VITE_DEV_SERVER_URL)
}

function configureAutoUpdater() {
  if (hasConfigured) return

  hasConfigured = true
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on("error", logUpdaterError)
  autoUpdater.on("update-downloaded", handleUpdateDownloaded)
}

function handleUpdateDownloaded(event: UpdateDownloadedEvent) {
  downloadedUpdate = updateDownloadedEventToBridgeInfo(event)

  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(
      IPC_CHANNELS.updater.downloadedUpdate,
      downloadedUpdate,
    )
  }
}

function updateDownloadedEventToBridgeInfo(
  event: UpdateDownloadedEvent,
): AssetwellUpdateInfo {
  return {
    version: event.version,
    currentVersion: app.getVersion(),
    releaseDate: event.releaseDate,
    releaseNotes: event.releaseNotes?.toString(),
  }
}

async function showUpdateDialog(
  owner: BrowserWindow | null,
  message: string,
  detail: string,
  buttons = ["OK"],
) {
  const options = {
    type: "info" as const,
    buttons,
    defaultId: 0,
    cancelId: buttons.length - 1,
    title: "Assetwell",
    message,
    detail,
  }

  if (owner) {
    return dialog.showMessageBox(owner, options)
  }

  return dialog.showMessageBox(options)
}

function logUpdaterError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[updater] ${message}`)
}
