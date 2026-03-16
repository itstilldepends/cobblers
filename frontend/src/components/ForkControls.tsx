import React from 'react'
import { GitFork } from 'lucide-react'
import type { DebateSession } from '../types'

interface ForkControlsProps {
  debate: DebateSession
  onFork: () => Promise<void>
  loading: boolean
}

export const ForkControls: React.FC<ForkControlsProps> = ({
  debate,
  onFork,
  loading,
}) => {
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
          Forked from debate {debate.forked_from.slice(0, 8)}...
        </div>
      )}

      <button
        onClick={onFork}
        disabled={loading}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          padding: '8px 14px',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <GitFork size={14} /> {loading ? 'Forking...' : 'Fork this debate'}
      </button>
    </div>
  )
}
