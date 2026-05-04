'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const navLinks = [
  {href: '/work', label: 'Work', matchPrefixes: ['/work', '/exhibition'] as const},
  {href: '/press', label: 'Press', matchPrefixes: ['/press'] as const},
  {href: '/cv', label: 'CV', matchPrefixes: ['/cv'] as const},
] as const

export default function SiteNav() {
  const pathname = usePathname() ?? ''

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex justify-between bg-transparent px-5 py-4 text-base">
      <Link href="/" className="shrink-0 whitespace-nowrap">
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
              className={
                isActive
                  ? 'text-[var(--color-ink)] font-medium'
                  : 'text-[var(--color-ink)]'
              }
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
