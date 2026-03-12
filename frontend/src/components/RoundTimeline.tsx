import React from 'react'
import { Check, FileText } from 'lucide-react'
import type { Round } from '../types'

interface RoundTimelineProps {
  rounds: Round[]
  selectedRound: number
  onSelectRound: (n: number) => void
}

export const RoundTimeline: React.FC<RoundTimelineProps> = ({
  rounds,
  selectedRound,
  onSelectRound,
}) => {
  if (rounds.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 0',
        overflowX: 'auto',
      }}
    >
      <span style={{ fontSize: 15, color: 'var(--text-muted)', marginRight: 4 }}>
        Rounds:
      </span>
      {rounds.map((round) => {
        const isSelected = round.number === selectedRound
        const isConverged = round.convergence?.converged
        const hasBrief = !!round.brief

        return (
          <button
            key={round.number}
            onClick={() => onSelectRound(round.number)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 20,
              border: isSelected
                ? '2px solid var(--accent)'
                : '1px solid var(--border)',
              background: isSelected ? 'var(--accent)15' : 'var(--card-bg)',
              color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: isSelected ? 600 : 400,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {round.number}
            {hasBrief && (
              <FileText
                size={12}
                style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
              />
            )}
            {isConverged && <Check size={14} style={{ color: '#22c55e' }} />}
          </button>
        )
      })}
    </div>
  )
}
