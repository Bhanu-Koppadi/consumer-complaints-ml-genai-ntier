import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
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

function formatHistoryDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ComplaintCard({ item }: { item: ComplaintHistoryItem }) {
  const snippet =
    item.complaint_text.length > 120
      ? `${item.complaint_text.slice(0, 120)}…`
      : item.complaint_text

  const status = item.response_status
  const isResolved = status === 'approved' || status === 'overridden' || status === 'auto_sent'

  return (
    <Link
      to={`/result/${item.id}`}
      className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label={`View full result for complaint ${item.id}, ${item.category ?? 'Unclassified'}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="text-sm font-semibold text-gray-800">
          {item.category ?? 'Unclassified'}
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatHistoryDate(item.created_at)}
        </span>
      </div>
      {status && (
        <p className={`mb-3 text-xs font-medium ${isResolved ? 'text-green-700' : 'text-amber-700'}`}>
          {isResolved ? 'Response sent' : status === 'escalated' ? 'Escalated for manual handling' : 'Awaiting response'}
          {item.sent_to_email ? ` · ${item.sent_to_email}` : ''}
        </p>
      )}
      {item.confidence !== null && (
        <div className="mb-3">
          <ConfidenceBar confidence={item.confidence} />
        </div>
      )}
      <p className="text-xs text-gray-600 leading-relaxed">{snippet}</p>
      <p className="mt-3 text-xs font-medium text-blue-600">
        View full result →
      </p>
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
      if (data.complaints.length === 0) {
        setPageState({ status: 'empty' })
      } else {
        setPageState({ status: 'ready', items: data.complaints })
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        dispatch(logout())
        setPageState({ status: 'unauthenticated' })
      } else {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.'
        setPageState({ status: 'error', message })
      }
    }
  }, [dispatch])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Complaint History
      </h1>

      {pageState.status === 'loading' && (
        <LoadingSpinner message="Loading your complaint history…" />
      )}

      {pageState.status === 'unauthenticated' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">Login required</p>
          <p>
            Please{' '}
            <Link to="/" className="underline hover:text-amber-900">
              sign in
            </Link>{' '}
            to view your complaint history.
          </p>
        </div>
      )}

      {pageState.status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          <p className="font-semibold mb-1">Failed to load history</p>
          <p className="mb-3">{pageState.message}</p>
          <button
            type="button"
            onClick={() => void loadHistory()}
            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {pageState.status === 'empty' && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-gray-600 mb-3">No complaints submitted yet.</p>
          <Link
            to="/submit"
            className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
          >
            Submit your first complaint
          </Link>
        </div>
      )}

      {pageState.status === 'ready' && (
        <ul className="flex flex-col gap-4">
          {pageState.items.map((item) => (
            <li key={item.id}>
              <ComplaintCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
