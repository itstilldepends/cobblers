import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { ModelResponse } from '../types'

const providerColors: Record<string, string> = {
  anthropic: '#d97706',
  openai: '#10b981',
  google: '#3b82f6',
  deepseek: '#8b5cf6',
}

interface ResponseCardProps {
  response?: ModelResponse
  modelId: string
  streamingText?: string
}

export const ResponseCard: React.FC<ResponseCardProps> = ({
  response,
  modelId,
  streamingText,
}) => {
  const provider = response?.provider || modelId.split('/')[0] || 'unknown'
  const color = providerColors[provider] || '#6b7280'
  const text = response?.text || streamingText || ''
  const isStreaming = !response && !!streamingText

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 280,
        background: 'var(--card-bg)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 15 }}>{modelId}</span>
        <span
          style={{
            fontSize: 14,
            color: color,
            background: `${color}20`,
            padding: '2px 8px',
            borderRadius: 4,
            marginLeft: 'auto',
          }}
        >
          {provider}
        </span>
        {isStreaming && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse 1.5s infinite',
              flexShrink: 0,
            }}
          />
        )}
      </div>
      <div
        style={{
          padding: 16,
          fontSize: 15,
          lineHeight: 1.7,
          overflow: 'auto',
          flex: 1,
        }}
        className="markdown-body"
      >
        {text ? (
          <>
            <ReactMarkdown>{text}</ReactMarkdown>
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 16,
                  background: 'var(--text-primary)',
                  animation: 'blink 1s infinite',
                  verticalAlign: 'text-bottom',
                  marginLeft: 2,
                }}
              />
            )}
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Waiting for response...</span>
        )}
      </div>
    </div>
  )
}
