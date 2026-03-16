import React, { useState } from 'react'
import { Play, AlertCircle, Send } from 'lucide-react'
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
  const [followUp, setFollowUp] = useState('')
  const { resumeDebate, followUpDebate, forkDebate, fetchDebate } = useDebateStore()

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

  const handleFork = async (forkAtRound: number) => {
    await forkDebate(debate.id, forkAtRound)
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
          {currentRound.brief ? (
            <BriefView
              brief={currentRound.brief}
              debateId={debate.id}
              roundNumber={currentRound.number}
              onBriefEdited={() => fetchDebate(debate.id)}
            />
          ) : isLatest && debate.status === 'running' && currentRound.responses.length >= debate.model_ids.length && (
            <div
              style={{
                textAlign: 'center',
                padding: 24,
                color: 'var(--text-muted)',
                fontSize: 14,
                marginTop: 16,
                background: 'var(--card-bg)',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              Generating brief...
            </div>
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
        <div style={{ marginTop: 16, background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
            {debate.forked_from
              ? 'This is a forked debate. Edit the brief above to change the direction, then continue.'
              : 'Debate is paused. Edit the brief above if needed, then continue.'}
          </div>
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
            <Play size={16} /> Continue Debate
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

      {/* Follow-ups */}
      {debate.follow_ups && debate.follow_ups.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
            Follow-up Questions
          </h3>
          {debate.follow_ups.map((fu) => (
            <div key={fu.number} style={{ marginBottom: 24 }}>
              <div
                style={{
                  background: 'var(--accent)12',
                  border: '1px solid var(--accent)30',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 12,
                  fontSize: 15,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--accent)', marginRight: 8 }}>
                  Q{fu.number}:
                </span>
                {fu.question}
              </div>
              <RoundView
                round={{ number: fu.number, responses: fu.responses, brief: null, convergence: null }}
                modelIds={debate.model_ids}
                streamingTokens={fu.number === (debate.follow_ups?.length || 0) && debate.status === 'running' ? streamingTokens : {}}
              />
              {fu.brief && (
                <BriefView
                  brief={fu.brief}
                  debateId={debate.id}
                  roundNumber={-fu.number}
                  onBriefEdited={() => fetchDebate(debate.id)}
                />
              )}
              {!fu.brief && debate.status === 'running' && fu.number === (debate.follow_ups?.length || 0) && fu.responses.length >= debate.model_ids.length && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 24,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                    marginTop: 16,
                    background: 'var(--card-bg)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: '3px solid var(--border)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px',
                    }}
                  />
                  Generating brief...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Follow-up Input */}
      {debate.status === 'completed' && (
        <div
          style={{
            marginTop: 24,
            background: 'var(--card-bg)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            padding: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Ask a follow-up question
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!followUp.trim()) return
              await followUpDebate(debate.id, followUp.trim())
              setFollowUp('')
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Continue the debate with a follow-up..."
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 15,
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={loading || !followUp.trim()}
              style={{
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 8,
                cursor: loading || !followUp.trim() ? 'not-allowed' : 'pointer',
                fontSize: 15,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: loading || !followUp.trim() ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Fork Controls */}
      {debate.rounds.length > 0 && (
        <ForkControls debate={debate} onFork={handleFork} loading={loading} />
      )}
    </div>
  )
}
