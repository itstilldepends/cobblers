import React, { useState, useEffect } from 'react'
import { Play, Circle } from 'lucide-react'
import { listModels, getServerKeys } from '../api/client'
import { useDebateStore } from '../stores/debateStore'

interface QuestionInputProps {
  onStart: (question: string, modelIds: string[], maxRounds: number, judgeModelId?: string | null) => Promise<void>
  loading: boolean
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ onStart, loading }) => {
  const [question, setQuestion] = useState('')
  const [availableModels, setAvailableModels] = useState<
    { model_id: string; provider: string }[]
  >([])
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cobblers_selected_models')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [judgeModel, setJudgeModel] = useState<string>(() =>
    localStorage.getItem('cobblers_judge_model') || ''
  )
  const [maxRounds, setMaxRounds] = useState(() => {
    const saved = localStorage.getItem('cobblers_max_rounds')
    return saved ? Number(saved) : 5
  })
  const [modelsLoading, setModelsLoading] = useState(true)
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({})
  const apiKeys = useDebateStore((s) => s.apiKeys)

  useEffect(() => {
    getServerKeys().then(setServerKeys).catch(() => {})
    listModels()
      .then((models) => {
        setAvailableModels(models)
        // Only set defaults if no saved selection
        setSelectedModels((prev) => {
          if (prev.length > 0) return prev
          return models.slice(0, 3).map((m) => m.model_id)
        })
      })
      .catch(() => {
        // Set some defaults if API is not available
        setAvailableModels([
          { model_id: 'claude-sonnet', provider: 'anthropic' },
          { model_id: 'gpt-5.4', provider: 'openai' },
          { model_id: 'gemini-flash', provider: 'google' },
          { model_id: 'deepseek', provider: 'deepseek' },
        ])
      })
      .finally(() => setModelsLoading(false))
  }, [])

  // Persist selections to localStorage
  useEffect(() => {
    localStorage.setItem('cobblers_selected_models', JSON.stringify(selectedModels))
  }, [selectedModels])
  useEffect(() => {
    localStorage.setItem('cobblers_judge_model', judgeModel)
  }, [judgeModel])
  useEffect(() => {
    localStorage.setItem('cobblers_max_rounds', String(maxRounds))
  }, [maxRounds])

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((m) => m !== modelId)
        : [...prev, modelId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || selectedModels.length < 2) return
    await onStart(question.trim(), selectedModels, maxRounds, judgeModel || null)
  }

  // Map provider names from model list to API key names
  const providerToKeyName: Record<string, string> = { google: 'gemini' }
  const providers = [...new Set(availableModels.map((m) => m.provider))]
  const configuredProviders = new Set(
    Object.entries(apiKeys)
      .filter(([, v]) => v)
      .map(([k]) => k)
  )
  const isProviderConfigured = (provider: string) => {
    const keyName = providerToKeyName[provider] || provider
    return configuredProviders.has(keyName) || serverKeys[keyName] === true
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 32px',
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Start a New Debate
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32 }}>
        Ask a question and let multiple LLMs debate until they reach consensus.
      </p>

      {/* API Key Status */}
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          padding: 14,
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: 'var(--text-muted)' }}>
          API KEY STATUS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {providers.map((provider) => {
            const configured = isProviderConfigured(provider)
            return (
              <div
                key={provider}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Circle
                  size={8}
                  fill={configured ? '#22c55e' : '#ef4444'}
                  color={configured ? '#22c55e' : '#ef4444'}
                />
                <span style={{ textTransform: 'capitalize' }}>{provider}</span>
              </div>
            )
          })}
          {providers.length === 0 && (
            <span style={{ color: 'var(--text-muted)' }}>
              No providers available. Configure API keys in settings.
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Question */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should the LLMs debate about?"
            rows={4}
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 14,
              fontSize: 15,
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Models (select at least 2)
          </label>
          {modelsLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Loading models...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableModels.map((model) => (
                <label
                  key={model.model_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: selectedModels.includes(model.model_id)
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                    background: selectedModels.includes(model.model_id)
                      ? 'var(--accent)10'
                      : 'transparent',
                    fontSize: 14,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.model_id)}
                    onChange={() => toggleModel(model.model_id)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span style={{ flex: 1 }}>{model.model_id}</span>
                  <span
                    style={{
                      fontSize: 14,
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {model.provider}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Judge Model */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Judge Model
          </label>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
            Generates briefs and checks convergence. Not a debater — picks from all available models.
          </div>
          <select
            value={judgeModel}
            onChange={(e) => setJudgeModel(e.target.value)}
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 15,
              minWidth: 200,
            }}
          >
            <option value="">Auto (first debater)</option>
            {availableModels.map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.model_id} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        {/* Max Rounds */}
        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Max Rounds
          </label>
          <select
            value={maxRounds}
            onChange={(e) => setMaxRounds(Number(e.target.value))}
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 15,
            }}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !question.trim() || selectedModels.length < 2}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 10,
            cursor:
              loading || !question.trim() || selectedModels.length < 2
                ? 'not-allowed'
                : 'pointer',
            fontSize: 16,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity:
              loading || !question.trim() || selectedModels.length < 2 ? 0.5 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          <Play size={18} />
          {loading ? 'Starting...' : 'Start Debate'}
        </button>
      </form>
    </div>
  )
}
