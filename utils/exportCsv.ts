// Client-side CSV export tuned for Excel under FR/NL locales: `;` field
// separator (so comma decimals don't split cells), UTF-8 BOM (so accents
// survive), and CRLF line endings (Excel's expectation).

export interface CsvColumn<T> {
  /** Header label (already translated by the caller). */
  label: string
  /** Cell value for a row; return a string/number, or null/undefined for blank. */
  value: (row: T) => string | number | null | undefined
}

const escapeCell = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined) return ''
  const str = String(raw)
  // Quote whenever a delimiter, quote, or newline would otherwise break parsing.
  if (/[";\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export const toCsv = <T>(rows: T[], columns: CsvColumn<T>[]): string => {
  const lines = [
    columns.map((c) => escapeCell(c.label)).join(';'),
    ...rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(';')),
  ]
  return lines.join('\r\n')
}

export const downloadCsv = <T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void => {
  // Prepend a UTF-8 BOM so Excel (FR/NL) reads accents correctly.
  const csv = '\uFEFF' + toCsv(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Money for CSV: euros with a comma decimal (Excel FR/NL), no currency symbol. */
export const csvAmount = (cents: number | null | undefined): string =>
  ((cents ?? 0) / 100).toFixed(2).replace('.', ',')

/** Build a safe, dated filename stem like `thursday-live-event-joueurs-2026-06-11`. */
export const exportFilename = (parts: Array<string | null | undefined>): string => {
  const slug = parts
    .filter(Boolean)
    .join('-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const date = new Date().toISOString().slice(0, 10)
  return `${slug}-${date}`
}
