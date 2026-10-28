import type { RagStatus } from '../backend/contracts/types'
import { statusLabel } from '../domain/format'

export function StatusBadge({ status }: { status: RagStatus }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>
}
