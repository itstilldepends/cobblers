import React, { useState } from 'react'
import { GitFork } from 'lucide-react'
import type { DebateSession } from '../types'

interface ForkControlsProps {
  debate: DebateSession
  onFork: (forkAtRound: number) => Promise<void>
  loading: boolean
}

export const ForkControls: React.FC<ForkControlsProps> = ({
  debate,
  onFork,
  loading,
}) => {
  const [forkRound, setForkRound] = useState(
    debate.rounds.length > 0 ? debate.rounds[debate.rounds.length - 1].number : 1
  )
  const [expanded, setExpanded] = useState(false)

  const handleFork = async () => {
    await onFork(forkRound)
  }

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        padding: 16,
        marginTop: 16,
      }}
    >
      {debate.forked_from && (
        <div
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GitFork size={12} />
          Forked from debate {debate.forked_from.slice(0, 8)}... at round{' '}
          {debate.fork_point}
        </div>
      )}

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            padding: '8px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
          }}
        >
          <GitFork size={14} /> Fork this debate
        </button>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <GitFork size={16} /> Fork Debate
          </div>
          <div style={{ marginBottom: 10 }}>
            <label
              style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Fork from round:
            </label>
            <select
              value={forkRound}
              onChange={(e) => setForkRound(Number(e.target.value))}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 14,
              }}
            >
              {debate.rounds.map((r) => (
                <option key={r.number} value={r.number}>
                  Round {r.number}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleFork}
              disabled={loading}
              style={{
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Forking...' : 'Fork'}
            </button>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
