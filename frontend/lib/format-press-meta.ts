import {format, isValid, parseISO} from 'date-fns'

function parseSanityDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null
  }
  const parsed = parseISO(value.trim())
  return isValid(parsed) ? parsed : null
}

/** Single YYYY-MM-DD date from Sanity `date` fields → e.g. "3 April 2026". */
export function formatPressPublicationDate(value: string | null | undefined): string | null {
  const d = parseSanityDate(value)
  return d ? format(d, 'd MMMM yyyy') : null
}
