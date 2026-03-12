import React, { useState } from 'react'
import { X, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { useDebateStore } from '../stores/debateStore'
import { validateKeys } from '../api/client'

interface ModelConfigProps {
  onClose: () => void
}

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', placeholder: 'sk-or-...', hint: 'One key for all models — openrouter.ai' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'google', name: 'Google', placeholder: 'AIza...' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...' },
]

export const ModelConfig: React.FC<ModelConfigProps> = ({ onClose }) => {
  const { apiKeys, setApiKey } = useDebateStore()
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({ ...apiKeys })
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<
    Record<string, boolean> | null
  >(null)

  const handleSave = () => {
    for (const provider of PROVIDERS) {
      setApiKey(provider.id, localKeys[provider.id] || '')
    }
    onClose()
  }

  const handleValidate = async () => {
    // Save first, then validate
    for (const provider of PROVIDERS) {
      setApiKey(provider.id, localKeys[provider.id] || '')
    }
    setValidating(true)
    try {
      const keysToValidate: Record<string, string> = {}
      for (const [k, v] of Object.entries(localKeys)) {
        if (v) keysToValidate[k] = v
      }
      const results = await validateKeys(keysToValidate)
      setValidationResults(results)
    } catch {
      // Ignore validation errors
    } finally {
      setValidating(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: 28,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} />
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>API Keys</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Keys are stored locally in your browser and sent directly to the providers.
          They are never stored on the server.
        </p>

        {PROVIDERS.map((provider) => (
          <div key={provider.id} style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {provider.name}
              {validationResults && provider.id in validationResults && (
                validationResults[provider.id] ? (
                  <CheckCircle size={14} style={{ color: '#22c55e' }} />
                ) : (
                  <AlertCircle size={14} style={{ color: '#ef4444' }} />
                )
              )}
            </label>
            {'hint' in provider && provider.hint && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                {provider.hint}
              </div>
            )}
            <input
              type="password"
              value={localKeys[provider.id] || ''}
              onChange={(e) =>
                setLocalKeys({ ...localKeys, [provider.id]: e.target.value })
              }
              placeholder={provider.placeholder}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: 'monospace',
              }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Save
          </button>
          <button
            onClick={handleValidate}
            disabled={validating}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: validating ? 'not-allowed' : 'pointer',
              fontSize: 15,
              opacity: validating ? 0.6 : 1,
            }}
          >
            {validating ? 'Validating...' : 'Validate'}
          </button>
        </div>
      </div>
    </div>
  )
}
