'use client'

import Link from 'next/link'

const navLinks = [
	{href: '/feature', label: 'Exhibitions'},
	{href: '/press', label: 'Press'},
	{href: '/contact', label: 'Contact'},
	{href: '/cv', label: 'CV'},
] as const

export default function SiteNav () {
	return (
		<nav
			className="fixed left-0 right-0 top-0 z-50 flex justify-between bg-transparent px-5 py-4 text-base"
		>
			<Link href="/">Gery Georgieva</Link>
			<div className="flex gap-6">
				{navLinks.map(({href, label}) => (
					<Link key={href} href={href}>
						{label}
					</Link>
				))}
			</div>
		</nav>
	)
}
