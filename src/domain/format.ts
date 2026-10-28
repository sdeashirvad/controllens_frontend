import type { Direction, Frequency, RagStatus, Unit } from '../backend/contracts/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(iso: string | null): string {
  if (!iso) return 'Date not supplied'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return iso
  return `${Number(match[3])} ${month} ${match[1]}`
}

export function formatDateShort(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return iso
  return `${Number(match[3])} ${month}`
}

export function formatNumber(value: number, unit: Unit): string {
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit === 'hrs') return Number.isInteger(value) ? `${value} hrs` : `${value.toFixed(1)} hrs`
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function statusLabel(status: RagStatus): string {
  switch (status) {
    case 'green':
      return 'Green'
    case 'amber':
      return 'Amber'
    case 'red':
      return 'Red'
    case 'insufficient_data':
      return 'Not evaluated'
  }
}

export function directionLabel(direction: Direction): string {
  return direction === 'higher_is_better' ? 'Higher is better' : 'Lower is better'
}

export function thresholdRule(
  direction: Direction,
  thresholds: { green: number; amber: number },
  unit: Unit,
): string {
  const green = formatNumber(thresholds.green, unit)
  const amber = formatNumber(thresholds.amber, unit)
  if (direction === 'higher_is_better') {
    return `Green at or above ${green}. Amber at or above ${amber} and below ${green}. Red below ${amber}.`
  }
  return `Green at or below ${green}. Amber above ${green} and at or below ${amber}. Red above ${amber}.`
}

export function isFrequency(value: string): value is Frequency {
  return value === 'Daily' || value === 'Weekly' || value === 'Monthly'
}

export function displayOrMissing(value: string | null): string {
  return value ?? 'Not supplied'
}
