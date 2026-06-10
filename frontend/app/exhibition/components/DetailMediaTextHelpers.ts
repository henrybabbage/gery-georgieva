export type MediaTextItem = {
  caption?: string | null
  credit?: string | null
}

export type MediaIndexRow = {
  number: string
  caption: string
  credit: string
}

function trimText(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function hasText(value: string | null | undefined): boolean {
  return trimText(value) !== ''
}

export function resolveCaptionLines(
  item: MediaTextItem,
  options: {showInlineCredits?: boolean} = {},
): {caption: string; credit: string} {
  const showInlineCredits = options.showInlineCredits ?? true
  return {
    caption: trimText(item.caption),
    credit: showInlineCredits ? trimText(item.credit) : '',
  }
}

export function collectUniqueMediaCredits(items: readonly MediaTextItem[]): string[] {
  const seen = new Set<string>()
  const credits: string[] = []

  for (const item of items) {
    const credit = trimText(item.credit)
    if (credit === '' || seen.has(credit)) continue
    seen.add(credit)
    credits.push(credit)
  }

  return credits
}

export function buildMediaIndexRows(items: readonly MediaTextItem[]): MediaIndexRow[] {
  const numberWidth = Math.max(2, String(items.length).length)

  return items.flatMap((item, index) => {
    const caption = trimText(item.caption)
    const credit = trimText(item.credit)
    if (caption === '' && credit === '') return []
    return [
      {
        number: String(index + 1).padStart(numberWidth, '0'),
        caption,
        credit,
      },
    ]
  })
}
