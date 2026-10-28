import type { TrendPoint, Unit } from '../backend/contracts/types'
import { formatDate, formatDateShort, formatNumber, statusLabel } from '../domain/format'

interface TrendChartProps {
  points: TrendPoint[]
  unit: Unit
  thresholds: { green: number; amber: number }
  breachDate: string | null
  caption: string | null
}

export function TrendChart({ points, unit, thresholds, breachDate, caption }: TrendChartProps) {
  if (points.length === 0) return null

  const width = 640
  const height = 196
  const pad = { left: 48, right: 16, top: 16, bottom: 32 }
  const guides = [thresholds.green, thresholds.amber]
  const values = points.map((point) => point.value)
  const min = Math.min(...values, ...guides)
  const max = Math.max(...values, ...guides)
  const span = max - min || 1
  const yOf = (value: number) => pad.top + ((max - value) / span) * (height - pad.top - pad.bottom)
  const xOf = (index: number) =>
    pad.left + (index / Math.max(points.length - 1, 1)) * (width - pad.left - pad.right)
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xOf(index)} ${yOf(point.value)}`).join(' ')
  const labelIndexes = new Set<number>([0, points.length - 1])
  if (breachDate) {
    const breachIndex = points.findIndex((point) => point.date === breachDate)
    if (breachIndex >= 0) labelIndexes.add(breachIndex)
  }
  const hasUnconfirmed = points.some((point) => point.unconfirmedAmber)

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={caption ?? 'Illustrative trend'}>
        {[min, (min + max) / 2, max].map((tick) => (
          <text key={tick} x={4} y={yOf(tick) + 4} className="chart-label">
            {formatNumber(tick, unit)}
          </text>
        ))}
        {guides.map((guide) => (
          <line
            key={guide}
            x1={pad.left}
            x2={width - pad.right}
            y1={yOf(guide)}
            y2={yOf(guide)}
            className="chart-guide"
          />
        ))}
        <path d={path} className="chart-line" />
        {points.map((point, index) => (
          <circle
            key={point.date}
            cx={xOf(index)}
            cy={yOf(point.value)}
            r={point.unconfirmedAmber ? 5 : point.date === breachDate ? 4.5 : 3.5}
            className={`chart-point point-${point.status}${point.unconfirmedAmber ? ' is-open' : ''}`}
          >
            <title>
              {formatDate(point.date)} {formatNumber(point.value, unit)} {statusLabel(point.status)}. {point.pointNote}
            </title>
          </circle>
        ))}
        {[...labelIndexes].map((index) => (
          <text key={points[index].date} x={xOf(index)} y={height - 8} textAnchor="middle" className="chart-label">
            {formatDateShort(points[index].date)}
          </text>
        ))}
      </svg>
      <figcaption>
        <ul className="legend">
          <li><i className="swatch swatch-green" /> Green threshold {formatNumber(thresholds.green, unit)}</li>
          <li><i className="swatch swatch-amber" /> Amber threshold {formatNumber(thresholds.amber, unit)}</li>
          <li><i className="swatch swatch-line" /> Illustrative reading</li>
          {hasUnconfirmed && (
            <li><i className="swatch swatch-open" /> Illustrative amber before 22 October — not a confirmed event</li>
          )}
        </ul>
        {caption && <p className="provenance">{caption}</p>}
      </figcaption>
      <details className="point-table">
        <summary>View illustrative points</summary>
        <table>
          <caption className="sr-only">Illustrative trend points</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Value</th>
              <th scope="col">Status</th>
              <th scope="col">Provenance</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <td>{formatDate(point.date)}</td>
                <td>{formatNumber(point.value, unit)}</td>
                <td>{statusLabel(point.status)}</td>
                <td>{point.pointNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
