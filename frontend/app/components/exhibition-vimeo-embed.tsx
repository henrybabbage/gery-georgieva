'use client'

import 'vimeo-video-element'
import VimeoVideo from 'vimeo-video-element/react'
import {
  MediaController,
  MediaControlBar,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeDisplay,
  MediaTimeRange,
} from 'media-chrome/react'
import {createContext, useCallback, useContext, useMemo, useRef, type ReactNode} from 'react'
import {buildVimeoPlayerSrc} from '@/lib/vimeo-player-src'

type VimeoPlayPayload = Parameters<typeof buildVimeoPlayerSrc>[1]

type PlaybackRegistry = Map<string, HTMLMediaElement>

const PlaybackContext = createContext<{
  register: (id: string, media: HTMLMediaElement | null) => void
  onPlaying: (id: string) => void
} | null>(null)

export function ExhibitionVimeoPlaybackProvider({children}: {children: ReactNode}) {
  const registry = useRef<PlaybackRegistry>(new Map())

  const register = useCallback((id: string, media: HTMLMediaElement | null) => {
    const reg = registry.current
    if (media) reg.set(id, media)
    else reg.delete(id)
  }, [])

  const onPlaying = useCallback((id: string) => {
    for (const [otherId, el] of registry.current) {
      if (otherId !== id) void el.pause()
    }
  }, [])

  const value = useMemo(() => ({register, onPlaying}), [register, onPlaying])

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function ExhibitionVimeoEmbed({
  vimeoId,
  play,
  title,
  posterUrl,
  playbackId,
  className,
}: {
  vimeoId: string
  play?: VimeoPlayPayload
  title?: string | null
  posterUrl?: string | null
  playbackId: string
  className?: string
}) {
  const src = useMemo(() => buildVimeoPlayerSrc(vimeoId, play), [vimeoId, play])
  const ctx = useContext(PlaybackContext)
  const cleanupRef = useRef<(() => void) | undefined>(undefined)

  const mediaRef = useCallback(
    (el: HTMLMediaElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = undefined
      if (!el) return
      if (!ctx) return
      ctx.register(playbackId, el)
      const onPlaying = () => ctx.onPlaying(playbackId)
      el.addEventListener('playing', onPlaying)
      cleanupRef.current = () => {
        el.removeEventListener('playing', onPlaying)
        ctx.register(playbackId, null)
      }
    },
    [ctx, playbackId],
  )

  return (
    <div
      className={className ?? 'relative aspect-video w-full max-w-full overflow-hidden bg-black'}
    >
      <MediaController
        aria-label={title?.trim() || 'Vimeo video'}
        className="block h-full w-full [&_[slot=media]]:block [&_[slot=media]]:h-full [&_[slot=media]]:w-full"
      >
        <VimeoVideo
          ref={mediaRef}
          slot="media"
          src={src}
          playsInline
          preload="metadata"
          {...(posterUrl ? {poster: posterUrl} : {})}
        />
        <MediaLoadingIndicator slot="centered-chrome" />
        <MediaControlBar>
          <MediaPlayButton />
          <MediaTimeRange />
          <MediaTimeDisplay showDuration />
          <MediaMuteButton />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>
    </div>
  )
}
