import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../backend/services'
import { ErrorState, LoadingBlock } from '../../components/AsyncStates'
import { HotspotChart } from '../../components/HotspotChart'
import { StatusBadge } from '../../components/StatusBadge'
import { ThresholdScale } from '../../components/ThresholdScale'
import { TrendChart } from '../../components/TrendChart'
import { directionLabel, displayOrMissing, formatDate, formatNumber } from '../../domain/format'
import { useAsync } from '../../hooks/useAsync'

export function InvestigationPage() {
  const { metricId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(async () => {
    const [investigation, detail] = await Promise.all([
      api.getInvestigation(metricId),
      api.getMetric(metricId),
    ])
    return { investigation, detail }
  }, [metricId])

  useEffect(() => {
    document.title = metricId ? `ControlLens — Investigation ${metricId}` : 'ControlLens — Investigation'
  }, [metricId])

  if (error && !data) return <ErrorState message={error.message} onRetry={retry} />
  if (loading && !data) return <LoadingBlock label="Loading investigation" />
  if (!data) return null

  const { investigation, detail } = data
  const { metric, reading } = detail
  const org = investigation.orgContribution

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Overview</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/metrics/${metric.id}`}>{metric.id}</Link>
        <span aria-hidden="true">/</span>
        <span>Investigation</span>
      </nav>

      <header className="page-head">
        <div className="title-row">
          <div>
            <p className="eyebrow">Investigation · {metric.domain}</p>
            <h1>
              <span className="mono">{metric.id}</span> {metric.name}
            </h1>
          </div>
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
        <p>
          <Link to="/">Back to overview</Link>
        </p>
      </header>

      <div className="workbench">
        <div className="stack">
          <section className="panel summary">
            <p className="eyebrow">Illustrative summary</p>
            <h2>What the metric result means</h2>
            <p className="definition-label">Provisional definition — pending client validation</p>
            <p>{metric.provisionalDefinition}</p>
            <p>{investigation.summary.text}</p>
            <p className="fine">{investigation.summary.disclaimer}</p>
          </section>

          <p className="provenance">{investigation.timelineNote}</p>

          <section className="panel">
            <h2>Illustrative trend</h2>
            <TrendChart
              points={detail.trend}
              unit={metric.unit}
              thresholds={metric.thresholds}
              breachDate={reading.breachedOn}
              caption={detail.trendCaption}
            />
          </section>

          <section className="split">
            <div className="panel">
              <h2>What changed</h2>
              <p>{investigation.whatChanged}</p>
            </div>
            <div className="panel">
              <h2>Why it matters</h2>
              <p>{investigation.whyItMatters}</p>
            </div>
          </section>

          <section className="panel">
            <h2>Breach timeline</h2>
            <ol className="timeline">
              {investigation.timeline.map((event) => (
                <li key={`${event.date ?? 'undated'}-${event.label}`}>
                  <div className="tl-top">
                    <span className={event.kind === 'scenario_fact' ? 'tag tag-fact' : 'tag tag-illustrative'}>
                      {event.provenanceLabel}
                    </span>
                    <time>{event.date ? formatDate(event.date) : 'Date not supplied'}</time>
                  </div>
                  <p>{event.label}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel">
            <h2>Causal signals, evidence, and gaps</h2>
            <div className="stack">
              {investigation.signals.map((signal) => (
                <article
                  key={signal.id}
                  className={signal.classification === 'hypothesis' ? 'signal is-hypothesis' : 'signal'}
                >
                  <div className="tl-top">
                    <span className={signal.classification === 'hypothesis' ? 'tag tag-hypothesis' : 'tag tag-fact'}>
                      {signal.classification === 'hypothesis' ? 'Hypothesis' : 'Scenario fact'}
                    </span>
                    <h3>{signal.title}</h3>
                  </div>
                  <p>{signal.statement}</p>
                  <p><strong>Evidence on hand. </strong>{signal.evidenceNote}</p>
                  <h4>Still to validate</h4>
                  <ul>
                    {signal.gaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Path to validate</h2>
            <p className="provenance">{investigation.pathToGreen.disclaimer}</p>
            <div className="split">
              <div>
                <h3>Checks</h3>
                <ol>
                  {investigation.pathToGreen.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3>Possible actions</h3>
                <ul>
                  {investigation.pathToGreen.possibleActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <h2>Threshold position</h2>
            <ThresholdScale
              direction={metric.direction}
              unit={metric.unit}
              thresholds={metric.thresholds}
              value={reading.value}
            />
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>Organizational contribution</h2>
              <span className={org.availability === 'available' ? 'tag tag-illustrative' : 'tag'}>
                {org.availability === 'available' ? 'Illustrative' : 'Not supplied'}
              </span>
            </div>
            {org.availability === 'available' ? (
              <>
                <p className="fine">{org.methodNote}</p>
                <HotspotChart groups={org.groups} unit={metric.unit} shareLabel={org.shareLabel} />
              </>
            ) : (
              <p className="provenance">{org.reason}</p>
            )}
          </section>
          <section className="panel">
            <h2>Data lineage</h2>
            <dl className="lineage">
              {investigation.lineage.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="panel note-panel">
            <h2>Data still to verify</h2>
            <p>{investigation.validationNote}</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
