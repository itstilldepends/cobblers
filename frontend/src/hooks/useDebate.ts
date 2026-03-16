import { useCallback } from 'react'
import { useDebateStore } from '../stores/debateStore'
import { useWebSocket } from './useWebSocket'

export function useDebate() {
  const {
    currentDebate,
    streamingTokens,
    loading,
    error,
    fetchDebate,
    startDebate,
    continueDebate,
    forkDebate,
    deleteDebate,
    clearError,
    setCurrentDebate,
  } = useDebateStore()

  const isRunning = currentDebate?.status === 'running'
  useWebSocket(currentDebate?.id ?? null, isRunning)

  const loadDebate = useCallback(
    async (id: string) => {
      await fetchDebate(id)
    },
    [fetchDebate]
  )

  const newDebate = useCallback(
    async (question: string, modelIds: string[], maxRounds: number, judgeModelId?: string | null) => {
      return await startDebate(question, modelIds, maxRounds, judgeModelId)
    },
    [startDebate]
  )

  const clearDebate = useCallback(() => {
    setCurrentDebate(null)
  }, [setCurrentDebate])

  return {
    currentDebate,
    streamingTokens,
    loading,
    error,
    isRunning,
    loadDebate,
    newDebate,
    continueDebate,
    forkDebate,
    deleteDebate,
    clearError,
    clearDebate,
  }
}
