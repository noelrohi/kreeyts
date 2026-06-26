import {
  getDownloadPlatform,
  isDownloadPlatformAvailable,
  pickDownloadReleaseAsset,
  resolveDownloadPlatform,
} from "@assetwell/product/downloads"
import { createFileRoute } from "@tanstack/react-router"

import { LATEST_RELEASE_API_URL, RELEASES_URL } from "../lib/constants"

type GitHubAsset = {
  name: string
  browser_download_url: string
}

type GitHubRelease = {
  html_url?: string
  assets?: Array<GitHubAsset>
}

export const Route = createFileRoute("/api/download")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url)
        const platform = resolveDownloadPlatform(
          requestUrl.searchParams.get("platform"),
          request.headers.get("user-agent"),
        )
        const platformSpec = getDownloadPlatform(platform)

        if (!isDownloadPlatformAvailable(platform)) {
          return platformUnavailable(platformSpec)
        }

        try {
          const response = await fetch(LATEST_RELEASE_API_URL, {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "assetwell-www",
            },
          })

          if (!response.ok) {
            return redirectTo(RELEASES_URL)
          }

          const release = (await response.json()) as GitHubRelease
          const asset = pickDownloadReleaseAsset(release.assets ?? [], platform)

          return redirectTo(
            asset?.browser_download_url ?? release.html_url ?? RELEASES_URL,
          )
        } catch {
          return redirectTo(RELEASES_URL)
        }
      },
    },
  },
})

function platformUnavailable(platform: ReturnType<typeof getDownloadPlatform>) {
  return new Response(
    platform.unavailableReason ?? `${platform.name} downloads are unavailable.`,
    {
      status: 404,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  )
}

function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  })
}
