import React from 'react'
import {
  Plus,
  Trash2,
  GitFork,
  MessageSquare,
  Settings,
} from 'lucide-react'
import type { DebateListItem } from '../types'

const statusDot: Record<string, string> = {
  running: '#22c55e',
  paused: '#f59e0b',
  completed: '#3b82f6',
  error: '#ef4444',
}

interface LayoutProps {
  debates: DebateListItem[]
  currentDebateId: string | null
  onSelectDebate: (id: string) => void
  onNewDebate: () => void
  onDeleteDebate: (id: string) => void
  onOpenSettings: () => void
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({
  debates,
  currentDebateId,
  onSelectDebate,
  onNewDebate,
  onDeleteDebate,
  onOpenSettings,
  children,
}) => {
  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '16px 14px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            onClick={onNewDebate}
            style={{
              width: '100%',
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'opacity 0.15s ease',
            }}
          >
            <Plus size={16} /> New Debate
          </button>
        </div>

        {/* Debate List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {debates.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              No debates yet
            </div>
          )}
          {debates.map((debate) => {
            const isActive = debate.id === currentDebateId
            return (
              <div
                key={debate.id}
                onClick={() => onSelectDebate(debate.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isActive ? 'var(--card-bg)' : 'transparent',
                  marginBottom: 2,
                  transition: 'background 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      'var(--hover-bg)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  {debate.forked_from ? (
                    <GitFork size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  ) : (
                    <MessageSquare
                      size={12}
                      style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {debate.question.slice(0, 30)}
                    {debate.question.length > 30 ? '...' : ''}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteDebate(debate.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                      opacity: 0.5,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    paddingLeft: 18,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: statusDot[debate.status] || '#6b7280',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{debate.status}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    R{debate.round_count} | {formatDate(debate.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Settings Button */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            onClick={onOpenSettings}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Settings size={14} /> API Keys
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
        {children}
      </div>
    </div>
  )
}
