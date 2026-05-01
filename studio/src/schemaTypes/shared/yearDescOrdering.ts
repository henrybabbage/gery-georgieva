/** Default sort for reference pickers: most recent year first. */
export const yearDescOrdering = {
  title: 'Year (newest first)',
  name: 'yearDesc',
  by: [{field: 'year', direction: 'desc' as const}],
}
