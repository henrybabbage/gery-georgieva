import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'

const HOLD_PATH = '/hold'

function normalizeHostCandidate(value: string): string {
  let host = value.trim().toLowerCase()
  if (!host) {
    return ''
  }
  for (const prefix of ['https://', 'http://']) {
    if (host.startsWith(prefix)) {
      host = host.slice(prefix.length)
      break
    }
  }
  const slashIndex = host.indexOf('/')
  if (slashIndex !== -1) {
    host = host.slice(0, slashIndex)
  }
  return host.split(':')[0] ?? ''
}

function isHoldSiteEnabled(): boolean {
  const raw = process.env.HOLD_SITE?.trim().toLowerCase()
  return raw === 'true' || raw === '1'
}

function hostMatchesProduction(hostname: string): boolean {
  const raw = process.env.PRODUCTION_HOST?.trim()
  if (!raw) {
    return false
  }
  const host = hostname.toLowerCase().split(':')[0]
  const candidates = raw.split(',').map(normalizeHostCandidate).filter(Boolean)
  for (const primary of candidates) {
    if (host === primary || host === `www.${primary}`) {
      return true
    }
  }
  return false
}

function isHoldAllowedForThisDeployment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv !== undefined && vercelEnv !== 'production') {
    return false
  }
  return true
}

function shouldHoldForRequest(request: NextRequest): boolean {
  if (!isHoldSiteEnabled()) {
    return false
  }
  if (!isHoldAllowedForThisDeployment()) {
    return false
  }
  return hostMatchesProduction(request.nextUrl.hostname)
}

function withHoldShellHeader(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hold-shell', '1')
  return NextResponse.next({
    request: {headers: requestHeaders},
  })
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hold = shouldHoldForRequest(request)

  if (hold && pathname === HOLD_PATH) {
    return withHoldShellHeader(request)
  }

  if (!hold && pathname === HOLD_PATH) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (hold && pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  if (hold) {
    const url = request.nextUrl.clone()
    url.pathname = HOLD_PATH
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-hold-shell', '1')
    return NextResponse.rewrite(url, {
      request: {headers: requestHeaders},
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
  ],
}
