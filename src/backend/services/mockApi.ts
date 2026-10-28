import { DATA_NOTICE, VALIDATION_NOTE } from '../contracts/types'
import type {
  Investigation,
  InvestigationSummary,
  MetricDetailResponse,
  MetricListItem,
  MetricListQuery,
  MetricListResponse,
  OrgContribution,
  OverviewQuery,
  OverviewResponse,
  RiskApi,
  TrendPoint,
  TrendResponse,
} from '../contracts/types'
import { investigationRecords } from '../data/investigations'
import { metricById, metrics, type RawMetric } from '../data/metrics'
import { hotspotCallouts, orgByMetricId } from '../data/orgContribution'
import { trends } from '../data/trends'
import { evaluateStatus, statusRank } from '../../domain/evaluateStatus'
import { formatDate, formatNumber } from '../../domain/format'
import { delay } from './delay'
import { notFound } from './errors'

const SEEDED_ORDER = ['M001', 'M003', 'M007', 'M004']

const deterioration = [
  { date: '2026-10-14', metricId: 'M001', label: 'Critical Patch Compliance went red' },
  {
    date: '2026-10-16',
    metricId: 'M003',
    label: 'Critical vulnerabilities older than 30 days went red',
  },
  { date: '2026-10-18', metricId: 'M007', label: 'Change Failure Rate went red' },
  {
    date: '2026-10-22',
    metricId: 'M004',
    label: 'Backup Success Rate went red. It had gone amber earlier; the first amber date was not supplied.',
  },
]

function requireMetric(metricId: string): RawMetric {
  const metric = metricById.get(metricId)
  if (!metric) throw notFound(`No metric ${metricId} is in the illustrative register.`)
  return metric
}

function toListItem(metric: RawMetric): MetricListItem {
  const status = evaluateStatus(metric.value, metric.direction, metric.thresholds)
  return {
    metric,
    investigationAvailable: metric.id in investigationRecords,
    reading: {
      value: metric.value,
      asOf: metric.asOf,
      origin: metric.value == null ? 'not_supplied' : 'illustrative_synthetic',
      status,
      statusBasis: metric.value == null ? 'not_evaluable' : 'illustrative_reading',
      breachedOn: metric.breachedOn,
    },
  }
}

function buildTrend(metric: RawMetric): TrendPoint[] {
  return (trends[metric.id] ?? []).map((point) => {
    const status = evaluateStatus(point.value, metric.direction, metric.thresholds)
    const unconfirmedAmber = Boolean(point.unconfirmedAmber) && status === 'amber'
    return {
      date: point.date,
      value: point.value,
      status,
      origin: 'illustrative_synthetic',
      unconfirmedAmber,
      pointNote: unconfirmedAmber
        ? 'Illustrative synthetic amber point. Not a confirmed historical event. The date this metric first entered amber was not supplied.'
        : 'Illustrative synthetic value. Not a SMARTS reading.',
    }
  })
}

function valueLabel(metric: RawMetric): string {
  if (metric.value == null) return 'No illustrative reading'
  const formatted = formatNumber(metric.value, metric.unit)
  if (metric.id === 'M007') return `${formatted} illustrative, week ending ${formatDate(metric.asOf)}`
  return `${formatted} illustrative`
}

function unavailableOrg(metricId: string): OrgContribution {
  const reason =
    metricId === 'M007'
      ? 'Organizational contribution was not supplied for M007. The Payments release is a related change signal, not a group breakdown.'
      : metricId === 'M004'
        ? 'Organizational contribution was not supplied for M004.'
        : `Organizational contribution was not supplied for ${metricId}.`
  return {
    availability: 'unavailable',
    origin: 'not_supplied',
    reason,
    methodNote: null,
    shareLabel: '',
    groups: [],
  }
}

function buildOrg(metricId: string): OrgContribution {
  requireMetric(metricId)
  return orgByMetricId[metricId] ?? unavailableOrg(metricId)
}

function buildDetail(metricId: string): MetricDetailResponse {
  const metric = requireMetric(metricId)
  const item = toListItem(metric)
  return {
    metric,
    reading: item.reading,
    trend: buildTrend(metric),
    coverageNote: metric.coverageNote,
    trendCaption: metric.trendCaption,
    investigationAvailable: item.investigationAvailable,
  }
}

