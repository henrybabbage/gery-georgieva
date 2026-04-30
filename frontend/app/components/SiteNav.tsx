'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

export default function SiteNav () {
	const pathname = usePathname()
	const isFeatureSurface =
		pathname === '/feature' || pathname.startsWith('/feature/')

	return (
		<nav
			className={`fixed left-0 right-0 top-0 z-50 flex justify-between px-5 py-4 text-sm ${
				isFeatureSurface ? 'bg-[#fafaf8]' : 'bg-paper'
			}`}
		>
			<Link href="/">Home</Link>
			<Link href="/feature">Information</Link>
		</nav>
	)
}
