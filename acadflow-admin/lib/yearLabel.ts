/**
 * Returns the Indian engineering year label for a given year number.
 * FE = First Year (1), SE = Second Year (2), TE = Third Year (3), BE = Final Year (4)
 */
export function getYearLabel(year: number | undefined | null): string {
  switch (year) {
    case 1: return 'FE/1st'
    case 2: return 'SE/2nd'
    case 3: return 'TE/3rd'
    case 4: return 'BE/4th'
    default: return ''
  }
}

/**
 * Short year abbreviation only: FE, SE, TE, BE
 */
export function getYearAbbr(year: number | undefined | null): string {
  switch (year) {
    case 1: return 'FE'
    case 2: return 'SE'
    case 3: return 'TE'
    case 4: return 'BE'
    default: return ''
  }
}
