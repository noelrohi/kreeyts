import { app, BrowserWindow, dialog } from "electron"
import { autoUpdater } from "electron-updater"

const UPDATE_CHECK_DELAY_MS = 3_000
const DISABLE_AUTO_UPDATES = process.env.ASSETWELL_DISABLE_AUTO_UPDATES === "1"
const DOWNLOAD_NOTIFICATION = {
  title: "{appName} update ready",
  body: "{appName} version {version} has downloaded and will install when you quit the app.",
}

let hasConfigured = false
let hasStarted = false

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

  if (DISABLE_AUTO_UPDATES) {
    await showUpdateDialog(
      owner,
      "Updates are disabled",
      "Automatic updates are disabled for this build by ASSETWELL_DISABLE_AUTO_UPDATES.",
    )
    return
  }

  if (!app.isPackaged) {
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
  return app.isPackaged && !DISABLE_AUTO_UPDATES
}

function configureAutoUpdater() {
  if (hasConfigured) return

  hasConfigured = true
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on("error", logUpdaterError)
}

async function showUpdateDialog(
  owner: BrowserWindow | null,
  message: string,
  detail: string,
) {
  const options = {
    type: "info" as const,
    buttons: ["OK"],
    defaultId: 0,
    title: "Assetwell",
    message,
    detail,
  }

  if (owner) {
    await dialog.showMessageBox(owner, options)
  } else {
    await dialog.showMessageBox(options)
  }
}

function logUpdaterError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[updater] ${message}`)
}
