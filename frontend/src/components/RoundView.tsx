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
