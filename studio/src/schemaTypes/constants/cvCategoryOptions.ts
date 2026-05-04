/**
 * Display titles for CV categories (plural section names where appropriate).
 * Same `value`s as stored on `cvEntry.category`; keep in sync with the public site.
 */
export const CV_CATEGORY_OPTIONS = [
  {title: 'Solo exhibitions', value: 'solo'},
  {title: 'Group exhibitions', value: 'group'},
  {title: 'Education', value: 'education'},
  {title: 'Awards', value: 'award'},
  {title: 'Residencies', value: 'residency'},
  {title: 'Publications', value: 'publication'},
  {title: 'Performances', value: 'performance'},
  {title: 'Screenings', value: 'screening'},
  {title: 'Commissions', value: 'commission'},
  {title: 'Lectures', value: 'lecture'},
  {title: 'Other', value: 'other'},
] as const
