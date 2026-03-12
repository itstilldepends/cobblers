import React, { useState } from 'react'
import { Play, AlertCircle } from 'lucide-react'
import type { DebateSession } from '../types'
import { RoundTimeline } from './RoundTimeline'
import { RoundView } from './RoundView'
import { BriefView } from './BriefView'
import { ConvergenceBar } from './ConvergenceBar'
import { ForkControls } from './ForkControls'
import { useDebateStore } from '../stores/debateStore'

interface DebateViewProps {
  debate: DebateSession
  streamingTokens: Record<string, string>
  loading: boolean
}

const statusColors: Record<string, string> = {
  running: '#22c55e',
  paused: '#f59e0b',
  completed: '#3b82f6',
  error: '#ef4444',
}

export const DebateView: React.FC<DebateViewProps> = ({
  debate,
  streamingTokens,
  loading,
}) => {
  const latestRound = debate.rounds.length > 0
    ? debate.rounds[debate.rounds.length - 1].number
    : 0
  const [selectedRound, setSelectedRound] = useState(latestRound)
  const { resumeDebate, forkDebate, fetchDebate } = useDebateStore()

  // Keep selectedRound in sync with latest if it's running
  React.useEffect(() => {
    if (debate.status === 'running' && debate.rounds.length > 0) {
      setSelectedRound(debate.rounds[debate.rounds.length - 1].number)
    }
  }, [debate.rounds.length, debate.status])

  const currentRound = debate.rounds.find((r) => r.number === selectedRound)
  const isLatest = selectedRound === latestRound
  const statusColor = statusColors[debate.status] || '#6b7280'

  const handleResume = async () => {
    await resumeDebate(debate.id)
  }

  const handleFork = async (forkAtRound: number, question?: string) => {
    await forkDebate(debate.id, forkAtRound, question)
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              flex: 1,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {debate.question}
          </h2>
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: statusColor,
              background: `${statusColor}18`,
              padding: '4px 10px',
              borderRadius: 12,
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {debate.status}
          </span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
          Models: {debate.model_ids.join(', ')} | Max rounds: {debate.max_rounds}
        </div>
      </div>

      {/* Timeline */}
      <RoundTimeline
        rounds={debate.rounds}
        selectedRound={selectedRound}
        onSelectRound={setSelectedRound}
      />

      {/* Current Round */}
      {currentRound && (
        <>
          <RoundView
            round={currentRound}
            modelIds={debate.model_ids}
            streamingTokens={isLatest ? streamingTokens : {}}
          />

          {/* Brief */}
          {currentRound.brief && (
            <BriefView
              brief={currentRound.brief}
              debateId={debate.id}
              roundNumber={currentRound.number}
              onBriefEdited={() => fetchDebate(debate.id)}
            />
          )}

          {/* Convergence */}
          {currentRound.convergence && (
            <ConvergenceBar convergence={currentRound.convergence} />
          )}
        </>
      )}

      {debate.rounds.length === 0 && debate.status === 'running' && (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: 'var(--text-muted)',
            fontSize: 15,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          Waiting for first round to start...
        </div>
      )}

      {/* Resume / Error */}
      {debate.status === 'paused' && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleResume}
            disabled={loading}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Play size={16} /> Resume Debate
          </button>
        </div>
      )}

      {debate.status === 'error' && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#ef444415',
            border: '1px solid #ef444430',
            borderRadius: 8,
            color: '#ef4444',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          This debate encountered an error. You can try resuming or forking from an
          earlier round.
        </div>
      )}

      {/* Fork Controls */}
      {debate.rounds.length > 0 && (
        <ForkControls debate={debate} onFork={handleFork} loading={loading} />
      )}
    </div>
  )
}
