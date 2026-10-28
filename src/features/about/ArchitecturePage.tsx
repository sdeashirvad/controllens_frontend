import { useState } from 'react'

const FLOW = [
  {
    title: 'SMARTS and operational data',
    body: 'Metric results, change records, and incident records would be the source. This demo does not read them.',
  },
  {
    title: 'Snowflake',
    body: 'The intended store for governed metric history and the context needed to join a breach to related activity.',
  },
  {
    title: 'Cortex Analyst / Agents',
    body: 'The intended place for a metric-aware summary, a red-breach investigation, and hotspot questions. Nothing on this screen calls Cortex.',
  },
  {
    title: 'controllens_backend API',
    body: 'A future service that would implement the same request and response contracts the interface already uses.',
  },
  {
    title: 'This frontend',
    body: 'Renders those contracts. In this demonstration the calls are answered by the in-app mock, not by a network service.',
  },
]

const DESIGN = [
  {
    title: 'Ingress',
    body: 'Scheduled extracts or event hooks publish metric snapshots, change records, and incident records from SMARTS. The frontend never connects to SMARTS directly.',
  },
  {
    title: 'Durable queues',
    body: 'Separate queues for metrics, changes, and incidents absorb bursts and decouple producers from workers. A dead-letter queue holds messages that still fail after retries. This is a proposed production control, not a component running in the demo.',
  },
  {
    title: 'Workers',
    body: 'Stateless workers scale out. They normalize records, apply the shared threshold rules, and attempt joins. Each job is idempotent on source key and as-of date, with bounded retries. Workers assemble evidence. They do not declare a proven root cause.',
  },
  {
    title: 'Snowflake',
    body: 'Curated tables hold metric history, thresholds, and organizational contribution only when the source provides it. Cortex would read governed views. Missing joins stay missing rather than being filled in.',
  },
  {
    title: 'Cortex behind the API',
    body: 'The backend, not the browser, would call Cortex Analyst or an agent with the metric contract and retrieved evidence. A stored draft would keep model provenance. This demo does not make that call.',
  },
  {
    title: 'API and frontend',
    body: 'controllens_backend would serve the contracts this UI already uses. The read path can be cached. The frontend swaps the mock client for HTTP without a screen rewrite.',
  },
  {
    title: 'Reliability',
    body: 'Health checks, queue-depth alerts, at-least-once delivery, and horizontal workers are the reliability bar. No single worker is on the request path. Secrets stay off the frontend.',
  },
]

export function ArchitecturePage() {
  const [tab, setTab] = useState<'flow' | 'design'>('flow')
  const steps = tab === 'flow' ? FLOW : DESIGN

  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="eyebrow">Proposed architecture</p>
        <h1>{tab === 'flow' ? 'Target flow' : 'Proposed tech design'}</h1>
        <p className="lede">
          {tab === 'flow'
            ? 'How a later release could connect operational data to this workspace.'
            : 'A production shape for scale and reliability. Queues and workers are proposed. They are not running.'}
        </p>
      </header>
      <div className="page-tabs" role="tablist" aria-label="Architecture views">
        <button type="button" role="tab" aria-selected={tab === 'flow'} onClick={() => setTab('flow')}>
          Target flow
        </button>
        <button type="button" role="tab" aria-selected={tab === 'design'} onClick={() => setTab('design')}>
          Proposed tech design
        </button>
      </div>
      <p className="provenance">Target architecture. Not a live integration. Snowflake, Cortex, and SMARTS are not connected.</p>
      <ol className="flow">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="flow-index">{index + 1}</span>
            <details className="flow-step">
              <summary>{step.title}</summary>
              <p>{step.body}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  )
}
