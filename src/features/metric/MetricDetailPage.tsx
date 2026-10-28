import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../backend/services'
import { ErrorState, LoadingBlock } from '../../components/AsyncStates'
import { StatusBadge } from '../../components/StatusBadge'
import { ThresholdScale } from '../../components/ThresholdScale'
import { TrendChart } from '../../components/TrendChart'
import { directionLabel, displayOrMissing, formatDate, formatNumber } from '../../domain/format'
import { useAsync } from '../../hooks/useAsync'

export function MetricDetailPage() {
  const { metricId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => api.getMetric(metricId), [metricId])

  useEffect(() => {
    document.title = metricId ? `ControlLens — ${metricId}` : 'ControlLens — Metric'
  }, [metricId])

  if (error && !data) return <ErrorState message={error.message} onRetry={retry} />
  if (loading && !data) return <LoadingBlock label="Loading metric detail" />
  if (!data) return null

  const { metric, reading } = data

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <Link to="/metrics">Metric register</Link>
        <span aria-hidden="true">/</span>
        <span>{metric.id}</span>
      </nav>
      <header className="page-head">
        <p className="eyebrow">{metric.domain}</p>
        <div className="title-row">
          <h1>
            <span className="mono">{metric.id}</span> {metric.name}
          </h1>
          <StatusBadge status={reading.status} />
        </div>
        <dl className="meta-grid">
          <div><dt>Control</dt><dd className="mono">{metric.controlId}</dd></div>
          <div><dt>Control statement</dt><dd>{displayOrMissing(metric.controlStatement)}</dd></div>
          <div><dt>Owner function</dt><dd>{displayOrMissing(metric.ownerFunction)}</dd></div>
          <div><dt>Frequency</dt><dd>{metric.frequency}</dd></div>
          <div><dt>Direction</dt><dd>{directionLabel(metric.direction)}</dd></div>
          <div><dt>Illustrative reading</dt><dd>{reading.value == null ? 'Not supplied' : formatNumber(reading.value, metric.unit)}</dd></div>
          <div><dt>As of</dt><dd>{reading.asOf ? formatDate(reading.asOf) : 'Not supplied'}</dd></div>
          <div><dt>Breach date</dt><dd>{reading.breachedOn ? formatDate(reading.breachedOn) : 'Not supplied'}</dd></div>
        </dl>
      </header>

      <div className="detail-grid">
        <section className="panel">
          <h2>Provisional definition — pending client validation</h2>
          <p>{metric.provisionalDefinition}</p>
          <p className="provenance">{data.coverageNote}</p>
          {data.investigationAvailable && (
            <p>
              <Link className="text-button" to={`/investigations/${metric.id}`}>Open investigation</Link>
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Thresholds</h2>
          <ThresholdScale
            direction={metric.direction}
            unit={metric.unit}
            thresholds={metric.thresholds}
            value={reading.value}
          />
        </section>
      </div>

      <section className="panel">
        <h2>Trend</h2>
        {data.trend.length > 0 ? (
          <TrendChart
            points={data.trend}
            unit={metric.unit}
            thresholds={metric.thresholds}
            breachDate={reading.breachedOn}
            caption={data.trendCaption}
          />
        ) : (
          <p className="provenance">No illustrative trend was supplied for this metric. Status is not evaluated.</p>
        )}
      </section>
    </div>
  )
}
