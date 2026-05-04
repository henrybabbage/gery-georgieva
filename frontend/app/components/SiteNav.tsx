'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const navLinks = [
  {href: '/shows', label: 'Work'},
  {href: '/press', label: 'Press'},
  {href: '/cv', label: 'CV'},
] as const

export default function SiteNav() {
  const pathname = usePathname() ?? ''

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex justify-between bg-transparent px-5 py-4 text-base">
      <Link href="/" className="shrink-0 whitespace-nowrap">
        Gery Georgieva
      </Link>
      <div className="flex gap-6">
        {navLinks.map(({href, label}) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
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
