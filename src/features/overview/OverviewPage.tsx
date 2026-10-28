import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../backend/services'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/AsyncStates'
import { StatusBadge } from '../../components/StatusBadge'
import { directionLabel, formatDate, statusLabel } from '../../domain/format'
import { useAsync } from '../../hooks/useAsync'

export function OverviewPage() {
  const [params, setParams] = useSearchParams()
  const domain = params.get('domain') ?? ''
  const { data, error, loading, retry } = useAsync(async () => {
    const [overview, ...cases] = await Promise.all([
      api.getOverview(domain ? { domain } : undefined),
      api.getInvestigation('M001'),
      api.getInvestigation('M003'),
      api.getInvestigation('M007'),
      api.getInvestigation('M004'),
    ])
    return { overview, cases }
  }, [domain])

  if (error && !data) return <ErrorState message={error.message} onRetry={retry} />
  if (loading && !data) return <LoadingBlock label="Loading the portfolio" />
  if (!data) return null

  const overview = data.overview
  const portfolio = overview.portfolio

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Policy Control Office</p>
        <h1>Technology risk position</h1>
        <p className="lede">
          Four seeded breaches are ready to investigate. Additional illustrative readings show a mixed book. Two metrics stay unevaluated.
        </p>
      </header>

      <section className="panel" aria-label="Portfolio summary">
        <div className="stats">
          <div className="stat tone-red"><b>{portfolio.red}</b><span>Red</span></div>
          <div className="stat tone-amber"><b>{portfolio.amber}</b><span>Amber</span></div>
          <div className="stat tone-green"><b>{portfolio.green}</b><span>Green</span></div>
          <div className="stat tone-insufficient"><b>{portfolio.insufficientData}</b><span>Not evaluated</span></div>
          <div className="stat"><b>{portfolio.total}</b><span>In register</span></div>
        </div>
        <p className="fine">{overview.asOfLabel}</p>
        {portfolio.insufficientData > 0 && (
          <p className="fine">
            {portfolio.insufficientData} register metrics have no illustrative reading. Their status is Not evaluated, which is not a green assessment.
          </p>
        )}
      </section>

      <div className="overview-grid">
        <section>
          <div className="section-head">
            <h2>Priority investigations</h2>
            <Link to="/metrics">View metric register</Link>
          </div>
          <div className="chips" role="group" aria-label="Filter investigations by domain">
            <button type="button" className="chip" aria-pressed={domain === ''} onClick={() => setParams({})}>
              All
            </button>
            {overview.investigationDomains.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                aria-pressed={domain === item}
                onClick={() => setParams({ domain: item })}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="fine">Portfolio counts stay on the full register. This filter applies only to the investigation list.</p>
          {overview.investigations.length === 0 ? (
            <EmptyState title="No investigations in this domain" body="Choose another domain or return to all seeded cases." />
          ) : (
            <div className="inv-list">
              {overview.investigations.map((item) => (
                <Link key={item.metricId} className="inv-row" to={`/investigations/${item.metricId}`}>
                  <StatusBadge status={item.status} />
                  <div>
                    <div className="inv-title">
                      <span className="mono">{item.metricId}</span> {item.name}
                    </div>
                    <div className="meta-line">
                      {item.domain} · {item.controlId} · {item.frequency} · {directionLabel(item.direction)}
                    </div>
                    <p className="headline">{item.headline}</p>
                    <div className="meta-line">
                      {statusLabel(item.status)} since {formatDate(item.breachedOn)} · {item.illustrativeValueLabel}
                      {' · '}
                      {item.hotspotLabel ? `Hotspot: ${item.hotspotLabel}` : 'Organizational breakdown not supplied'}
                    </div>
                  </div>
                  <span className="open">Open investigation</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="stack">
          <section className="panel">
            <h2>Recent deterioration</h2>
            <ol className="timeline">
              {overview.deterioration.map((event) => (
                <li key={event.metricId}>
                  <div className="tl-top">
                    <time dateTime={event.date}>{formatDate(event.date)}</time>
                    <span className="mono">{event.metricId}</span>
                  </div>
                  <Link to={`/investigations/${event.metricId}`}>{event.label}</Link>
                </li>
              ))}
            </ol>
          </section>
          <section className="panel">
            <h2>Organizational hotspots</h2>
            <p className="fine">Shown only for M001 and M003. Figures are illustrative.</p>
            <div className="callout-list">
              {overview.hotspotCallouts.map((item) => (
                <Link key={item.metricId} className="callout" to={`/investigations/${item.metricId}`}>
                  <span className="mono">{item.metricId}</span>
                  <strong>{item.group}</strong>
                  <span>{item.statement}</span>
                </Link>
              ))}
            </div>
          </section>
          <details className="panel disclosure">
            <summary>Pending validation</summary>
            <p className="fine">
              Checks still required before the seeded stories can be treated as evidenced. This is a validation queue, not a remediation tracker. No owner or deadline was supplied.
            </p>
            {data.cases.map((item) => (
              <div key={item.metricId} className="validate-case">
                <Link to={`/investigations/${item.metricId}`}>{item.metricId}</Link>
                <ul>
                  {item.pathToGreen.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </div>
            ))}
            <h3>Data discovery</h3>
            <ul>
              <li>Confirm whether SMARTS holds metric-by-organization breakdowns.</li>
              <li>Confirm whether change and incident records can be joined to metrics.</li>
            </ul>
          </details>
        </aside>
      </div>
    </div>
  )
}
