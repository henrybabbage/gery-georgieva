'use client'

import Link from 'next/link'
import type {ReactNode} from 'react'
import {ExternalLink, FileText, Newspaper} from 'lucide-react'

/**
 * Icons from Lucide (lucide.dev): ExternalLink for outbound links; FileText for PDFs;
 * Newspaper for a press article hosted on this site.
 */
const linkClass =
  'group inline-flex max-w-full !cursor-pointer items-center gap-1.5 underline decoration-[color:var(--color-ink)] underline-offset-2'

const iconClass =
  'pointer-events-none shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100'

type Props = {
  variant: 'internal' | 'pdf' | 'external'
  href: string
  title: string
  children: ReactNode
}

export function PressRowLink({variant, href, title, children}: Props) {
  const decoration = variant === 'pdf' ? 'decoration-dotted' : ''

  const iconProps = {
    'className': `${iconClass} size-[1em]`,
    'strokeWidth': 1.75,
    'aria-hidden': true as const,
  }

  const icon =
    variant === 'external' ? (
      <ExternalLink {...iconProps} />
    ) : variant === 'pdf' ? (
      <FileText {...iconProps} />
    ) : (
      <Newspaper {...iconProps} />
    )

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
      className={`${linkClass} ${decoration}`.trim()}
    >
      <span className="min-w-0">{children}</span>
      {icon}
    </a>
  )
}
