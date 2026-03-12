import { useEffect, useState } from 'react'
import { useDebateStore } from './stores/debateStore'
import { useDebate } from './hooks/useDebate'
import { Layout } from './components/Layout'
import { QuestionInput } from './components/QuestionInput'
import { DebateView } from './components/DebateView'
import { ModelConfig } from './components/ModelConfig'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showInput, setShowInput] = useState(true)

  const debates = useDebateStore((s) => s.debates)
  const fetchDebates = useDebateStore((s) => s.fetchDebates)
  const loadApiKeys = useDebateStore((s) => s.loadApiKeys)
  const error = useDebateStore((s) => s.error)
  const clearError = useDebateStore((s) => s.clearError)

  const {
    currentDebate,
    streamingTokens,
    loading,
    loadDebate,
    newDebate,
    deleteDebate,
    clearDebate,
  } = useDebate()

  useEffect(() => {
    loadApiKeys()
    fetchDebates()
  }, [loadApiKeys, fetchDebates])

  const handleSelectDebate = (id: string) => {
    loadDebate(id)
    setShowInput(false)
  }

  const handleNewDebate = () => {
    clearDebate()
    setShowInput(true)
  }

  const handleStartDebate = async (
    question: string,
    modelIds: string[],
    maxRounds: number,
    judgeModelId?: string | null
  ) => {
    await newDebate(question, modelIds, maxRounds, judgeModelId)
    setShowInput(false)
  }

  const handleDeleteDebate = async (id: string) => {
    await deleteDebate(id)
    if (currentDebate?.id === id) {
      setShowInput(true)
    }
  }

  return (
    <>
      {/* Header */}
      <div
        style={{
          height: 44,
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 16,
          zIndex: 10,
          position: 'relative',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
          Cobblers
        </span>
        <span
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            marginLeft: 8,
          }}
        >
          Multi-LLM Debate
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: '#ef444420',
            borderBottom: '1px solid #ef444440',
            color: '#ef4444',
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            x
          </button>
        </div>
      )}

      <div style={{ height: error ? 'calc(100vh - 76px)' : 'calc(100vh - 44px)' }}>
        <Layout
          debates={debates}
          currentDebateId={currentDebate?.id ?? null}
          onSelectDebate={handleSelectDebate}
          onNewDebate={handleNewDebate}
          onDeleteDebate={handleDeleteDebate}
          onOpenSettings={() => setShowSettings(true)}
        >
          {showInput || !currentDebate ? (
            <QuestionInput onStart={handleStartDebate} loading={loading} />
          ) : (
            <DebateView
              debate={currentDebate}
              streamingTokens={streamingTokens}
              loading={loading}
            />
          )}
        </Layout>
      </div>

      {showSettings && <ModelConfig onClose={() => setShowSettings(false)} />}
    </>
  )
}

export default App
