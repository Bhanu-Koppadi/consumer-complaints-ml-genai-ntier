import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ConfidenceBar from '../components/ConfidenceBar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import {
  draftResponse as draftResponseApi,
  getComplaintById,
  sendAdminReply,
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
  complaintId?: number
  complaintText: string
  category: string
  confidence: number
  explanation: string
  formattedDate: string | null
  // Advanced intelligence fields (optional — absent when loaded via complaint ID)
  severity?: 'High' | 'Medium' | 'Low'
  priority?: 'P1' | 'P2' | 'P3'
  severity_reason?: string
  recommended_action?: 'auto_send' | 'review_required' | 'escalate'
  auto_send_eligible?: boolean
  routing_reason?: string
  response_status?: 'pending' | 'auto_sent' | 'approved' | 'escalated' | 'overridden'
  auto_response_sent?: boolean
  delivery_mode?: 'pending' | 'simulate' | 'smtp'
  draft_response_text?: string | null
  final_response_text?: string | null
  sent_to_email?: string | null
  user_email?: string | null
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
  const [sendLoading, setSendLoading] = useState(false)
  const [sendFeedback, setSendFeedback] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState(data.response_status)
  const [workflowDeliveryMode, setWorkflowDeliveryMode] = useState(data.delivery_mode)
  const [workflowRecipient, setWorkflowRecipient] = useState(data.sent_to_email)
  const [copied, setCopied] = useState(false)
  const userRole = useAppSelector((state) => state.auth.user?.role ?? '')

  const complaintText = data.complaintText
  const category = data.category
  const confidence = data.confidence
  const explanation = data.explanation
  const formattedDate = data.formattedDate
  const severity = data.severity
  const priority = data.priority
  const recommendedAction = data.recommended_action
  const autoSendEligible = data.auto_send_eligible
  const routingReason = data.routing_reason
  const complaintId = data.complaintId
  const responseStatus = workflowStatus
  const deliveryMode = workflowDeliveryMode
  const sentToEmail = workflowRecipient
  const userEmail = data.user_email
  const effectiveRecipient = sentToEmail ?? userEmail
  const isResolved = responseStatus === 'approved' || responseStatus === 'overridden' || responseStatus === 'auto_sent'
  const sentMessage = data.final_response_text ?? data.draft_response_text

  useEffect(() => {
    const existing = data.final_response_text ?? data.draft_response_text ?? null
    setDraftText(existing)
  }, [data.final_response_text, data.draft_response_text])

  useEffect(() => {
    setWorkflowStatus(data.response_status)
    setWorkflowDeliveryMode(data.delivery_mode)
    setWorkflowRecipient(data.sent_to_email)
  }, [data.response_status, data.delivery_mode, data.sent_to_email])

  async function handleDraftResponse() {
    if (draftOpen) {
      setDraftOpen(false)
      return
    }
    setDraftError(null)
    setSendFeedback(null)
    setCopied(false)
    setDraftOpen(true)
    if (draftText && draftText.trim().length > 0) {
      return
    }
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

  async function handleSendReply() {
    if (!complaintId || !draftText?.trim()) return
    if (!userEmail) {
      setDraftError('No recipient email linked to this complaint user.')
      return
    }
    setSendLoading(true)
    setDraftError(null)
    setSendFeedback(null)
    try {
      const res = await sendAdminReply(complaintId, draftText.trim())
      setWorkflowStatus(res.response_status)
      setWorkflowDeliveryMode(res.delivery_mode)
      setWorkflowRecipient(res.sent_to_email)
      setSendFeedback(
        `Reply sent to ${res.sent_to_email} via ${res.delivery_mode === 'smtp' ? 'SMTP' : 'simulation'} (${res.response_status}).`,
      )
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data?.error
        setDraftError(typeof apiError === 'string' ? apiError : err.message)
      } else {
        setDraftError(err instanceof Error ? err.message : 'Failed to send reply')
      }
    } finally {
      setSendLoading(false)
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

            {/* Decision Intelligence panel — shown when v2 fields are present */}
            {severity && recommendedAction && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                  Decision Intelligence
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {/* Severity badge */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Severity</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        severity === 'High'
                          ? 'bg-red-100 text-red-700'
                          : severity === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {severity}
                    </span>
                  </div>
                  {/* Priority badge */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Priority</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        priority === 'P1'
                          ? 'bg-red-100 text-red-700'
                          : priority === 'P2'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {priority}
                    </span>
                  </div>
                  {/* Routing action badge */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Routing Action</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        recommendedAction === 'auto_send'
                          ? 'bg-green-100 text-green-700'
                          : recommendedAction === 'escalate'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {recommendedAction === 'auto_send'
                        ? 'Auto Send'
                        : recommendedAction === 'escalate'
                        ? 'Escalate'
                        : 'Review Required'}
                    </span>
                  </div>
                </div>
                {routingReason && (
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-4 py-3">
                    {routingReason}
                  </p>
                )}
                {responseStatus && (
                  <p className="mt-3 text-xs font-medium text-gray-700">
                    Workflow status: <strong>{responseStatus.replace('_', ' ')}</strong>
                    {sentToEmail ? ` · Recipient: ${sentToEmail}` : ''}
                    {deliveryMode && deliveryMode !== 'pending' ? ` · Mode: ${deliveryMode}` : ''}
                  </p>
                )}
                {userEmail && (
                  <p className="mt-1 text-xs text-gray-600">
                    Complaint user email: <strong>{userEmail}</strong>
                  </p>
                )}
                {autoSendEligible && (
                  <p className="mt-3 text-xs font-semibold text-green-700 flex items-center gap-1">
                    ✓ Response eligible for automated dispatch
                  </p>
                )}
              </div>
            )}

            {/* Draft response — Admin only */}
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              {responseStatus === 'auto_sent' || responseStatus === 'approved' || responseStatus === 'overridden' ? (
                <p className="text-base text-green-700 mb-4 font-medium">
                  Response sent successfully{effectiveRecipient ? ` to ${effectiveRecipient}` : ''}.
                </p>
              ) : responseStatus === 'escalated' ? (
                <p className="text-base text-amber-700 mb-4 font-medium">
                  Your complaint is escalated for specialist review. A response will follow shortly.
                </p>
              ) : (
                <p className="text-base text-gray-700 mb-4">
                  We&apos;ve received your complaint and will respond.
                </p>
              )}
              <p className="text-sm text-gray-600">
                Your complaint has been categorized as: <strong>{category}</strong>.
              </p>
              {responseStatus && (
                <p className="mt-3 text-xs text-gray-500">
                  Status: <strong>{responseStatus.replace('_', ' ')}</strong>
                  {deliveryMode && deliveryMode !== 'pending' ? ` · Mode: ${deliveryMode}` : ''}
                </p>
              )}
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
        {isAdmin && !isResolved && (
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
                      Reply email
                    </p>
                    <textarea
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                      rows={12}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        {copied ? '✓ Copied!' : 'Copy to clipboard'}
                      </button>
                      {complaintId != null && (
                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={sendLoading || draftText.trim().length === 0 || !userEmail}
                          className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sendLoading ? 'Sending…' : 'Send Reply'}
                        </button>
                      )}
                    </div>
                    {!userEmail && (
                      <p className="mt-2 text-xs text-amber-700">
                        This complaint is not linked to a user email, so reply sending is unavailable.
                      </p>
                    )}
                    {sendFeedback && (
                      <p className="mt-3 text-xs text-green-700 font-medium">{sendFeedback}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Read-only sent response view for resolved complaints */}
        {isAdmin && isResolved && sentMessage && (
          <div className="bg-white rounded-xl border border-green-200 shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-green-100 bg-green-50 rounded-t-xl">
              <p className="text-sm font-semibold text-green-800">Resolved Response (Read-only)</p>
              <p className="text-xs text-green-700 mt-1">
                Already sent to {effectiveRecipient ?? 'customer'}
                {deliveryMode ? ` via ${deliveryMode}` : ''}. Drafting is disabled to avoid duplicate replies.
              </p>
            </div>
            <div className="px-6 py-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-3 rounded-lg">
                {sentMessage}
              </pre>
            </div>
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
          complaintId: detail.id,
          complaintText: detail.complaint_text ?? '',
          category: detail.category ?? 'Unclassified',
          confidence: typeof detail.confidence === 'number' ? detail.confidence : 0,
          explanation: detail.explanation ?? 'No explanation available.',
          formattedDate: formatDate(detail.classified_at ?? detail.created_at),
          severity: detail.severity ?? undefined,
          priority: detail.priority ?? undefined,
          recommended_action: detail.recommended_action ?? undefined,
          response_status: detail.response_status ?? undefined,
          draft_response_text: detail.draft_response_text ?? null,
          final_response_text: detail.final_response_text ?? null,
          sent_to_email: detail.sent_to_email ?? null,
          user_email: detail.user_email ?? null,
          delivery_mode: detail.delivery_mode ?? undefined,
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
      complaintId: result.complaint_id ?? undefined,
      complaintText,
      category,
      confidence,
      explanation,
      formattedDate: formatDate(submittedAt ?? null),
      severity: result.severity,
      priority: result.priority,
      severity_reason: result.severity_reason,
      recommended_action: result.recommended_action,
      auto_send_eligible: result.auto_send_eligible,
      routing_reason: result.routing_reason,
      response_status: result.response_status,
      auto_response_sent: result.auto_response_sent,
      delivery_mode: result.delivery_mode,
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
