import { app, Menu, type MenuItemConstructorOptions } from "electron"

import { checkForUpdatesFromMenu } from "./updater"

export function installApplicationMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(applicationMenuTemplate()))
}

function applicationMenuTemplate(): MenuItemConstructorOptions[] {
  const commonMenus: MenuItemConstructorOptions[] = [
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ]

  if (process.platform === "darwin") {
    return [
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          checkForUpdatesMenuItem(),
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { role: "fileMenu" },
      ...commonMenus,
      { role: "help" },
    ]
  }

  return [
    { role: "fileMenu" },
    ...commonMenus,
    {
      role: "help",
      submenu: [checkForUpdatesMenuItem()],
    },
  ]
}

function checkForUpdatesMenuItem(): MenuItemConstructorOptions {
  return {
    label: "Check for Updates…",
    click: () => {
      void checkForUpdatesFromMenu()
    },
  }
}
