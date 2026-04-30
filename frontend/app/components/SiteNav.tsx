'use client'

import Link from 'next/link'

export default function SiteNav () {
	return (
		<nav
			className="fixed left-0 right-0 top-0 z-50 flex justify-between bg-transparent px-5 py-4 text-base"
		>
			<Link href="/">Home</Link>
			<Link href="/feature">Information</Link>
		</nav>
	)
}
