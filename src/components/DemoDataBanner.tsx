import { DATA_NOTICE } from '../backend/contracts/types'

export function DemoDataBanner() {
  return (
    <div className="banner" role="note">
      <strong>{DATA_NOTICE}</strong>
      <span>Deterministic mock for a stakeholder demonstration. Snowflake Cortex is not connected.</span>
    </div>
  )
}
