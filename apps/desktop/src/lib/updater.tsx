import * as React from "react"
import type { AssetwellUpdateInfo } from "@assetwell/desktop-bridge"
import { toast } from "sonner"

interface UpdaterContextValue {
  downloadedUpdate: AssetwellUpdateInfo | null
  installing: boolean
  installDownloadedUpdate: () => Promise<void>
}

const UpdaterContext = React.createContext<UpdaterContextValue | null>(null)

export function UpdaterProvider({ children }: { children: React.ReactNode }) {
  const bridge = getDesktopBridge()
  const [downloadedUpdate, setDownloadedUpdate] =
    React.useState<AssetwellUpdateInfo | null>(null)
  const [installing, setInstalling] = React.useState(false)

  React.useEffect(() => {
    if (!bridge?.updater) return

    let active = true
    void bridge.updater.getDownloadedUpdate().then((update) => {
      if (active && update) setDownloadedUpdate(update)
    })

    const unsubscribe = bridge.updater.onDownloadedUpdate((update) => {
      setDownloadedUpdate(update)
      toast("Update ready", {
        description: `Assetwell ${update.version} has downloaded. Restart to install it.`,
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [bridge])

  const installDownloadedUpdate = React.useCallback(async () => {
    if (!bridge?.updater || !downloadedUpdate) return

    setInstalling(true)
    try {
      const installingNow = await bridge.updater.installDownloadedUpdate()
      if (!installingNow) {
        setInstalling(false)
        toast("Update is not ready yet")
      }
    } catch (error) {
      setInstalling(false)
      toast("Couldn't install update", {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }, [bridge, downloadedUpdate])

  const value = React.useMemo(
    () => ({ downloadedUpdate, installing, installDownloadedUpdate }),
    [downloadedUpdate, installDownloadedUpdate, installing],
  )

  return (
    <UpdaterContext.Provider value={value}>{children}</UpdaterContext.Provider>
  )
}

export function useUpdater() {
  const context = React.useContext(UpdaterContext)
  if (!context)
    throw new Error("useUpdater must be used within UpdaterProvider")
  return context
}

function getDesktopBridge() {
  return typeof window === "undefined" ? undefined : window.assetwell
}
