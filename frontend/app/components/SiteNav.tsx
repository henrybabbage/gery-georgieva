'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const navLinks = [
	{href: '/work', label: 'Work', match: (p: string) => p === '/work' || p.startsWith('/exhibition/')},
	{href: '/cv', label: 'CV', match: (p: string) => p === '/cv'},
	{href: '/press', label: 'Press', match: (p: string) => p === '/press' || p.startsWith('/press/')},
	{href: '/contact', label: 'Contact', match: (p: string) => p === '/contact'},
] as const

export default function SiteNav() {
	const pathname = usePathname() ?? ''

	return (
		<nav className="fixed left-0 right-0 top-0 z-50 flex justify-between bg-transparent px-5 py-4 text-base">
			<Link href="/">Gery Georgieva</Link>
			<div className="flex gap-6">
				{navLinks.map(({href, label, match}) => {
					const isActive = match(pathname)
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
