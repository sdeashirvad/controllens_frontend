export const DATA_NOTICE = 'Illustrative demo data — not connected to SMARTS'

export const SUMMARY_DISCLAIMER =
  'Deterministic illustrative summary. Not a Snowflake Cortex response. Not connected to SMARTS.'

export const PATH_DISCLAIMER =
  'Illustrative checks only. No owner, deadline, or approved plan is implied.'

export const VALIDATION_NOTE =
  'Pending verification: whether SMARTS holds metric-by-organization breakdowns, and whether change and incident records can be joined to metrics.'

export type Direction = 'higher_is_better' | 'lower_is_better'
export type RagStatus = 'green' | 'amber' | 'red' | 'insufficient_data'
export type DataOrigin = 'supplied_scenario' | 'illustrative_synthetic' | 'not_supplied'
export type Availability = 'available' | 'unavailable'
export type Frequency = 'Daily' | 'Weekly' | 'Monthly'
export type Unit = '%' | 'count' | 'hrs'
export type DefinitionStatus = 'provisional_pending_validation'

export interface MetricDefinition {
  id: string
  name: string
  domain: string
  controlId: string
  frequency: Frequency
  direction: Direction
  unit: Unit
  thresholds: { green: number; amber: number }
  provisionalDefinition: string
  definitionStatus: DefinitionStatus
  ownerFunction: string | null
  controlStatement: string | null
}

export interface MetricReading {
  value: number | null
  asOf: string | null
  origin: DataOrigin
  status: RagStatus
  statusBasis: 'illustrative_reading' | 'not_evaluable'
  breachedOn: string | null
}

export interface TrendPoint {
  date: string
  value: number
  status: RagStatus
  origin: 'illustrative_synthetic'
  unconfirmedAmber: boolean
  pointNote: string
}

export interface OrgGroup {
  name: string
  weightPercent: number | null
  value: number
  shareOfGapPercent: number
  status: RagStatus
  hotspot: boolean
}

export interface OrgContribution {
  availability: Availability
  origin: 'illustrative_synthetic' | 'not_supplied'
  reason: string
  methodNote: string | null
  shareLabel: string
  groups: OrgGroup[]
}

export interface Signal {
  id: string
  classification: 'scenario_fact' | 'hypothesis'
  title: string
  statement: string
  evidenceNote: string
  gaps: string[]
}

export interface TimelineEvent {
  date: string | null
  label: string
  kind: 'illustrative_reading' | 'scenario_fact'
  provenanceLabel: string
}

export interface LineageItem {
  label: string
  detail: string
}

export interface Investigation {
  metricId: string
  headline: string
  summary: { text: string; disclaimer: string }
  whatChanged: string
  whyItMatters: string
  timelineNote: string
  timeline: TimelineEvent[]
  signals: Signal[]
  lineage: LineageItem[]
  orgContribution: OrgContribution
  pathToGreen: { disclaimer: string; checks: string[]; possibleActions: string[] }
  validationNote: string
}

export interface InvestigationSummary {
  metricId: string
  name: string
  domain: string
  controlId: string
  frequency: Frequency
  direction: Direction
  status: RagStatus
  breachedOn: string
  illustrativeValueLabel: string
  hotspotLabel: string | null
  headline: string
}

export interface OverviewResponse {
  dataNotice: string
  asOfLabel: string
  portfolio: {
    red: number
    amber: number
    green: number
    insufficientData: number
    total: number
  }
  investigations: InvestigationSummary[]
  investigationDomains: string[]
  deterioration: Array<{ date: string; metricId: string; label: string }>
  hotspotCallouts: Array<{ metricId: string; group: string; statement: string }>
  validationNote: string
}

export interface MetricListQuery {
  q?: string
  domain?: string
  status?: RagStatus
  frequency?: Frequency
}

export interface OverviewQuery {
  domain?: string
}

export interface MetricListItem {
  metric: MetricDefinition
  reading: MetricReading
  investigationAvailable: boolean
}

export interface MetricListResponse {
  items: MetricListItem[]
  facets: {
    domains: string[]
    frequencies: Frequency[]
    statuses: RagStatus[]
  }
}

export interface MetricDetailResponse {
  metric: MetricDefinition
  reading: MetricReading
  trend: TrendPoint[]
  coverageNote: string
  trendCaption: string | null
  investigationAvailable: boolean
}

export interface TrendResponse {
  metricId: string
  origin: DataOrigin
  caption: string | null
  points: TrendPoint[]
}

export interface RiskApi {
  getOverview(query?: OverviewQuery): Promise<OverviewResponse>
  listMetrics(query?: MetricListQuery): Promise<MetricListResponse>
  getMetric(metricId: string): Promise<MetricDetailResponse>
  getTrend(metricId: string): Promise<TrendResponse>
  listInvestigations(): Promise<{ items: InvestigationSummary[] }>
  getInvestigation(metricId: string): Promise<Investigation>
  getOrgContribution(metricId: string): Promise<OrgContribution>
}
