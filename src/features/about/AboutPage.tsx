import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="eyebrow">About</p>
        <h1>ControlLens</h1>
        <p className="lede">
          A Technology Risk Intelligence workspace for the Policy Control Office, risk officers, and technology committees.
        </p>
      </header>
      <section className="panel stack">
        <p>
          The demonstration shows how a future solution could summarize a metric against its control and thresholds, investigate a red breach, and relate that breach to an organizational hotspot where the data supports it.
        </p>
        <p>
          The four seeded cases are M001, M003, M007, and M004. Organizational contribution is shown only for M001 and M003. Six other register metrics stay unevaluated because no illustrative reading was supplied.
        </p>
        <p className="provenance">
          Illustrative demo data — not connected to SMARTS. Summaries are deterministic mocks. Snowflake Cortex is not running, and no remediation plan is approved by this screen.
        </p>
        <p>
          <Link to="/architecture">View the target architecture</Link>
        </p>
      </section>
    </div>
  )
}
