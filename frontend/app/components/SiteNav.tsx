'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const navLinks = [
  {href: '/exhibitions', label: 'Work'},
  {href: '/press', label: 'Press'},
  {href: '/cv', label: 'CV'},
] as const

export default function SiteNav() {
  const pathname = usePathname() ?? ''

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex justify-between bg-transparent px-5 py-4 text-base">
      <Link href="/">Gery Georgieva</Link>
      <div className="flex gap-6">
        {navLinks.map(({href, label}) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={
                isActive
                  ? 'text-[var(--color-ink)] opacity-100'
                  : 'text-[var(--color-ink)] opacity-45 transition-opacity hover:opacity-80'
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
