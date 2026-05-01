import {format, isSameMonth, isSameYear, isValid, parseISO} from 'date-fns'

function parseSanityDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null
  const parsed = parseISO(value.trim())
  return isValid(parsed) ? parsed : null
}

/**
 * Human-readable exhibition dates from Sanity `date` fields (YYYY-MM-DD) or fallback `year`.
 */
export function formatExhibitionRun(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  fallbackYear: number | null | undefined,
): string | null {
  const start = parseSanityDate(startDate)
  const end = parseSanityDate(endDate)

  if (start && end) {
    if (start.getTime() === end.getTime()) return format(start, 'd MMMM yyyy')

    if (isSameYear(start, end) && isSameMonth(start, end)) {
      return `${format(start, 'd')}–${format(end, 'd MMMM yyyy')}`
    }

    if (isSameYear(start, end)) {
      return `${format(start, 'd MMMM')} – ${format(end, 'd MMMM yyyy')}`
    }

    return `${format(start, 'd MMMM yyyy')} – ${format(end, 'd MMMM yyyy')}`
  }

  if (start) return format(start, 'd MMMM yyyy')
  if (end) return `Until ${format(end, 'd MMMM yyyy')}`

  if (fallbackYear != null && Number.isFinite(fallbackYear)) {
    return String(Math.trunc(fallbackYear))
  }

  return null
}

/** Venue and location as a single line, comma-separated. */
export function formatExhibitionVenueLine(
  venue: string | null | undefined,
  location: string | null | undefined,
): string | null {
  const v = venue?.trim()
  const l = location?.trim()
  if (v && l) {
    if (l.toLowerCase().startsWith(v.toLowerCase())) return l
    if (v.toLowerCase().includes(l.toLowerCase())) return v
    return `${v}, ${l}`
  }
  return v || l || null
}
