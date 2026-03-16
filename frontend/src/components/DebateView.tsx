import React, { useState } from 'react'
import { Play, AlertCircle, Send, ChevronDown, ChevronRight } from 'lucide-react'
import type { DebateSession } from '../types'
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
  const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set())
  const [followUp, setFollowUp] = useState('')
  const { continueDebate, forkDebate, fetchDebate } = useDebateStore()

  const statusColor = statusColors[debate.status] || '#6b7280'
  const lastRoundIndex = debate.rounds.length - 1

  const toggleRound = (roundNumber: number) => {
    setCollapsedRounds((prev) => {
      const next = new Set(prev)
      if (next.has(roundNumber)) {
        next.delete(roundNumber)
      } else {
        next.add(roundNumber)
      }
      return next
    })
  }

  const isRoundCollapsed = (roundNumber: number, index: number) => {
    // Latest round always expanded unless explicitly collapsed
    if (index === lastRoundIndex) return collapsedRounds.has(roundNumber)
    // Older rounds collapsed by default unless explicitly expanded
    if (collapsedRounds.has(roundNumber)) return false
    return true
  }

  const handleContinue = async () => {
    await continueDebate(debate.id)
  }

  const handleFork = async () => {
    await forkDebate(debate.id)
  }

  const lastRound = debate.rounds.length > 0 ? debate.rounds[debate.rounds.length - 1] : null

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
          Models: {debate.model_ids.join(', ')} | Rounds per question: {debate.max_rounds}
        </div>
      </div>

      {/* All Rounds */}
      {debate.rounds.map((round, index) => {
        const collapsed = isRoundCollapsed(round.number, index)
        const isLast = index === lastRoundIndex

        return (
          <div key={round.number} style={{ marginBottom: 16 }}>
            {/* Collapsible Header */}
            <button
              onClick={() => toggleRound(round.number)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: collapsed ? 8 : '8px 8px 0 0',
                padding: '10px 14px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              Round {round.number}
              {round.brief && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                  (brief available)
                </span>
              )}
              {round.convergence?.converged && (
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 400, marginLeft: 'auto' }}>
                  Converged
                </span>
              )}
            </button>

            {!collapsed && (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  padding: 16,
                }}
              >
                {/* Follow-up question bubble */}
                {round.question && (
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
                      Follow-up:
                    </span>
                    {round.question}
                  </div>
                )}

                <RoundView
                  round={round}
                  modelIds={debate.model_ids}
                  streamingTokens={isLast ? streamingTokens : {}}
                />

                {/* Brief */}
                {round.brief ? (
                  <BriefView
                    brief={round.brief}
                    debateId={debate.id}
                    roundNumber={round.number}
                    onBriefEdited={() => fetchDebate(debate.id)}
                  />
                ) : isLast && debate.status === 'running' && round.responses.length >= debate.model_ids.length && (
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
                {round.convergence && (
                  <ConvergenceBar convergence={round.convergence} />
                )}
              </div>
            )}
          </div>
        )
      })}

      {debate.status === 'running' && (debate.rounds.length === 0 || (lastRound && lastRound.brief)) && (
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
          {debate.rounds.length === 0 ? 'Waiting for first round to start...' : 'Starting next round...'}
        </div>
      )}

      {/* Error */}
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
          This debate encountered an error. You can try forking or starting a new debate.
        </div>
      )}

      {/* Continue Input — shown for both paused and completed */}
      {(debate.status === 'completed' || debate.status === 'paused') && (
        <div
          style={{
            marginTop: 24,
            background: 'var(--card-bg)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            padding: 16,
          }}
        >
          {debate.status === 'paused' && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
              {debate.forked_from
                ? 'This is a forked debate. Edit the brief above if needed, then continue with or without a new question.'
                : 'Debate is paused. Edit the brief above if needed, then continue.'}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const question = followUp.trim() || undefined
              await continueDebate(debate.id, question)
              setFollowUp('')
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ask a follow-up question, or leave empty to continue..."
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
              disabled={loading}
              style={{
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 15,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Play size={16} /> Continue
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
