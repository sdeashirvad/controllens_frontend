import type { Direction, Unit } from '../backend/contracts/types'
import { THRESHOLD_BOUNDARY_NOTE } from '../domain/evaluateStatus'
import { formatNumber, thresholdRule } from '../domain/format'

interface ThresholdScaleProps {
  direction: Direction
  unit: Unit
  thresholds: { green: number; amber: number }
  value: number | null
}

export function ThresholdScale({ direction, unit, thresholds, value }: ThresholdScaleProps) {
  const pad = unit === 'count' ? 2 : unit === 'hrs' ? 0.5 : 1
  const anchors = [thresholds.green, thresholds.amber, ...(value == null ? [] : [value])]
  const low = Math.min(...anchors) - pad
  const high = Math.max(...anchors) + pad
  const span = high - low || 1
  const pos = (point: number) => ((point - low) / span) * 100
  const marker = value == null ? null : Math.min(100, Math.max(0, pos(value)))

  const greenEnd = direction === 'higher_is_better' ? 100 : pos(thresholds.green)
  const greenStart = direction === 'higher_is_better' ? pos(thresholds.green) : 0
  const amberStart = direction === 'higher_is_better' ? pos(thresholds.amber) : pos(thresholds.green)
  const amberEnd = direction === 'higher_is_better' ? pos(thresholds.green) : pos(thresholds.amber)
  const redStart = direction === 'higher_is_better' ? 0 : pos(thresholds.amber)
  const redEnd = direction === 'higher_is_better' ? pos(thresholds.amber) : 100

  return (
    <div className="threshold">
      <div className="scale" aria-hidden="true">
        <span className="zone zone-red" style={{ left: `${redStart}%`, width: `${redEnd - redStart}%` }} />
        <span className="zone zone-amber" style={{ left: `${amberStart}%`, width: `${amberEnd - amberStart}%` }} />
        <span className="zone zone-green" style={{ left: `${greenStart}%`, width: `${greenEnd - greenStart}%` }} />
        {marker != null && <span className="marker" style={{ left: `${marker}%` }} />}
      </div>
      <p className="threshold-rule">{thresholdRule(direction, thresholds, unit)}</p>
      <p className="fine">
        {value == null
          ? 'No illustrative reading is plotted.'
          : `Illustrative reading ${formatNumber(value, unit)} is marked on the scale.`}
      </p>
      <p className="fine">{THRESHOLD_BOUNDARY_NOTE}</p>
    </div>
  )
}
