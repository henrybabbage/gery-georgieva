'use client'

import {DialRoot} from 'dialkit'
import {usePathname} from 'next/navigation'

export default function AppDialRoot() {
	const pathname = usePathname() ?? ''
	const isHome = pathname === '/'

	return <DialRoot productionEnabled defaultOpen={!isHome} />
}
