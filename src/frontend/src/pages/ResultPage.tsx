import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  AlertOctagon,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
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

function isResultLocationState(v: unknown): v is ResultLocationState {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return typeof c['complaintText'] === 'string' && typeof c['result'] === 'object' && c['result'] !== null
}

interface ResultDisplayData {
  complaintId?: number
  complaintText: string
  category: string
  confidence: number
  explanation: string
  formattedDate: string | null
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

// ─── Badge helpers ─────────────────────────────────────────────────────────────
function SeverityBadge({ value }: { value: 'High' | 'Medium' | 'Low' }) {
  const map = {
    High:   'bg-rose-50 text-rose-800 border-rose-200',
    Medium: 'bg-orange-50 text-orange-700 border-orange-200',
    Low:    'bg-teal-50 text-teal-700 border-teal-200',
  }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${map[value]}`}>{value} Severity</span>
}

function PriorityBadge({ value }: { value: 'P1' | 'P2' | 'P3' }) {
  const map = {
    P1: 'bg-rose-50 text-rose-800 border-rose-200',
    P2: 'bg-stone-100 text-stone-600 border-stone-200',
    P3: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${map[value]}`}>{value} Priority</span>
}

function RoutingBadge({ value }: { value: 'auto_send' | 'review_required' | 'escalate' }) {
  const map = {
    auto_send:       { label: 'Auto Send',      style: 'bg-teal-50 text-teal-700 border-teal-200' },
    escalate:        { label: 'Escalate',        style: 'bg-rose-50 text-rose-800 border-rose-200' },
    review_required: { label: 'Review Required', style: 'bg-stone-100 text-stone-600 border-stone-200' },
  }
  const { label, style } = map[value]
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${style}`}>{label}</span>
}

function StatusBadge({ value }: { value: string }) {
  const isResolved = value === 'approved' || value === 'overridden' || value === 'auto_sent'
  if (isResolved) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
      <CheckCircle2 size={13} /> Response Sent
    </span>
  )
  if (value === 'escalated') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
      <AlertOctagon size={13} /> Escalated
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
      <Clock size={13} /> Pending
    </span>
  )
}

// ─── Result content ────────────────────────────────────────────────────────────
function ResultContent({ data, onNavigateHome }: { data: ResultDisplayData; onNavigateHome: () => void }) {
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [draftOpen, setDraftOpen]             = useState(false)
  const [draftLoading, setDraftLoading]       = useState(false)
  const [draftText, setDraftText]             = useState<string | null>(null)
  const [draftError, setDraftError]           = useState<string | null>(null)
  const [sendLoading, setSendLoading]         = useState(false)
  const [sendFeedback, setSendFeedback]       = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [workflowStatus, setWorkflowStatus]           = useState(data.response_status)
  const [workflowDeliveryMode, setWorkflowDeliveryMode] = useState(data.delivery_mode)
  const [workflowRecipient, setWorkflowRecipient]     = useState(data.sent_to_email)
  const userRole = useAppSelector((s) => s.auth.user?.role ?? '')

  useEffect(() => {
    setDraftText(data.final_response_text ?? data.draft_response_text ?? null)
  }, [data.final_response_text, data.draft_response_text])
  useEffect(() => {
    setWorkflowStatus(data.response_status)
    setWorkflowDeliveryMode(data.delivery_mode)
    setWorkflowRecipient(data.sent_to_email)
  }, [data.response_status, data.delivery_mode, data.sent_to_email])

  async function handleDraftResponse() {
    if (draftOpen) { setDraftOpen(false); return }
    setDraftError(null); setSendFeedback(null); setCopied(false); setDraftOpen(true)
    if (draftText?.trim()) return
    setDraftLoading(true)
    try { setDraftText((await draftResponseApi(data.complaintText, data.category, data.confidence)).draft_response) }
    catch (err) { setDraftError(err instanceof Error ? err.message : 'Failed to generate draft') }
    finally { setDraftLoading(false) }
  }

  async function handleSendReply() {
    if (!data.complaintId || !draftText?.trim()) return
    if (!data.user_email) { setDraftError('No recipient email linked to this complaint user.'); return }
    setSendLoading(true); setDraftError(null); setSendFeedback(null)
    try {
      const res = await sendAdminReply(data.complaintId, draftText.trim())
      setWorkflowStatus(res.response_status); setWorkflowDeliveryMode(res.delivery_mode); setWorkflowRecipient(res.sent_to_email)
      setSendFeedback(`Reply sent to ${res.sent_to_email} via ${res.delivery_mode === 'smtp' ? 'SMTP' : 'simulation'}.`)
    } catch (err) {
      if (axios.isAxiosError(err)) { const e = err.response?.data?.error; setDraftError(typeof e === 'string' ? e : err.message) }
      else { setDraftError(err instanceof Error ? err.message : 'Failed to send reply') }
    } finally { setSendLoading(false) }
  }

  async function handleCopy() {
    if (!draftText) return
    try { await navigator.clipboard.writeText(draftText); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }

  const isAdmin    = userRole === 'ADMIN'
  const isResolved = workflowStatus === 'approved' || workflowStatus === 'overridden' || workflowStatus === 'auto_sent'
  const sentMessage = data.final_response_text ?? data.draft_response_text
  const effectiveRecipient = workflowRecipient ?? data.user_email

  // Header strip color — muted professional palette (no bright red/green)
  const headerBg = isResolved ? 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)'
    : workflowStatus === 'escalated' ? 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)'
    : 'linear-gradient(135deg, #0c1a2e 0%, #0f2537 100%)'

  return (
    <div className="max-w-2xl mx-auto py-8">

      {/* Status header */}
      <div className="rounded-2xl px-6 py-4 mb-5 text-white" style={{ background: headerBg }}>
        {isAdmin ? (
          <h1 className="text-xl font-extrabold">Classification Result</h1>
        ) : isResolved ? (
          <>
            <div className="flex items-center gap-2 mb-0.5"><CheckCircle2 size={18} /><h1 className="text-xl font-extrabold">Response Sent</h1></div>
            <p className="text-white/75 text-sm">{effectiveRecipient ? `Sent to ${effectiveRecipient}` : 'Your complaint has been resolved.'}</p>
          </>
        ) : workflowStatus === 'escalated' ? (
          <>
            <div className="flex items-center gap-2 mb-0.5"><AlertOctagon size={18} /><h1 className="text-xl font-extrabold">Complaint Escalated</h1></div>
            <p className="text-white/75 text-sm">Your complaint has been escalated for specialist review.</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-0.5"><Clock size={18} /><h1 className="text-xl font-extrabold">Complaint Received</h1></div>
            <p className="text-white/75 text-sm">We&apos;ve received your complaint and will respond shortly.</p>
          </>
        )}
      </div>

      {/* Category card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Predicted Category</p>
        <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-white mb-4" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
          {data.category}
        </span>
        <ConfidenceBar confidence={data.confidence} />
        {data.formattedDate && <p className="mt-3 text-xs text-slate-400">Classified: {data.formattedDate}</p>}
        {!isAdmin && workflowStatus && <div className="mt-2"><StatusBadge value={workflowStatus} /></div>}
      </div>

      {/* Complaint text */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Your Complaint</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{data.complaintText}</p>
      </div>

      {/* XAI Explanation (collapsible) */}
      <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button
          type="button"
          onClick={() => setExplanationOpen((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Why this classification?</span>
          {explanationOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </button>
        {explanationOpen && (
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-700 leading-relaxed">{data.explanation}</p>
          </div>
        )}
      </div>

      {/* Decision Intelligence */}
      {data.severity && data.recommended_action && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Decision Intelligence</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <SeverityBadge value={data.severity} />
            {data.priority && <PriorityBadge value={data.priority} />}
            <RoutingBadge value={data.recommended_action} />
          </div>
          {data.routing_reason && (
            <p className="text-xs text-slate-600 leading-relaxed mt-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">{data.routing_reason}</p>
          )}
          {isAdmin && workflowStatus && (
            <p className="mt-3 text-xs text-slate-500">
              Workflow: <strong className="capitalize text-slate-700">{workflowStatus.replace('_', ' ')}</strong>
              {workflowRecipient ? ` · Recipient: ${workflowRecipient}` : ''}
              {workflowDeliveryMode && workflowDeliveryMode !== 'pending' ? ` · Mode: ${workflowDeliveryMode}` : ''}
            </p>
          )}
          {isAdmin && data.user_email && (
            <p className="mt-1 text-xs text-slate-400">User email: <strong className="text-slate-600">{data.user_email}</strong></p>
          )}
        </div>
      )}

      {/* Admin draft response */}
      {isAdmin && !isResolved && (
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <button
            type="button"
            onClick={handleDraftResponse}
            disabled={draftLoading}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <span>Draft response email</span>
            {draftOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
          </button>
          {draftOpen && (
            <div className="border-t border-slate-100 px-5 py-4">
              {draftLoading && <LoadingSpinner message="Generating draft…" />}
              {draftError && <div className="flex items-center gap-2 text-sm text-red-700 mb-3"><AlertCircle size={14} />{draftError}</div>}
              {draftText && (
                <>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={12}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                    {data.complaintId != null && (
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={sendLoading || !draftText.trim() || !data.user_email}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
                      >
                        {sendLoading ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Send size={13} /> Send Reply</>}
                      </button>
                    )}
                  </div>
                  {!data.user_email && <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">No recipient email — sending unavailable.</p>}
                  {sendFeedback && <p className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200"><CheckCircle2 size={12} className="inline mr-1" />{sendFeedback}</p>}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resolved response — read-only */}
      {isAdmin && isResolved && sentMessage && (
        <div className="bg-white rounded-xl border border-emerald-200 mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="px-5 py-3.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <p className="text-sm font-bold text-emerald-800">Resolved Response (read-only)</p>
          </div>
          <div className="px-5 py-4">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{sentMessage}</pre>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4 mt-2">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
        >
          Submit Another <ArrowRight size={14} />
        </button>
        <Link to="/history" className="text-sm font-semibold underline transition-colors" style={{ color: '#0d9488' }}>
          View History
        </Link>
      </div>
    </div>
  )
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4"><div className="text-center">{children}</div></div>
}

export default function ResultPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { id }   = useParams<{ id: string }>()
  const [fetchState, setFetchState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; data: ResultDisplayData }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  const hasLocationState = isResultLocationState(location.state)
  const numericId = id != null ? parseInt(id, 10) : NaN
  const hasValidId = !isNaN(numericId) && numericId > 0

  useEffect(() => {
    if (hasLocationState) return
    if (!hasValidId) { setFetchState({ status: 'error', message: 'Invalid complaint ID' }); return }
    let cancelled = false
    setFetchState({ status: 'loading' })
    getComplaintById(numericId)
      .then((detail) => {
        if (cancelled) return
        setFetchState({
          status: 'ready',
          data: {
            complaintId: detail.id, complaintText: detail.complaint_text ?? '',
            category: detail.category ?? 'Unclassified',
            confidence: typeof detail.confidence === 'number' ? detail.confidence : 0,
            explanation: detail.explanation ?? 'No explanation available.',
            formattedDate: formatDate(detail.classified_at ?? detail.created_at),
            severity: detail.severity ?? undefined, priority: detail.priority ?? undefined,
            recommended_action: detail.recommended_action ?? undefined,
            response_status: detail.response_status ?? undefined,
            draft_response_text: detail.draft_response_text ?? null,
            final_response_text: detail.final_response_text ?? null,
            sent_to_email: detail.sent_to_email ?? null,
            user_email: detail.user_email ?? null,
            delivery_mode: detail.delivery_mode ?? undefined,
          },
        })
      })
      .catch((err) => {
        if (cancelled) return
        const message = err?.response?.status === 404 ? 'Complaint not found.'
          : err?.response?.status === 403 ? 'You do not have access to this complaint.'
          : err instanceof Error ? err.message : 'Failed to load complaint.'
        setFetchState({ status: 'error', message })
      })
    return () => { cancelled = true }
  }, [hasLocationState, numericId, hasValidId])

  if (hasLocationState) {
    const { result, complaintText, submittedAt } = location.state as ResultLocationState
    return (
      <ResultContent
        data={{
          complaintId: result.complaint_id ?? undefined, complaintText,
          category: result.category, confidence: result.confidence, explanation: result.explanation,
          formattedDate: formatDate(submittedAt ?? null),
          severity: result.severity, priority: result.priority,
          severity_reason: result.severity_reason, recommended_action: result.recommended_action,
          auto_send_eligible: result.auto_send_eligible, routing_reason: result.routing_reason,
          response_status: result.response_status, auto_response_sent: result.auto_response_sent,
          delivery_mode: result.delivery_mode,
        }}
        onNavigateHome={() => navigate('/submit')}
      />
    )
  }

  if (!hasValidId) {
    return (
      <PageShell>
        <p className="text-slate-600 mb-4 text-sm">Invalid complaint ID.</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/submit" className="text-sm font-semibold underline" style={{ color: '#0d9488' }}>Submit a complaint</Link>
          <span className="text-slate-300">|</span>
          <Link to="/history" className="text-sm font-semibold underline" style={{ color: '#0d9488' }}>View history</Link>
        </div>
      </PageShell>
    )
  }

  if (fetchState.status === 'loading' || fetchState.status === 'idle') {
    return <PageShell><LoadingSpinner message="Loading complaint…" /></PageShell>
  }

  if (fetchState.status === 'error') {
    return (
      <PageShell>
        <p className="text-slate-600 mb-4 text-sm">{fetchState.message}</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/submit" className="text-sm font-semibold underline" style={{ color: '#0d9488' }}>Submit a complaint</Link>
          <span className="text-slate-300">|</span>
          <Link to="/history" className="text-sm font-semibold underline" style={{ color: '#0d9488' }}>View history</Link>
        </div>
      </PageShell>
    )
  }

  return <ResultContent data={fetchState.data} onNavigateHome={() => navigate('/submit')} />
}
