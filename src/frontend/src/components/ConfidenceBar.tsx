interface ConfidenceBarProps {
  confidence: number
}

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'HIGH'
  if (confidence >= 0.5) return 'MEDIUM'
  return 'LOW'
}

function getBarColour(level: ConfidenceLevel): string {
  if (level === 'HIGH') return 'bg-green-500'
  if (level === 'MEDIUM') return 'bg-yellow-400'
  return 'bg-red-500'
}

function getBadgeColour(level: ConfidenceLevel): string {
  if (level === 'HIGH') return 'bg-green-100 text-green-800'
  if (level === 'MEDIUM') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const level = getConfidenceLevel(confidence)
  const percentage = Math.round(confidence * 100)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          Confidence: {percentage}%
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeColour(level)}`}
        >
          {level}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getBarColour(level)}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Classification confidence: ${percentage}% (${level})`}
        />
      </div>
    </div>
  )
}
