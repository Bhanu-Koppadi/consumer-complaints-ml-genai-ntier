import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { classifyComplaint, type ClassificationResult } from '../api/client'

const MIN_LENGTH = 20
const MAX_LENGTH = 2000

const EXAMPLE_COMPLAINTS = [
  { title: 'Billing dispute',           category: 'Financial',       text: 'I was charged twice for the same transaction on my credit card statement dated last month. Despite calling customer service three times, the duplicate charge of $149.99 has not been reversed. I am requesting an immediate refund and confirmation in writing.' },
  { title: 'Loan servicing issue',      category: 'Mortgage',        text: 'My mortgage servicer applied my payment to the wrong account for two consecutive months, resulting in late fees and a negative mark on my credit report. I have submitted proof of payment but have received no resolution after 45 days of follow-up.' },
  { title: 'Debt collection harassment', category: 'Debt',           text: 'A debt collection agency has been calling me more than five times per day including on weekends and holidays. They refuse to provide written verification of the alleged debt and continue contacting me despite my written request to cease communication.' },
  { title: 'Delivery delay issue',      category: 'Delivery',        text: 'My order was promised for delivery in 3 days, but it has been 12 days and there is still no update from the courier. The tracking status has not changed and customer support keeps giving the same generic response. I need immediate action and a clear delivery date.' },
  { title: 'Product defect complaint',  category: 'Product',         text: 'The mixer grinder I received stopped working within one week of use and started emitting a burning smell. I followed all usage instructions, but the product appears defective. I want a replacement or full refund under warranty as soon as possible.' },
  { title: 'Broadband speed issue',     category: 'Service',         text: 'My broadband internet speed has been far below the promised plan for the last two weeks, especially during working hours. I raised multiple tickets but no technician has resolved the issue. This poor service quality is affecting my work and I need urgent resolution.' },
  { title: 'Rude support agent',        category: 'Customer Support', text: 'I contacted support regarding an incorrect charge, but the representative was rude and disconnected the call before understanding my issue. I called again and was kept on hold for a long time without resolution. I request a proper response from a senior support manager.' },
  { title: 'General grievance',         category: 'General',         text: 'I have submitted feedback and complaints through email and app chat, but I have not received any meaningful acknowledgment for over a month. I need this complaint to be formally recorded and resolved.' },
]

export default function SubmitComplaintPage() {
  const navigate = useNavigate()
  const [text, setText]           = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [examplesOpen, setExamplesOpen] = useState(false)

  const count      = text.length
  const isOverLimit = count > MAX_LENGTH
  const isTooShort  = count < MIN_LENGTH
  const progressPct = Math.min((count / MAX_LENGTH) * 100, 100)

  const barColor = isOverLimit ? '#ef4444' : count < MIN_LENGTH && count > 0 ? '#f59e0b' : '#0d9488'

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isTooShort) { setError(`Complaint must be at least ${MIN_LENGTH} characters.`); return }
    if (isOverLimit) { setError(`Complaint must not exceed ${MAX_LENGTH} characters.`); return }
    setSubmitting(true); setError(null)
    try {
      const result: ClassificationResult = await classifyComplaint({ complaint_text: text })
      const path = result.complaint_id != null ? `/result/${result.complaint_id}` : '/result'
      navigate(path, { state: { result, complaintText: text, submittedAt: new Date().toISOString() } })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Page header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
            <FileText size={14} style={{ color: '#0d9488' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0d9488' }}>
            AI-Powered Classification
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Submit a Complaint</h1>
        <p className="text-slate-500 text-sm">
          Describe your consumer complaint. Our hybrid AI pipeline will classify it, assess severity, and generate a plain-English explanation.
        </p>
      </div>

      {/* Examples accordion */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button
          type="button"
          onClick={() => setExamplesOpen((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText size={14} style={{ color: '#0d9488' }} />
            Try an example complaint
          </span>
          {examplesOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </button>

        {examplesOpen && (
          <ul className="border-t border-slate-100 divide-y divide-slate-50">
            {EXAMPLE_COMPLAINTS.map(({ title, category, text: t }) => (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => { setText(t); setError(null); setExamplesOpen(false) }}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                      style={{ background: 'rgba(13,148,136,0.07)', color: '#0d9488', borderColor: 'rgba(13,148,136,0.2)' }}
                    >
                      {category}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">
                      {title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-0.5">{t}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div
          className="rounded-xl border bg-white overflow-hidden mb-4"
          style={{ borderColor: isOverLimit ? '#fca5a5' : '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="px-4 pt-4 pb-2">
            <label htmlFor="complaint-textarea" className="block text-sm font-semibold text-slate-700 mb-2">
              Complaint text
              <span className="ml-2 text-xs font-normal text-slate-400">(min {MIN_LENGTH} characters)</span>
            </label>
            <textarea
              id="complaint-textarea"
              value={text}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setText(e.target.value); setError(null) }}
              rows={9}
              placeholder="Describe your complaint in detail — include dates, amounts, and what resolution you expect…"
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-y focus:outline-none leading-relaxed"
            />
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">
                {isTooShort && count > 0 ? `${MIN_LENGTH - count} more character${MIN_LENGTH - count === 1 ? '' : 's'} needed` : 'Character count'}
              </span>
              <span className="text-xs font-semibold" style={{ color: isOverLimit ? '#ef4444' : '#64748b' }}>
                {count} / {MAX_LENGTH}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: barColor }} />
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setText(''); setError(null) }}
            disabled={!text}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Trash2 size={13} /> Clear
          </button>
          <button
            type="submit"
            disabled={isTooShort || isOverLimit || submitting}
            id="submit-complaint-btn"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isTooShort || isOverLimit ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
          >
            {submitting ? (
              <><Loader2 size={15} className="animate-spin" /> Classifying with AI…</>
            ) : (
              <>Submit Complaint <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

