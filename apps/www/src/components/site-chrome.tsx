import { Button } from "@assetwell/ui/button"
import { Download } from "lucide-react"

import { DOWNLOAD_URL } from "../lib/constants"

export function SiteBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute left-1/2 top-1/4 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 h-[300px] w-[420px] rounded-full bg-primary/5 blur-[100px]" />
      <div className="grain absolute inset-0" />
    </div>
  )
}

export function SiteHeader() {
  const menuItems = [
    { name: "Benefits", href: "/#benefits" },
    { name: "How it works", href: "/#how-it-works" },
  ]

  return (
    <header className="fixed left-1/2 top-4 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
      <nav className="flex h-14 items-center justify-between rounded-full border border-border bg-card/80 px-4 shadow-lg backdrop-blur-xl">
        <a href="/" className="group flex items-center gap-2.5">
          <AssetwellLogo className="size-7 transition-transform group-hover:scale-105" />
          <span className="font-semibold tracking-tight">Assetwell</span>
        </a>

        <div className="hidden items-center gap-1 sm:flex">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <a href={item.href}>{item.name}</a>
            </Button>
          ))}
        </div>

        <Button asChild size="sm" className="rounded-full">
          <a href={DOWNLOAD_URL}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </Button>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-background py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-6 text-sm text-muted-foreground sm:flex-row">
        <a href="/" className="flex items-center gap-2 text-foreground">
          <AssetwellLogo className="size-8" />
          <span className="font-semibold">Assetwell</span>
        </a>
        <div className="flex items-center gap-5">
          <a className="hover:text-foreground" href={DOWNLOAD_URL}>
            Download
          </a>
          <a className="hover:text-foreground" href="/#benefits">
            Benefits
          </a>
          <a className="hover:text-foreground" href="/#how-it-works">
            How it works
          </a>
        </div>
      </div>
    </footer>
  )
}

export function AssetwellLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="64"
        y="72"
        width="896"
        height="896"
        rx="242"
        fill="currentColor"
        opacity="0.08"
      />
      <rect
        x="372"
        y="300"
        width="128"
        height="480"
        rx="44"
        fill="currentColor"
        transform="rotate(17 436 540)"
      />
      <rect
        x="524"
        y="300"
        width="128"
        height="480"
        rx="44"
        fill="currentColor"
        transform="rotate(-17 588 540)"
      />
      <rect x="389" y="566" width="246" height="92" rx="26" fill="#e7a23c" />
    </svg>
  )
}
