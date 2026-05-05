/**
 * Build a Vimeo player URL for `vimeo-video-element`, including `h` when we can infer it
 * from Sanity-synced `play` links (private / unlisted embeds).
 */

type VimeoPlayPayload = {
  progressive?: Array<{link?: string | null}>
  dash?: {link?: string | null}
  hls?: {link?: string | null}
} | null

function tryPrivacyHashFromUrl(url: string): string | undefined {
  try {
    const u = new URL(url)
    const h = u.searchParams.get('h')
    if (h) return h
  } catch {
    /* invalid URL */
  }
  return undefined
}

export function extractVimeoPrivacyHash(play: VimeoPlayPayload): string | undefined {
  if (!play) return undefined
  const urls = [
    play.hls?.link,
    play.dash?.link,
    ...(play.progressive?.map((p) => p.link) ?? []),
  ].filter((u): u is string => typeof u === 'string' && u.length > 0)

  for (const link of urls) {
    const h = tryPrivacyHashFromUrl(link)
    if (h) return h
  }
  return undefined
}

export function buildVimeoPlayerSrc(vimeoId: string, play?: VimeoPlayPayload): string {
  const id = vimeoId.trim()
  const base = `https://player.vimeo.com/video/${encodeURIComponent(id)}`
  const h = extractVimeoPrivacyHash(play ?? null)
  if (!h) return base
  return `${base}?h=${encodeURIComponent(h)}`
}
