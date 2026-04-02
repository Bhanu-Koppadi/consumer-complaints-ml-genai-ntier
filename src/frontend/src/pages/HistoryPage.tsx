import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  AlertCircle,
  ArrowRight,
  InboxIcon,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
} from 'lucide-react'
import ConfidenceBar from '../components/ConfidenceBar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { getComplaintHistory } from '../api/client'
import type { ComplaintHistoryItem } from '../types/api'
import { useAppDispatch } from '../store/hooks'
import { logout } from '../store/authSlice'

type PageState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; items: ComplaintHistoryItem[] }

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown date'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface StatusConfig {
  label: string
  accentColor: string
  textColor: string
  bgClass: string
  Icon: typeof CheckCircle2
}

function getStatusConfig(status: string | undefined | null): StatusConfig | null {
  if (!status) return null
  const isResolved = status === 'approved' || status === 'overridden' || status === 'auto_sent'
  if (isResolved) return { label: 'Resolved', accentColor: '#10b981', textColor: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200', Icon: CheckCircle2 }
  if (status === 'escalated') return { label: 'Escalated', accentColor: '#ef4444', textColor: 'text-red-600', bgClass: 'bg-red-50 border-red-200', Icon: AlertOctagon }
  return { label: 'Pending', accentColor: '#f59e0b', textColor: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-200', Icon: Clock }
}

function ComplaintCard({ item }: { item: ComplaintHistoryItem }) {
  const snippet = item.complaint_text.length > 130 ? `${item.complaint_text.slice(0, 130)}…` : item.complaint_text
  const statusConfig = getStatusConfig(item.response_status)

  return (
    <Link
      to={`/result/${item.id}`}
      className="group flex gap-0 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      aria-label={`Complaint ${item.id} — ${item.category ?? 'Unclassified'}`}
    >
      {/* Left accent stripe */}
      <div className="w-1 shrink-0" style={{ background: statusConfig?.accentColor ?? '#e2e8f0' }} />

      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div>
            <p className="text-sm font-bold text-slate-800">{item.category ?? 'Unclassified'}</p>
            {statusConfig && (
              <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bgClass} ${statusConfig.textColor}`}>
                <statusConfig.Icon size={11} />
                {statusConfig.label}
                {item.sent_to_email ? ` · ${item.sent_to_email}` : ''}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{formatDate(item.created_at)}</span>
        </div>

        {item.confidence !== null && <div className="mb-2.5"><ConfidenceBar confidence={item.confidence} /></div>}

        <p className="text-xs text-slate-500 leading-relaxed mb-3">{snippet}</p>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-800 transition-colors">
          View full result <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  )
}

export function HistoryPage() {
  const dispatch = useAppDispatch()
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' })

  const loadHistory = useCallback(async () => {
    setPageState({ status: 'loading' })
    try {
      const data = await getComplaintHistory()
      setPageState(data.complaints.length === 0 ? { status: 'empty' } : { status: 'ready', items: data.complaints })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        dispatch(logout()); setPageState({ status: 'unauthenticated' })
      } else {
        setPageState({ status: 'error', message: err instanceof Error ? err.message : 'An unexpected error occurred.' })
      }
    }
  }, [dispatch])

  useEffect(() => { void loadHistory() }, [loadHistory])

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#0d9488' }}>Your Submissions</p>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Complaint History</h1>
        <p className="text-slate-500 text-sm">Track the status of all your submitted complaints.</p>
      </div>

      {pageState.status === 'loading' && <LoadingSpinner message="Loading your complaint history…" />}

      {pageState.status === 'unauthenticated' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
          <p className="text-sm text-amber-800">
            Please <Link to="/" className="underline font-semibold">sign in</Link> to view your complaint history.
          </p>
        </div>
      )}

      {pageState.status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{pageState.message}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadHistory()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      )}

      {pageState.status === 'empty' && (
        <div className="rounded-xl border border-slate-200 bg-white text-center px-6 py-14" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(13,148,136,0.1)' }}>
            <InboxIcon size={22} style={{ color: '#0d9488' }} />
          </div>
          <p className="text-slate-700 font-semibold mb-1">No complaints yet</p>
          <p className="text-slate-400 text-sm mb-6">Submit your first complaint to see it here.</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
          >
            Submit a Complaint <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {pageState.status === 'ready' && (
        <>
          <p className="text-xs text-slate-400 mb-4 font-medium">
            {pageState.items.length} complaint{pageState.items.length !== 1 ? 's' : ''} found
          </p>
          <ul className="flex flex-col gap-3.5">
            {pageState.items.map((item) => <li key={item.id}><ComplaintCard item={item} /></li>)}
          </ul>
        </>
      )}
    </div>
  )
}
