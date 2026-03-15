import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ConfidenceBar from '../components/ConfidenceBar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import {
  draftResponse as draftResponseApi,
  getComplaintById,
  type ClassificationResult,
} from '../api/client'
import { useAppSelector } from '../store/hooks'

interface ResultLocationState {
  result: ClassificationResult
  complaintText: string
  submittedAt?: string
}

function isResultLocationState(value: unknown): value is ResultLocationState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate['complaintText'] === 'string' &&
    typeof candidate['result'] === 'object' &&
    candidate['result'] !== null
  )
}

/** Unified display shape for both state and fetch-by-id. */
interface ResultDisplayData {
  complaintText: string
  category: string
  confidence: number
  explanation: string
  formattedDate: string | null
}

function ResultContent({
  data,
  onNavigateHome,
}: {
  data: ResultDisplayData
  onNavigateHome: () => void
}) {
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftText, setDraftText] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const userRole = useAppSelector((state) => state.auth.user?.role ?? '')

  const complaintText = data.complaintText
  const category = data.category
  const confidence = data.confidence
  const explanation = data.explanation
  const formattedDate = data.formattedDate

  async function handleDraftResponse() {
    if (draftOpen) {
      setDraftOpen(false)
      return
    }
    setDraftError(null)
    setDraftText(null)
    setCopied(false)
    setDraftOpen(true)
    setDraftLoading(true)
    try {
      const res = await draftResponseApi(complaintText, category, confidence)
      setDraftText(res.draft_response)
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Failed to generate draft')
    } finally {
      setDraftLoading(false)
    }
  }

  async function handleCopy() {
    if (!draftText) return
    try {
      await navigator.clipboard.writeText(draftText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  const isAdmin = userRole === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {isAdmin ? (
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Classification Result
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Complaint received
          </h1>
        )}

        {isAdmin ? (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                Predicted Category
              </p>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{category}</h2>

              <ConfidenceBar confidence={confidence} />

              {formattedDate && (
                <p className="mt-3 text-xs text-gray-500">
                  Classified on: {formattedDate}
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Your Complaint
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {complaintText}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
              <button
                type="button"
                onClick={() => setExplanationOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                aria-expanded={explanationOpen}
              >
                <span>Why this classification?</span>
                <span className="text-lg leading-none">
                  {explanationOpen ? '−' : '+'}
                </span>
              </button>

              {explanationOpen && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Draft response — Admin only */}
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <p className="text-base text-gray-700 mb-4">
                We&apos;ve received your complaint and will respond.
              </p>
              <p className="text-sm text-gray-600">
                Your complaint has been categorized as: <strong>{category}</strong>.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Your complaint
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {complaintText}
              </p>
            </div>
          </>
        )}

        {/* Draft response — Admin only */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
            <button
              type="button"
              onClick={handleDraftResponse}
              disabled={draftLoading}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <span>{draftLoading ? 'Generating draft…' : 'Draft response email'}</span>
            </button>

            {draftOpen && (
              <div className="border-t border-gray-100 px-6 py-4">
                {draftLoading && (
                  <LoadingSpinner message="Generating draft…" />
                )}
                {draftError && (
                  <p className="text-sm text-red-600" role="alert">
                    {draftError}
                  </p>
                )}
                {draftText && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                      Draft email
                    </p>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {draftText}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="mt-3 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      {copied ? '✓ Copied!' : 'Copy to clipboard'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Another
          </button>

          <Link
            to="/history"
            className="text-sm font-medium text-blue-600 underline hover:text-blue-800 transition-colors"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [fetchState, setFetchState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; data: ResultDisplayData }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  // Compute both paths' values before any hooks (Rules of Hooks).
  const hasLocationState = isResultLocationState(location.state)
  const numericId = id != null ? parseInt(id, 10) : NaN
  const hasValidId = !isNaN(numericId) && numericId > 0

  // Path 2 effect: runs only when there is no location state.
  useEffect(() => {
    if (hasLocationState) return
    if (!hasValidId) {
      setFetchState({ status: 'error', message: 'Invalid complaint ID' })
      return
    }
    let cancelled = false
    setFetchState({ status: 'loading' })
    getComplaintById(numericId)
      .then((detail) => {
        if (cancelled) return
        const data: ResultDisplayData = {
          complaintText: detail.complaint_text ?? '',
          category: detail.category ?? 'Unclassified',
          confidence: typeof detail.confidence === 'number' ? detail.confidence : 0,
          explanation: detail.explanation ?? 'No explanation available.',
          formattedDate: formatDate(detail.classified_at ?? detail.created_at),
        }
        setFetchState({ status: 'ready', data })
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err?.response?.status === 404
            ? 'Complaint not found.'
            : err?.response?.status === 403
              ? 'You do not have access to this complaint.'
              : err instanceof Error
                ? err.message
                : 'Failed to load complaint.'
        setFetchState({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [hasLocationState, numericId, hasValidId])

  // Path 1: arrived from Submit with state
  if (hasLocationState) {
    const { result, complaintText, submittedAt } = location.state as ResultLocationState
    const { category, confidence, explanation } = result
    const data: ResultDisplayData = {
      complaintText,
      category,
      confidence,
      explanation,
      formattedDate: formatDate(submittedAt ?? null),
    }
    return (
      <ResultContent
        data={data}
        onNavigateHome={() => navigate('/submit')}
      />
    )
  }

  if (!hasValidId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid complaint ID.</p>
          <Link to="/submit" className="text-blue-600 underline hover:text-blue-800 text-sm">
            Submit a complaint
          </Link>
          <span className="mx-2 text-gray-400">|</span>
          <Link to="/history" className="text-blue-600 underline hover:text-blue-800 text-sm">
            View history
          </Link>
        </div>
      </div>
    )
  }

  if (fetchState.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <LoadingSpinner message="Loading complaint…" />
      </div>
    )
  }

  if (fetchState.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{fetchState.message}</p>
          <Link to="/submit" className="text-blue-600 underline hover:text-blue-800 text-sm">
            Submit a complaint
          </Link>
          <span className="mx-2 text-gray-400">|</span>
          <Link to="/history" className="text-blue-600 underline hover:text-blue-800 text-sm">
            View history
          </Link>
        </div>
      </div>
    )
  }

  if (fetchState.status !== 'ready' || !fetchState.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <LoadingSpinner message="Loading complaint…" />
      </div>
    )
  }

  return (
    <ResultContent
      data={fetchState.data}
      onNavigateHome={() => navigate('/submit')}
    />
  )
}
