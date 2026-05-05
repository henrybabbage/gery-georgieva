'use client'

import Link from 'next/link'
import type {ReactNode} from 'react'
import {PressHoverArrowIcon} from '@/app/press/PressHoverArrowIcon'

const linkClass =
	'group inline-flex max-w-full !cursor-pointer items-start gap-1.5'

const iconClass =
	'pointer-events-none shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100'

type Props = {
	variant: 'internal' | 'pdf' | 'external'
	href: string
	title: string
	children: ReactNode
}

export function PressRowLink({variant, href, title, children}: Props) {
	const iconProps = {
		'className': `${iconClass} size-[1em]`,
		'aria-hidden': true as const,
	}

	const icon = <PressHoverArrowIcon {...iconProps} />

	if (variant === 'internal') {
		return (
			<Link href={href} title={title} className={linkClass}>
				<span className="min-w-0">{children}</span>
				{icon}
			</Link>
		)
	}

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			title={title}
			className={linkClass}
		>
			<span className="min-w-0">{children}</span>
			{icon}
		</a>
	)
}
