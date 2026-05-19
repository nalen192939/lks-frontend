export const normalizeSearchText = (value?: unknown) => {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const searchMatches = (value: unknown, query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const normalizedValue = normalizeSearchText(value)
  if (!normalizedValue) return false

  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .every((token) => normalizedValue.includes(token))
}

export const searchText = (...values: unknown[]) => {
  return values
    .filter((value) => value !== null && value !== undefined && value !== '')
    .join(' ')
}
