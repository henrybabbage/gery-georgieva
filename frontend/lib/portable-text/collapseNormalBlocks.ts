import type {PortableTextBlock} from 'next-sanity'

type TextBlock = PortableTextBlock & {
  _type: 'block'
  children?: Array<{
    _type: 'span'
    _key: string
    text?: string
    marks?: string[]
  }>
  markDefs?: Array<{_key: string} & Record<string, unknown>>
  style?: string
  listItem?: string
}

function isTextBlock(block: PortableTextBlock): block is TextBlock {
  return block._type === 'block'
}

export function isCollapsibleNormalBlock(block: PortableTextBlock): boolean {
  if (!isTextBlock(block)) return false
  if (block.listItem) return false
  const style = block.style ?? 'normal'
  return style === 'normal'
}

function hardBreakSpan(key: string) {
  return {
    _type: 'span' as const,
    _key: key,
    text: '\n',
    marks: [] as string[],
  }
}

function mergeMarkDefs(group: TextBlock[]): TextBlock['markDefs'] {
  const seen = new Set<string>()
  const markDefs: NonNullable<TextBlock['markDefs']> = []

  for (const block of group) {
    for (const markDef of block.markDefs ?? []) {
      if (seen.has(markDef._key)) continue
      seen.add(markDef._key)
      markDefs.push(markDef)
    }
  }

  return markDefs.length > 0 ? markDefs : undefined
}

function mergeBlockGroup(group: TextBlock[]): TextBlock {
  const children: NonNullable<TextBlock['children']> = []

  group.forEach((block, blockIndex) => {
    if (blockIndex > 0) {
      children.push(hardBreakSpan(`collapse-br-${blockIndex}`))
    }
    children.push(...(block.children ?? []))
  })

  return {
    ...group[0],
    children,
    markDefs: mergeMarkDefs(group),
  }
}

export function collapseNormalBlocks(blocks: PortableTextBlock[]): PortableTextBlock[] {
  const result: PortableTextBlock[] = []
  let group: TextBlock[] = []

  const flush = () => {
    if (group.length === 0) return
    if (group.length === 1) {
      result.push(group[0])
    } else {
      result.push(mergeBlockGroup(group))
    }
    group = []
  }

  for (const block of blocks) {
    if (isCollapsibleNormalBlock(block)) {
      group.push(block as TextBlock)
    } else {
      flush()
      result.push(block)
    }
  }

  flush()
  return result
}
