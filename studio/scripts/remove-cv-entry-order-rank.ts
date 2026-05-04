import {getCliClient} from 'sanity/cli'

/**
 * One-off: remove legacy orderRank from all cvEntry documents.
 * Run: npx sanity exec scripts/remove-cv-entry-order-rank.ts --with-user-token
 */
async function main() {
  const client = getCliClient({apiVersion: '2025-09-25'})
  const ids: string[] = await client.fetch(`*[_type == "cvEntry" && defined(orderRank)][]._id`)

  if (ids.length === 0) {
    console.log('No cvEntry documents with orderRank.')
    return
  }

  console.log(`Patching ${ids.length} document(s)…`)

  const tx = client.transaction()
  for (const id of ids) {
    tx.patch(id, (patch) => patch.unset(['orderRank']))
  }
  await tx.commit()

  const remaining: string[] = await client.fetch(
    `*[_type == "cvEntry" && defined(orderRank)][]._id`,
  )

  if (remaining.length > 0) {
    throw new Error(`Still ${remaining.length} document(s) with orderRank: ${remaining.join(', ')}`)
  }

  console.log('Removed orderRank from all matching cvEntry documents.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
