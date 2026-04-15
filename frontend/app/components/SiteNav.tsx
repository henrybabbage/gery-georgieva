'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const links = [
  {href: '/', label: 'Work'},
  {href: '/archive', label: 'Archive'},
  {href: '/cv', label: 'CV'},
]

export default function SiteNav() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 mix-blend-multiply">
      <Link
        href="/"
        className="text-sm tracking-wide text-[#1c1b18] hover:opacity-50 transition-opacity duration-200"
      >
        Gery Georgieva
      </Link>
      <nav>
        <ul className="flex gap-6">
          {links.map(({href, label}) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm transition-opacity duration-200 ${
                    active ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
