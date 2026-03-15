import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { classifyComplaint, type ClassificationResult } from '../api/client'

const MIN_LENGTH = 20
const MAX_LENGTH = 2000

const EXAMPLE_COMPLAINTS: { title: string; text: string }[] = [
  {
    title: 'Billing dispute',
    text: 'I was charged twice for the same transaction on my credit card statement dated last month. Despite calling customer service three times, the duplicate charge of $149.99 has not been reversed. I am requesting an immediate refund and confirmation in writing.',
  },
  {
    title: 'Loan servicing issue',
    text: 'My mortgage servicer applied my payment to the wrong account for two consecutive months, resulting in late fees and a negative mark on my credit report. I have submitted proof of payment but have received no resolution after 45 days of follow-up.',
  },
  {
    title: 'Debt collection harassment',
    text: 'A debt collection agency has been calling me more than five times per day including on weekends and holidays. They refuse to provide written verification of the alleged debt and continue contacting me despite my written request to cease communication.',
  },
]

export default function SubmitComplaintPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examplesOpen, setExamplesOpen] = useState(false)

  const count = text.length
  const isOverLimit = count > MAX_LENGTH
  const isTooShort = count < MIN_LENGTH
  const isInvalid = isTooShort || isOverLimit

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    setError(null)
  }

  function handleExampleClick(exampleText: string) {
    setText(exampleText)
    setError(null)
    setExamplesOpen(false)
  }

  function handleClear() {
    setText('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isTooShort) {
      setError(`Complaint must be at least ${MIN_LENGTH} characters.`)
      return
    }
    if (isOverLimit) {
      setError(`Complaint must not exceed ${MAX_LENGTH} characters.`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result: ClassificationResult = await classifyComplaint({
        complaint_text: text,
      })
      const resultPath = result.complaint_id != null ? `/result/${result.complaint_id}` : '/result'
      navigate(resultPath, { state: { result, complaintText: text, submittedAt: new Date().toISOString() } })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(`Classification failed: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit a Complaint
        </h1>
        <p className="text-gray-600 mb-6">
          Describe your consumer complaint below. Our AI will classify it and
          provide an explanation.
        </p>

        {/* Example complaints section */}
        <div className="mb-4 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setExamplesOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            aria-expanded={examplesOpen}
          >
            <span>Show example complaints</span>
            <span className="text-lg leading-none">
              {examplesOpen ? '−' : '+'}
            </span>
          </button>

          {examplesOpen && (
            <ul className="border-t border-gray-200 divide-y divide-gray-100">
              {EXAMPLE_COMPLAINTS.map((example) => (
                <li key={example.title}>
                  <button
                    type="button"
                    onClick={() => handleExampleClick(example.text)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-800">
                      {example.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {example.text}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-2">
            <label
              htmlFor="complaint-textarea"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Complaint text
            </label>
            <textarea
              id="complaint-textarea"
              value={text}
              onChange={handleTextChange}
              maxLength={MAX_LENGTH}
              rows={8}
              placeholder="Describe your complaint in detail…"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 resize-y ${
                isOverLimit
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-primary-300'
              }`}
            />
          </div>

          {/* Character counter */}
          <p
            className={`text-xs mb-4 text-right ${
              isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'
            }`}
          >
            Characters: {count} / {MAX_LENGTH}
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={isInvalid || isSubmitting}
              className="flex-1 px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Classifying…' : 'Submit Complaint'}
            </button>
          </div>

          {isTooShort && count > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Please add {MIN_LENGTH - count} more character
              {MIN_LENGTH - count === 1 ? '' : 's'} to meet the minimum length.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