function buildSummaries(): InvestigationSummary[] {
  return SEEDED_ORDER.map((metricId) => {
    const metric = requireMetric(metricId)
    const record = investigationRecords[metricId]
    const org = orgByMetricId[metricId]
    const hotspot = org?.groups.find((group) => group.hotspot)
    return {
      metricId,
      name: metric.name,
      domain: metric.domain,
      controlId: metric.controlId,
      frequency: metric.frequency,
      direction: metric.direction,
      status: evaluateStatus(metric.value, metric.direction, metric.thresholds),
      breachedOn: metric.breachedOn ?? '',
      illustrativeValueLabel: valueLabel(metric),
      hotspotLabel: hotspot?.name ?? null,
      headline: record.headline,
    }
  })
}

function portfolioOf(items: MetricListItem[]): OverviewResponse['portfolio'] {
  const portfolio = { red: 0, amber: 0, green: 0, insufficientData: 0, total: items.length }
  for (const item of items) {
    if (item.reading.status === 'red') portfolio.red += 1
    else if (item.reading.status === 'amber') portfolio.amber += 1
    else if (item.reading.status === 'green') portfolio.green += 1
    else portfolio.insufficientData += 1
  }
  return portfolio
}

function uniqueInOrder(values: string[]): string[] {
  return [...new Set(values)]
}

const ALL_ITEMS = metrics.map(toListItem)
const ALL_SUMMARIES = buildSummaries()

function matches(item: MetricListItem, query: MetricListQuery | undefined): boolean {
  if (!query) return true
  if (query.domain && item.metric.domain !== query.domain) return false
  if (query.status && item.reading.status !== query.status) return false
  if (query.frequency && item.metric.frequency !== query.frequency) return false
  if (query.q) {
    const haystack = `${item.metric.id} ${item.metric.name} ${item.metric.domain} ${item.metric.controlId}`.toLowerCase()
    if (!haystack.includes(query.q.trim().toLowerCase())) return false
  }
  return true
}

function sortItems(items: MetricListItem[]): MetricListItem[] {
  return [...items].sort((a, b) => {
    const byStatus = statusRank(a.reading.status) - statusRank(b.reading.status)
    if (byStatus !== 0) return byStatus
    const aDate = a.reading.breachedOn ?? '9999-99-99'
    const bDate = b.reading.breachedOn ?? '9999-99-99'
    if (aDate !== bDate) return aDate < bDate ? -1 : 1
    return a.metric.id < b.metric.id ? -1 : 1
  })
}

export const api: RiskApi = {
  async getOverview(query?: OverviewQuery): Promise<OverviewResponse> {
    await delay()
    const domain = query?.domain?.trim()
    const investigations = domain ? ALL_SUMMARIES.filter((item) => item.domain === domain) : ALL_SUMMARIES
    return {
      dataNotice: DATA_NOTICE,
      asOfLabel:
        'Illustrative readings as of 27 October 2026, except Change Failure Rate, which is the week ending 25 October 2026.',
      portfolio: portfolioOf(ALL_ITEMS),
      investigations,
      investigationDomains: uniqueInOrder(ALL_SUMMARIES.map((item) => item.domain)),
      deterioration,
      hotspotCallouts,
      validationNote: VALIDATION_NOTE,
    }
  },

  async listMetrics(query?: MetricListQuery): Promise<MetricListResponse> {
    await delay()
    return {
      items: sortItems(ALL_ITEMS.filter((item) => matches(item, query))),
      facets: {
        domains: uniqueInOrder(metrics.map((metric) => metric.domain)),
        frequencies: ['Daily', 'Weekly', 'Monthly'],
        statuses: ['red', 'amber', 'green', 'insufficient_data'],
      },
    }
  },

  async getMetric(metricId: string): Promise<MetricDetailResponse> {
    await delay()
    return buildDetail(metricId)
  },

  async getTrend(metricId: string): Promise<TrendResponse> {
    await delay()
    const detail = buildDetail(metricId)
    return {
      metricId,
      origin: detail.trend.length > 0 ? 'illustrative_synthetic' : 'not_supplied',
      caption: detail.trendCaption,
      points: detail.trend,
    }
  },

  async listInvestigations(): Promise<{ items: InvestigationSummary[] }> {
    await delay()
    return { items: ALL_SUMMARIES }
  },

  async getInvestigation(metricId: string): Promise<Investigation> {
    await delay()
    requireMetric(metricId)
    const record = investigationRecords[metricId]
    if (!record) throw notFound(`No seeded investigation is available for ${metricId}.`)
    return {
      ...record,
      orgContribution: buildOrg(metricId),
      validationNote: VALIDATION_NOTE,
    }
  },

  async getOrgContribution(metricId: string): Promise<OrgContribution> {
    await delay()
    return buildOrg(metricId)
  },
}
