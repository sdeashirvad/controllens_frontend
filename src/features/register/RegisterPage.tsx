import { Link, useSearchParams } from 'react-router-dom'
import { DATA_NOTICE } from '../../backend/contracts/types'
import type { MetricListItem } from '../../backend/contracts/types'
import { api } from '../../backend/services'
import { EmptyState, ErrorState, LoadingBlock } from '../../components/AsyncStates'
import { StatusBadge } from '../../components/StatusBadge'
import { isRagStatus } from '../../domain/evaluateStatus'
import { directionLabel, formatDate, formatNumber, isFrequency, statusLabel } from '../../domain/format'
import { useAsync } from '../../hooks/useAsync'

export function RegisterPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const domain = params.get('domain') ?? ''
  const statusParam = params.get('status') ?? ''
  const frequencyParam = params.get('frequency') ?? ''
  const status = isRagStatus(statusParam) ? statusParam : undefined
  const frequency = isFrequency(frequencyParam) ? frequencyParam : undefined

  const { data, error, loading, retry } = useAsync(
    () => api.listMetrics({ q, domain, status, frequency }),
    [q, domain, status ?? '', frequency ?? ''],
  )

  function update(next: Record<string, string>) {
    const merged = { q, domain, status: statusParam, frequency: frequencyParam, ...next }
    const cleaned: Record<string, string> = {}
    for (const [key, value] of Object.entries(merged)) {
      if (value) cleaned[key] = value
    }
    setParams(cleaned)
  }

  function exportCsv() {
    if (!data || data.items.length === 0) return
    const csv = buildRegisterCsv(data.items)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'controllens-metric-register.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (error && !data) return <ErrorState message={error.message} onRetry={retry} />
  if (loading && !data) return <LoadingBlock label="Loading the metric register" />
  if (!data) return null

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Metric register</p>
        <h1>Control metrics</h1>
        <p className="lede">
          Ten illustrative metrics. Definitions are provisional. Owner function is Technology Risk. Control statements were not supplied.
        </p>
      </header>

      <div className="filters">
        <label className="filter grow">
          Search
          <input
            value={q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Name, id, domain, or control"
            type="search"
          />
        </label>
        <label className="filter">
          Domain
          <select value={domain} onChange={(event) => update({ domain: event.target.value })}>
            <option value="">All</option>
            {data.facets.domains.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="filter">
          Status
          <select value={status ?? ''} onChange={(event) => update({ status: event.target.value })}>
            <option value="">All</option>
            {data.facets.statuses.map((item) => (
              <option key={item} value={item}>{statusLabel(item)}</option>
            ))}
          </select>
        </label>
        <label className="filter">
          Frequency
          <select value={frequency ?? ''} onChange={(event) => update({ frequency: event.target.value })}>
            <option value="">All</option>
            {data.facets.frequencies.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <button type="button" className="secondary" onClick={() => setParams({})}>
          Clear
        </button>
        <button type="button" className="secondary" onClick={exportCsv} disabled={data.items.length === 0}>
          Export CSV
        </button>
      </div>
      <p className="fine">
        {data.items.length} shown. Sorted by status, then breach date. Export CSV downloads this view, including provenance. Readings are illustrative.
        {loading ? ' Updating.' : ''}
      </p>

      {data.items.length === 0 ? (
        <EmptyState title="No metrics match this filter" body="Clear the search or choose a broader status, domain, or frequency." />
      ) : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Technology risk metric register</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Metric</th>
                <th scope="col">Domain</th>
                <th scope="col">Control</th>
                <th scope="col">Frequency</th>
                <th scope="col">Direction</th>
                <th scope="col">Green</th>
                <th scope="col">Amber</th>
                <th scope="col">Illustrative reading</th>
                <th scope="col">Status</th>
                <th scope="col">Breach</th>
                <th scope="col">Investigation</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.metric.id}>
                  <td className="mono">{item.metric.id}</td>
                  <td>
                    <Link to={`/metrics/${item.metric.id}`}>{item.metric.name}</Link>
                  </td>
                  <td>{item.metric.domain}</td>
                  <td className="mono">{item.metric.controlId}</td>
                  <td>{item.metric.frequency}</td>
                  <td>{directionLabel(item.metric.direction)}</td>
                  <td>{formatNumber(item.metric.thresholds.green, item.metric.unit)}</td>
                  <td>{formatNumber(item.metric.thresholds.amber, item.metric.unit)}</td>
                  <td>{item.reading.value == null ? 'Not supplied' : formatNumber(item.reading.value, item.metric.unit)}</td>
                  <td><StatusBadge status={item.reading.status} /></td>
                  <td>{item.reading.breachedOn ? formatDate(item.reading.breachedOn) : 'Not supplied'}</td>
                  <td>
                    {item.investigationAvailable ? (
                      <Link to={`/investigations/${item.metric.id}`}>Open</Link>
                    ) : (
                      <span className="muted">No seeded investigation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function csvCell(value: string | number | null): string {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function buildRegisterCsv(items: MetricListItem[]): string {
  const headers = [
    'metric_id',
    'metric_name',
    'domain',
    'control_id',
    'control_statement',
    'owner_function',
    'frequency',
    'direction',
    'unit',
    'green_threshold',
    'amber_threshold',
    'provisional_definition',
    'illustrative_reading',
    'reading_as_of',
    'reading_origin',
    'status',
    'status_basis',
    'breach_date',
    'investigation_available',
    'data_notice',
  ]
  const lines = items.map((item) =>
    [
      item.metric.id,
      item.metric.name,
      item.metric.domain,
      item.metric.controlId,
      item.metric.controlStatement,
      item.metric.ownerFunction,
      item.metric.frequency,
      item.metric.direction,
      item.metric.unit,
      item.metric.thresholds.green,
      item.metric.thresholds.amber,
      item.metric.provisionalDefinition,
      item.reading.value,
      item.reading.asOf,
      item.reading.origin,
      item.reading.status,
      item.reading.statusBasis,
      item.reading.breachedOn,
      item.investigationAvailable ? 'yes' : 'no',
      DATA_NOTICE,
    ]
      .map(csvCell)
      .join(','),
  )
  return `\uFEFF${headers.join(',')}\n${lines.join('\n')}\n`
}
