import React from 'react'
import type { Round } from '../types'
import { ResponseCard } from './ResponseCard'

interface RoundViewProps {
  round: Round
  modelIds: string[]
  streamingTokens: Record<string, string>
}

export const RoundView: React.FC<RoundViewProps> = ({
  round,
  modelIds,
  streamingTokens,
}) => {
  return (
    <div>
      <h3 style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 12 }}>
        Round {round.number} Responses
      </h3>
      {round.follow_up && (
        <div
          style={{
            background: 'var(--accent)12',
            border: '1px solid var(--accent)30',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 14,
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--accent)', marginRight: 8 }}>Follow-up:</span>
          {round.follow_up}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {modelIds.map((modelId) => {
          const response = round.responses.find((r) => r.model_id === modelId)
          return (
            <ResponseCard
              key={modelId}
              modelId={modelId}
              response={response}
              streamingText={streamingTokens[modelId]}
            />
          )
        })}
      </div>
    </div>
  )
}
