import React from 'react'
import type { ConvergenceResult } from '../types'

interface ConvergenceBarProps {
  convergence: ConvergenceResult
}

export const ConvergenceBar: React.FC<ConvergenceBarProps> = ({ convergence }) => {
  const pct = Math.round(convergence.confidence * 100)
  let color = '#ef4444'
  if (pct >= 70) color = '#22c55e'
  else if (pct >= 40) color = '#f59e0b'

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        padding: '12px 16px',
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          Convergence
          {convergence.converged && (
            <span style={{ color: '#22c55e', marginLeft: 8 }}>Converged!</span>
          )}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--bg-primary)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.5s ease, background 0.3s ease',
          }}
        />
      </div>
      {convergence.reasoning && (
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          {convergence.reasoning}
        </p>
      )}
    </div>
  )
}
