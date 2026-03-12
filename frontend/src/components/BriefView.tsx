import React, { useState } from 'react'
import { Edit3, Save, X } from 'lucide-react'
import type { DebateBrief } from '../types'
import { editBrief } from '../api/client'

interface BriefViewProps {
  brief: DebateBrief
  debateId: string
  roundNumber: number
  onBriefEdited?: () => void
}
1
export const BriefView: React.FC<BriefViewProps> = ({
  brief,
  debateId,
  roundNumber,
  onBriefEdited,
}) => {
  const [editing, setEditing] = useState(false)
  const [editState, setEditState] = useState({
    consensus: brief.consensus.join('\n'),
    disagreements: JSON.stringify(brief.disagreements, null, 2),
    open_questions: brief.open_questions.join('\n'),
    summary: brief.summary,
  })

  const handleSave = async () => {
    try {
      let parsedDisagreements
      try {
        parsedDisagreements = JSON.parse(editState.disagreements)
      } catch {
        parsedDisagreements = brief.disagreements
      }

      await editBrief(debateId, roundNumber, {
        consensus: editState.consensus.split('\n').filter(Boolean),
        disagreements: parsedDisagreements,
        open_questions: editState.open_questions.split('\n').filter(Boolean),
        summary: editState.summary,
        edited: true,
      })
      setEditing(false)
      onBriefEdited?.()
    } catch (err) {
      console.error('Failed to save brief:', err)
    }
  }

  const sectionStyle = (color: string): React.CSSProperties => ({
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${color}30`,
    background: `${color}08`,
    marginBottom: 12,
  })

  const headingStyle = (color: string): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 600,
    color,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  })

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        padding: 20,
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          Round {roundNumber} Brief
          {brief.edited && (
            <span
              style={{
                fontSize: 14,
                color: '#d97706',
                marginLeft: 8,
                fontWeight: 400,
              }}
            >
              (edited)
            </span>
          )}
        </h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '4px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 15,
            }}
          >
            <Edit3 size={12} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleSave}
              style={{
                background: '#22c55e',
                border: 'none',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 15,
              }}
            >
              <Save size={12} /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 15,
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Consensus */}
      <div style={sectionStyle('#22c55e')}>
        <div style={headingStyle('#22c55e')}>Consensus</div>
        {editing ? (
          <textarea
            value={editState.consensus}
            onChange={(e) =>
              setEditState({ ...editState, consensus: e.target.value })
            }
            style={{
              width: '100%',
              minHeight: 80,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
            {brief.consensus.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
            {brief.consensus.length === 0 && (
              <li style={{ color: 'var(--text-muted)' }}>No consensus points yet</li>
            )}
          </ul>
        )}
      </div>

      {/* Disagreements */}
      <div style={sectionStyle('#f59e0b')}>
        <div style={headingStyle('#f59e0b')}>Disagreements</div>
        {editing ? (
          <textarea
            value={editState.disagreements}
            onChange={(e) =>
              setEditState({ ...editState, disagreements: e.target.value })
            }
            style={{
              width: '100%',
              minHeight: 120,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'monospace',
            }}
          />
        ) : brief.disagreements.length > 0 ? (
          brief.disagreements.map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                {d.topic}
              </div>
              {Object.entries(d.positions).map(([model, position]) => (
                <div
                  key={model}
                  style={{ fontSize: 15, color: 'var(--text-secondary)', marginLeft: 12 }}
                >
                  <strong>{model}:</strong> {position}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No disagreements identified
          </div>
        )}
      </div>

      {/* Open Questions */}
      <div style={sectionStyle('#3b82f6')}>
        <div style={headingStyle('#3b82f6')}>Open Questions</div>
        {editing ? (
          <textarea
            value={editState.open_questions}
            onChange={(e) =>
              setEditState({ ...editState, open_questions: e.target.value })
            }
            style={{
              width: '100%',
              minHeight: 80,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
            {brief.open_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
            {brief.open_questions.length === 0 && (
              <li style={{ color: 'var(--text-muted)' }}>No open questions</li>
            )}
          </ul>
        )}
      </div>

      {/* Summary */}
      <div style={sectionStyle('#6b7280')}>
        <div style={headingStyle('#9ca3af')}>Summary</div>
        {editing ? (
          <textarea
            value={editState.summary}
            onChange={(e) =>
              setEditState({ ...editState, summary: e.target.value })
            }
            style={{
              width: '100%',
              minHeight: 80,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            {brief.summary || 'No summary available'}
          </p>
        )}
      </div>
    </div>
  )
}
