import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  ShieldAlert,
  SendHorizonal,
  Search,
  LayoutDashboard,
} from 'lucide-react'
import { getAdminComplaints, getAdminStatistics } from '../api/client'
import type { AdminComplaintItem, AdminStatisticsResponse } from '../types/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import ConfidenceBar from '../components/ConfidenceBar'

const CATEGORY_OPTIONS = ['All', 'Billing Issue', 'Service Quality', 'Delivery Problem', 'Product Defect', 'Customer Support', 'Other']
const PAGE_SIZES = [10, 20, 50]

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({
  label, value, icon: Icon, accentColor, valueColor = '#1e293b'
}: {
  label: string; value: string | number; icon: typeof BarChart3; accentColor: string; valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="h-1 w-full" style={{ background: accentColor }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
            <Icon size={14} style={{ color: accentColor }} />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        </div>
        <p className="text-2xl font-extrabold" style={{ color: valueColor }}>{value}</p>
      </div>
    </div>
  )
}

// ─── Category bar ──────────────────────────────────────────────────────────────
function CategoryBars({ byCategory }: { byCategory: Record<string, number> }) {
  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a)
  const max = sorted[0]?.[1] ?? 1
  return (
    <ul className="space-y-2.5">
      {sorted.map(([cat, count]) => (
        <li key={cat} className="flex items-center gap-3">
          <span className="text-sm text-slate-600 w-32 shrink-0 truncate">{cat}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%`, background: 'linear-gradient(90deg, #0d9488, #2dd4bf)' }} />
          </div>
          <span className="text-sm font-bold text-slate-700 w-6 text-right">{count}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Status/severity/routing badges ───────────────────────────────────────────
function BadgePill({ label, style }: { label: string; style: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${style}`}>{label}</span>
}

function SeverityPill({ s }: { s: string }) {
  return <BadgePill label={s} style={s === 'High' ? 'bg-rose-50 text-rose-800 border-rose-200' : s === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-teal-50 text-teal-700 border-teal-200'} />
}

function PriorityPill({ p }: { p: string }) {
  return <BadgePill label={p} style={p === 'P1' ? 'bg-rose-50 text-rose-800 border-rose-200' : p === 'P2' ? 'bg-stone-100 text-stone-600 border-stone-200' : 'bg-slate-100 text-slate-600 border-slate-200'} />
}

function ActionPill({ a }: { a: string }) {
  const map: Record<string, { label: string; style: string }> = {
    auto_send:       { label: 'Auto Send',      style: 'bg-teal-50 text-teal-700 border-teal-200' },
    escalate:        { label: 'Escalate',        style: 'bg-rose-50 text-rose-800 border-rose-200' },
    review_required: { label: 'Review Required', style: 'bg-stone-100 text-stone-600 border-stone-200' },
  }
  const m = map[a] ?? { label: a, style: 'bg-slate-100 text-slate-600 border-slate-200' }
  return <BadgePill label={m.label} style={m.style} />
}

function StatusPill({ s }: { s: string }) {
  const isResolved = s === 'approved' || s === 'overridden' || s === 'auto_sent'
  return <BadgePill label={isResolved ? 'Resolved' : s === 'escalated' ? 'Escalated' : 'Pending'} style={isResolved ? 'bg-teal-50 text-teal-700 border-teal-200' : s === 'escalated' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-stone-100 text-stone-600 border-stone-200'} />
}

// ─── Filter tab ────────────────────────────────────────────────────────────────
function FilterTab({ active, onClick, label, activeStyle }: { active: boolean; onClick: () => void; label: string; activeStyle: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${
        active ? activeStyle : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

// ─── AdminPage ─────────────────────────────────────────────────────────────────
export function AdminPage() {
  const [stats, setStats]               = useState<AdminStatisticsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError]     = useState<string | null>(null)
  const [complaints, setComplaints]     = useState<AdminComplaintItem[]>([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [limit, setLimit]               = useState(20)
  const [statusView, setStatusView]     = useState<'all' | 'active' | 'resolved'>('active')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [minConfidence, setMinConfidence]   = useState('')
  const [compLoading, setCompLoading]       = useState(true)
  const [compError, setCompError]           = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatsLoading(true); setStatsError(null)
    getAdminStatistics()
      .then((d) => { if (!cancelled) setStats(d) })
      .catch((err) => {
        if (!cancelled)
          setStatsError(axios.isAxiosError(err) && err.response?.status === 403 ? 'Admin access required' : err instanceof Error ? err.message : 'Failed to load statistics')
      })
      .finally(() => { if (!cancelled) setStatsLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setCompLoading(true); setCompError(null)
    const cat = categoryFilter === 'All' ? undefined : categoryFilter
    const minConf = minConfidence === '' ? undefined : parseFloat(minConfidence)
    if (minConf !== undefined && (isNaN(minConf) || minConf < 0 || minConf > 1)) { setCompLoading(false); return }
    getAdminComplaints(page, limit, cat, minConf, statusView)
      .then((d) => { if (!cancelled) { setComplaints(d.complaints); setTotal(d.total) } })
      .catch((err) => {
        if (!cancelled)
          setCompError(axios.isAxiosError(err) && err.response?.status === 403 ? 'Admin access required' : err instanceof Error ? err.message : 'Failed to load complaints')
      })
      .finally(() => { if (!cancelled) setCompLoading(false) })
    return () => { cancelled = true }
  }, [page, limit, categoryFilter, minConfidence, statusView])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
            <LayoutDashboard size={14} style={{ color: '#0d9488' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0d9488' }}>Administration</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor complaints, severity distribution, and workflow status.</p>
      </div>

      {/* ── Statistics ────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4"><BarChart3 size={16} style={{ color: '#0d9488' }} /> System Statistics</h2>

        {statsLoading && <LoadingSpinner message="Loading statistics…" />}
        {statsError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle size={15} />{statsError}
          </div>
        )}

        {!statsLoading && !statsError && stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <StatTile label="Total Complaints"    value={stats.total_complaints}                          icon={TrendingUp}  accentColor="#6366f1" />
              <StatTile label="Avg. Confidence"     value={`${(stats.average_confidence * 100).toFixed(1)}%`} icon={BarChart3}   accentColor="#0d9488" />
              <StatTile label="Low Confidence <0.5" value={stats.low_confidence_count}                      icon={Search}      accentColor="#f59e0b" valueColor="#b45309" />
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="h-1 bg-slate-200" />
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Date Range</p>
                  <p className="text-xs font-semibold text-slate-700 leading-snug">
                    {stats.date_range.start ?? '—'}<br />to {stats.date_range.end ?? '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <StatTile label="High Severity"   value={stats.high_severity_count}   icon={ShieldAlert}    accentColor="#ef4444" valueColor="#dc2626" />
              <StatTile label="Medium Severity" value={stats.medium_severity_count}  icon={AlertOctagon}  accentColor="#f59e0b" valueColor="#b45309" />
              <StatTile label="Low Severity"    value={stats.low_severity_count}     icon={CheckCircle2}  accentColor="#10b981" valueColor="#059669" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatTile label="Auto-Send Eligible" value={stats.auto_send_count}       icon={SendHorizonal}  accentColor="#10b981" valueColor="#059669" />
              <StatTile label="Review Required"    value={stats.review_required_count}  icon={Clock}          accentColor="#f59e0b" valueColor="#b45309" />
              <StatTile label="Escalated"          value={stats.escalated_count}        icon={Zap}            accentColor="#ef4444" valueColor="#dc2626" />
            </div>

            {Object.keys(stats.by_category).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">By Category</p>
                <CategoryBars byCategory={stats.by_category} />
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Complaints list ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-4">
          {statusView === 'resolved' ? 'Resolved Complaints' : statusView === 'active' ? 'Active Complaints' : 'All Complaints'}
        </h2>

        {/* Status tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <FilterTab active={statusView === 'active'}   onClick={() => { setStatusView('active');   setPage(1) }} label="Active"   activeStyle="bg-amber-50 text-amber-800 border-amber-200" />
          <FilterTab active={statusView === 'resolved'} onClick={() => { setStatusView('resolved'); setPage(1) }} label="Resolved" activeStyle="bg-emerald-50 text-emerald-800 border-emerald-200" />
          <FilterTab active={statusView === 'all'}      onClick={() => { setStatusView('all');      setPage(1) }} label="All"      activeStyle="bg-teal-50 text-teal-800 border-teal-200" />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-white rounded-xl border border-slate-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <label className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            Category
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
              {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            Min confidence
            <input type="number" min="0" max="1" step="0.1" placeholder="e.g. 0.5" value={minConfidence} onChange={(e) => { setMinConfidence(e.target.value); setPage(1) }} className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 font-medium ml-auto">
            Per page
            <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        {compLoading && <LoadingSpinner message="Loading complaints…" />}
        {compError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-4">
            <AlertCircle size={15} />{compError}
          </div>
        )}

        {!compLoading && !compError && (
          <>
            <p className="text-xs text-slate-400 mb-3 font-medium">
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>

            <ul className="space-y-3 mb-5">
              {complaints.map((c) => {
                const isResolved = c.response_status === 'approved' || c.response_status === 'overridden' || c.response_status === 'auto_sent'
                const accentColor = isResolved ? '#10b981' : c.response_status === 'escalated' ? '#ef4444' : '#f59e0b'
                return (
                  <li key={c.id} className="flex gap-0 bg-white rounded-xl border border-slate-200 overflow-hidden hover:-translate-y-0.5 transition-all duration-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div className="w-1 shrink-0" style={{ background: accentColor }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-slate-400">ID {c.id}{c.submitted_by_username ? ` · ${c.submitted_by_username}` : ''}</span>
                        <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-2">{c.category ?? 'Unclassified'}</p>
                      {(c.severity || c.priority || c.recommended_action || c.response_status) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {c.severity          && <SeverityPill s={c.severity} />}
                          {c.priority          && <PriorityPill p={c.priority} />}
                          {c.recommended_action && <ActionPill a={c.recommended_action} />}
                          {c.response_status   && <StatusPill s={c.response_status} />}
                        </div>
                      )}
                      {c.sent_to_email && (
                        <p className="text-xs text-slate-400 mb-2">
                          Sent to {c.sent_to_email}{c.delivery_mode && c.delivery_mode !== 'pending' ? ` via ${c.delivery_mode}` : ''}
                        </p>
                      )}
                      {c.confidence !== null && <div className="mb-2"><ConfidenceBar confidence={c.confidence} /></div>}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{c.complaint_text}</p>
                      <Link to={`/result/${c.id}`} className="inline-flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#0d9488' }}>
                        View full result <ArrowRight size={12} />
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>

            {complaints.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <Search size={18} style={{ color: '#0d9488' }} />
                </div>
                <p className="text-slate-500 text-sm">No complaints match the current filters.</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <span className="text-sm text-slate-500">Page <strong className="text-slate-700">{page}</strong> of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
