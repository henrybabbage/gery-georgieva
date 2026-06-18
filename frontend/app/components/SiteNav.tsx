'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const navLinks = [
  {href: '/work', label: 'Work', matchPrefixes: ['/work'] as const},
  {href: '/press', label: 'Press', matchPrefixes: ['/press'] as const},
  {href: '/cv', label: 'CV', matchPrefixes: ['/cv'] as const},
] as const

export default function SiteNav() {
  const pathname = usePathname() ?? ''

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-baseline justify-between bg-transparent px-5 py-4 text-base">
      <Link
        href="/"
        className="shrink-0 whitespace-nowrap text-xl leading-none font-bold tracking-tight"
      >
        Gery Georgieva
      </Link>
      <div className="flex gap-6">
        {navLinks.map(({href, label, matchPrefixes}) => {
          const isActive = matchPrefixes.some(
            (prefix) =>
              pathname === prefix || pathname.startsWith(`${prefix}/`),
          )
          return (
            <Link
              key={href}
              href={href}
              className="site-nav-link text-[var(--color-ink)]"
              data-active={isActive ? 'true' : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="site-nav-link__track" aria-hidden="true">
                <span>{label}</span>
                <span>{label}</span>
              </span>
              <span className="sr-only">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
