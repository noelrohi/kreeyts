import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import type { ReactNode } from "react"

import appCss from "../styles.css?url"

const siteUrl = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "")
const title = "Assetwell — Every ad size, made in one place"
const description =
  "Write one prompt, pick the image you like, and make every ad size on a single screen. Assetwell saves the finished set right to your computer."
const ogImagePath = "/og-image.png"
const ogImageUrl = siteUrl ? `${siteUrl}${ogImagePath}` : ogImagePath

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title },
      { name: "description", content: description },
      { name: "application-name", content: "Assetwell" },
      { name: "apple-mobile-web-app-title", content: "Assetwell" },
      { name: "theme-color", content: "#111111" },
      { property: "og:title", content: title },
      { property: "og:site_name", content: "Assetwell" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      ...(siteUrl ? [{ property: "og:url", content: siteUrl }] : []),
      { property: "og:image", content: ogImageUrl },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      {
        property: "og:image:alt",
        content: "Assetwell preview — every ad size, made in one place.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImageUrl },
      {
        name: "twitter:image:alt",
        content: "Assetwell preview — every ad size, made in one place.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      ...(siteUrl
        ? [
            {
              rel: "canonical",
              href: siteUrl,
            },
          ]
        : []),
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
