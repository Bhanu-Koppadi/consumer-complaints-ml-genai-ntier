import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  getAdminComplaints,
  getAdminStatistics,
} from '../api/client'
import type {
  AdminComplaintItem,
  AdminStatisticsResponse,
} from '../types/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import ConfidenceBar from '../components/ConfidenceBar'

const CATEGORY_OPTIONS = [
  'All',
  'Billing Issue',
  'Service Quality',
  'Delivery Problem',
  'Product Defect',
  'Customer Support',
  'Other',
]

const PAGE_SIZES = [10, 20, 50]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminPage() {
  const [stats, setStats] = useState<AdminStatisticsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [complaints, setComplaints] = useState<AdminComplaintItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [statusView, setStatusView] = useState<'all' | 'active' | 'resolved'>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [minConfidence, setMinConfidence] = useState<string>('')
  const [complaintsLoading, setComplaintsLoading] = useState(true)
  const [complaintsError, setComplaintsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatsLoading(true)
    setStatsError(null)
    getAdminStatistics()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setStatsError(
            axios.isAxiosError(err) && err.response?.status === 403
              ? 'Admin access required'
              : err instanceof Error ? err.message : 'Failed to load statistics'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setComplaintsLoading(true)
    setComplaintsError(null)
    const category = categoryFilter === 'All' ? undefined : categoryFilter
    const minConf = minConfidence === '' ? undefined : parseFloat(minConfidence)
    if (minConf !== undefined && (isNaN(minConf) || minConf < 0 || minConf > 1)) {
      setComplaintsLoading(false)
      return
    }
    getAdminComplaints(page, limit, category, minConf, statusView)
      .then((data) => {
        if (!cancelled) {
          setComplaints(data.complaints)
          setTotal(data.total)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setComplaintsError(
            axios.isAxiosError(err) && err.response?.status === 403
              ? 'Admin access required'
              : err instanceof Error ? err.message : 'Failed to load complaints'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setComplaintsLoading(false)
      })
    return () => { cancelled = true }
  }, [page, limit, categoryFilter, minConfidence, statusView])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasFilters = categoryFilter !== 'All' || minConfidence !== '' || statusView !== 'all'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        {/* Statistics */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Statistics
          </h2>
          {statsLoading && <LoadingSpinner message="Loading statistics…" />}
          {statsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              {statsError}
            </div>
          )}
          {!statsLoading && !statsError && stats && (
            <>
              {/* Row 1: Core metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    Total complaints
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_complaints}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    Average confidence
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.average_confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    Low confidence (&lt;0.5)
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.low_confidence_count}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    Date range
                  </p>
                  <p className="text-sm text-gray-700">
                    {stats.date_range.start ?? '—'} to {stats.date_range.end ?? '—'}
                  </p>
                </div>
              </div>

              {/* Row 2: Severity KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">
                    High severity (P1)
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.high_severity_count}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">
                    Medium severity (P2)
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.medium_severity_count}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-1">
                    Low severity (P3)
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.low_severity_count}
                  </p>
                </div>
              </div>

              {/* Row 3: Routing KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-1">
                    Auto-send eligible
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.auto_send_count}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">
                    Review required
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.review_required_count}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">
                    Escalated
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.escalated_count}
                  </p>
                </div>
              </div>
            </>
          )}
          {!statsLoading && !statsError && stats && Object.keys(stats.by_category).length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                By category
              </p>
              <ul className="space-y-2">
                {Object.entries(stats.by_category)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <li
                      key={cat}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{cat}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>

        {/* Complaints list */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {statusView === 'resolved' ? 'Resolved Complaints' : statusView === 'active' ? 'Active Complaints' : 'Complaints'}
          </h2>

          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setStatusView('active')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusView === 'active'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusView('resolved')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusView === 'resolved'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Resolved
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusView('all')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusView === 'all'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Min confidence (0–1)
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                placeholder="e.g. 0.5"
                value={minConfidence}
                onChange={(e) => {
                  setMinConfidence(e.target.value)
                  setPage(1)
                }}
                className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Per page
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {complaintsLoading && (
            <LoadingSpinner message="Loading complaints…" />
          )}
          {complaintsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 mb-4">
              {complaintsError}
            </div>
          )}
          {!complaintsLoading && !complaintsError && (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{' '}
                {total}
                {hasFilters && ' (filtered)'}
              </p>
              <ul className="space-y-4 mb-6">
                {complaints.map((c) => (
                  <li
                    key={c.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-400">
                        ID {c.id}
                        {c.submitted_by_username != null && c.submitted_by_username !== '' && (
                          <span className="ml-2 text-gray-500">
                            · Submitted by <strong>{c.submitted_by_username}</strong>
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      {c.category ?? 'Unclassified'}
                    </p>
                    {/* Severity + Priority badges */}
                    {(c.severity || c.priority) && (
                      <div className="flex items-center gap-2 mb-2">
                        {c.severity && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              c.severity === 'High'
                                ? 'bg-red-100 text-red-700'
                                : c.severity === 'Medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {c.severity}
                          </span>
                        )}
                        {c.priority && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              c.priority === 'P1'
                                ? 'bg-red-100 text-red-700'
                                : c.priority === 'P2'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {c.priority}
                          </span>
                        )}
                        {c.recommended_action && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              c.recommended_action === 'auto_send'
                                ? 'bg-green-50 text-green-600'
                                : c.recommended_action === 'escalate'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {c.recommended_action === 'auto_send'
                              ? 'Auto Send'
                              : c.recommended_action === 'escalate'
                              ? 'Escalate'
                              : 'Review'}
                          </span>
                        )}
                        {c.response_status && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              c.response_status === 'approved' || c.response_status === 'overridden' || c.response_status === 'auto_sent'
                                ? 'bg-green-100 text-green-700'
                                : c.response_status === 'escalated'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {c.response_status === 'approved' || c.response_status === 'overridden' || c.response_status === 'auto_sent'
                              ? 'Resolved'
                              : c.response_status === 'escalated'
                              ? 'Escalated'
                              : 'Pending'}
                          </span>
                        )}
                      </div>
                    )}
                    {c.sent_to_email && (
                      <p className="text-xs text-gray-500 mb-2">
                        Response sent to {c.sent_to_email}
                        {c.delivery_mode && c.delivery_mode !== 'pending' ? ` via ${c.delivery_mode}` : ''}
                      </p>
                    )}
                    {c.confidence !== null && (
                      <div className="mb-2">
                        <ConfidenceBar confidence={c.confidence} />
                      </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {c.complaint_text}
                    </p>
                    <Link
                      to={`/result/${c.id}`}
                      className="inline-block mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View full result →
                    </Link>
                  </li>
                ))}
              </ul>
              {complaints.length === 0 && (
                <p className="text-gray-500 py-8 text-center">
                  No complaints match the current filters.
                </p>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
