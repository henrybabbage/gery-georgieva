import {getCliClient} from 'sanity/cli'

type PressDoc = {
  _id: string
  linkText?: string
  publishedAt?: string
}

type DateParts = {
  year: number
  month?: number
  day?: number
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const MONTH_PATTERN =
  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'

const DATE_SOURCES = [
  `\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTH_PATTERN})\\s*,?\\s*\\d{4}`,
  `(?:${MONTH_PATTERN})\\s+\\d{1,2}(?:st|nd|rd|th)?\\s*,?\\s*\\d{4}`,
  `(?:${MONTH_PATTERN})\\s+\\d{4}`,
  '(?:19|20)\\d{2}',
]

const DATE_PARSERS = [
  {
    re: new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})\\s*,?\\s*(\\d{4})$`, 'i'),
    parse: (match: RegExpMatchArray): DateParts => ({
      day: Number(match[1]),
      month: MONTHS[match[2].toLowerCase()],
      year: Number(match[3]),
    }),
  },
  {
    re: new RegExp(`^(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(\\d{4})$`, 'i'),
    parse: (match: RegExpMatchArray): DateParts => ({
      month: MONTHS[match[1].toLowerCase()],
      day: Number(match[2]),
      year: Number(match[3]),
    }),
  },
  {
    re: new RegExp(`^(${MONTH_PATTERN})\\s+(\\d{4})$`, 'i'),
    parse: (match: RegExpMatchArray): DateParts => ({
      month: MONTHS[match[1].toLowerCase()],
      year: Number(match[2]),
    }),
  },
  {
    re: /^((?:19|20)\d{2})$/,
    parse: (match: RegExpMatchArray): DateParts => ({
      year: Number(match[1]),
    }),
  },
]

function toIsoDate({year, month = 1, day = 1}: DateParts): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parseDate(value: string): string | null {
  const trimmed = value.trim()
  for (const parser of DATE_PARSERS) {
    const match = trimmed.match(parser.re)
    if (!match) {
      continue
    }
    return toIsoDate(parser.parse(match))
  }
  return null
}

function normalizeCleanedTitle(value: string, original: string): string {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,.;:/|-]+/, '')
    .replace(/[\s,.;:/|-]+$/, '')
    .trim()
  const openParens = (cleaned.match(/\(/g) ?? []).length
  const closeParens = (cleaned.match(/\)/g) ?? []).length
  if (openParens > closeParens && original.trim().endsWith(')')) {
    return `${cleaned})`
  }
  return cleaned
}

function extractPressDate(linkText: string): {cleaned: string; publishedAt: string} | null {
  for (const dateSource of DATE_SOURCES) {
    for (const re of [
      new RegExp(
        `^\\s*(?:[\\[(]\\s*)?(${dateSource})(?:\\s*[\\])])?\\s*(?:[:.,/|-]|\\u2013|\\u2014)?\\s*`,
        'i',
      ),
      new RegExp(
        `\\s*(?:[:.,/|-]|\\u2013|\\u2014)?\\s*(?:[\\[(]\\s*)?(${dateSource})(?:\\s*[\\])])?\\s*$`,
        'i',
      ),
    ]) {
      const match = linkText.match(re)
      const rawDate = match?.[1]
      if (!rawDate) {
        continue
      }
      const publishedAt = parseDate(rawDate)
      const cleaned = normalizeCleanedTitle(linkText.replace(re, ''), linkText)
      if (publishedAt && cleaned && cleaned !== linkText.trim()) {
        return {cleaned, publishedAt}
      }
    }
  }
  return null
}

async function main() {
  const client = getCliClient({apiVersion: '2025-09-25'})
  const docs: PressDoc[] = await client.fetch(`
    *[_type == "press" && defined(linkText)] {
      _id,
      linkText,
      publishedAt
    }
  `)

  const patches = docs
    .map((doc) => {
      const extracted = doc.linkText ? extractPressDate(doc.linkText) : null
      if (!extracted) {
        return null
      }
      return {
        _id: doc._id,
        before: doc.linkText,
        after: extracted.cleaned,
        publishedAt: doc.publishedAt || extracted.publishedAt,
        setPublishedAt: !doc.publishedAt,
      }
    })
    .filter((patch): patch is NonNullable<typeof patch> => Boolean(patch))

  if (patches.length === 0) {
    console.log('No press title dates found.')
    return
  }

  const tx = client.transaction()
  for (const patch of patches) {
    console.log(
      `${patch._id}: "${patch.before}" -> "${patch.after}" (${patch.publishedAt})`,
    )
    tx.patch(patch._id, (p) => {
      p.set({linkText: patch.after})
      if (patch.setPublishedAt) {
        p.set({publishedAt: patch.publishedAt})
      }
      return p
    })
  }

  await tx.commit()
  console.log(`Patched ${patches.length} press document(s). orderRank was not modified.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
