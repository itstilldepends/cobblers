import { create } from 'zustand'
import type { DebateListItem, DebateSession, WSEvent } from '../types'
import * as api from '../api/client'

const API_KEYS_STORAGE_KEY = 'cobblers_api_keys'

interface DebateStore {
  debates: DebateListItem[]
  currentDebate: DebateSession | null
  streamingTokens: Record<string, string>
  loading: boolean
  error: string | null
  apiKeys: Record<string, string>

  fetchDebates: () => Promise<void>
  fetchDebate: (id: string) => Promise<void>
  startDebate: (question: string, modelIds: string[], maxRounds: number, judgeModelId?: string | null) => Promise<string>
  deleteDebate: (id: string) => Promise<void>
  resumeDebate: (id: string) => Promise<void>
  followUpDebate: (id: string, question: string) => Promise<void>
  forkDebate: (id: string, forkAtRound: number, question?: string) => Promise<string>
  setApiKey: (provider: string, key: string) => void
  loadApiKeys: () => void
  clearError: () => void
  setCurrentDebate: (debate: DebateSession | null) => void
  updateFromEvent: (event: WSEvent) => void
}

export const useDebateStore = create<DebateStore>((set, get) => ({
  debates: [],
  currentDebate: null,
  streamingTokens: {},
  loading: false,
  error: null,
  apiKeys: {},

  fetchDebates: async () => {
    try {
      const debates = await api.listDebates()
      set({ debates })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch debates' })
    }
  },

  fetchDebate: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const debate = await api.getDebate(id)
      set({ currentDebate: debate, loading: false, streamingTokens: {} })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch debate', loading: false })
    }
  },

  startDebate: async (question: string, modelIds: string[], maxRounds: number, judgeModelId?: string | null) => {
    set({ loading: true, error: null, streamingTokens: {} })
    try {
      const debate = await api.createDebate(question, modelIds, maxRounds, get().apiKeys, judgeModelId)
      set({ currentDebate: debate, loading: false })
      get().fetchDebates()
      return debate.id
    } catch (err: any) {
      set({ error: err.message || 'Failed to start debate', loading: false })
      throw err
    }
  },

  deleteDebate: async (id: string) => {
    try {
      await api.deleteDebate(id)
      const { currentDebate } = get()
      if (currentDebate?.id === id) {
        set({ currentDebate: null })
      }
      get().fetchDebates()
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete debate' })
    }
  },

  resumeDebate: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await api.resumeDebate(id, get().apiKeys)
      set({ loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to resume debate', loading: false })
    }
  },

  followUpDebate: async (id: string, question: string) => {
    set({ loading: true, error: null, streamingTokens: {} })
    try {
      const debate = await api.followUpDebate(id, question, get().apiKeys)
      set({ currentDebate: debate, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to send follow-up', loading: false })
    }
  },

  forkDebate: async (id: string, forkAtRound: number, question?: string) => {
    set({ loading: true, error: null })
    try {
      const debate = await api.forkDebate(id, forkAtRound, get().apiKeys, question)
      set({ currentDebate: debate, loading: false, streamingTokens: {} })
      get().fetchDebates()
      return debate.id
    } catch (err: any) {
      set({ error: err.message || 'Failed to fork debate', loading: false })
      throw err
    }
  },

  setApiKey: (provider: string, key: string) => {
    const apiKeys = { ...get().apiKeys }
    if (key) {
      apiKeys[provider] = key
    } else {
      delete apiKeys[provider]
    }
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys))
    set({ apiKeys })
  },

  loadApiKeys: () => {
    try {
      const stored = localStorage.getItem(API_KEYS_STORAGE_KEY)
      if (stored) {
        set({ apiKeys: JSON.parse(stored) })
      }
    } catch {
      // Ignore invalid JSON
    }
  },

  clearError: () => set({ error: null }),

  setCurrentDebate: (debate) => set({ currentDebate: debate, streamingTokens: {} }),

  updateFromEvent: (event: WSEvent) => {
    const { currentDebate } = get()
    if (!currentDebate) return

    switch (event.type) {
      case 'round_start': {
        const newRound = {
          number: event.round,
          responses: [],
          brief: null,
          convergence: null,
          follow_up: (event.follow_up as string) || null,
        }
        set({
          currentDebate: {
            ...currentDebate,
            status: 'running',
            rounds: [...currentDebate.rounds, newRound],
          },
          streamingTokens: {},
        })
        break
      }

      case 'token': {
        const tokens = { ...get().streamingTokens }
        const modelId = event.model_id as string
        tokens[modelId] = (tokens[modelId] || '') + (event.token as string)
        set({ streamingTokens: tokens })
        break
      }

      case 'model_response': {
        const response = {
          model_id: event.model_id as string,
          provider: '',
          text: event.text as string,
        }
        const rounds = [...currentDebate.rounds]
        const lastRound = { ...rounds[rounds.length - 1] }
        lastRound.responses = [...lastRound.responses, response]
        rounds[rounds.length - 1] = lastRound

        const tokens = { ...get().streamingTokens }
        delete tokens[event.model_id as string]

        set({
          currentDebate: { ...currentDebate, rounds },
          streamingTokens: tokens,
        })
        break
      }

      case 'brief_generated': {
        const rounds = [...currentDebate.rounds]
        const roundIdx = rounds.findIndex((r) => r.number === event.round)
        if (roundIdx >= 0) {
          rounds[roundIdx] = { ...rounds[roundIdx], brief: event.brief }
        }
        set({
          currentDebate: { ...currentDebate, rounds },
        })
        break
      }

      case 'convergence_check': {
        const rounds = [...currentDebate.rounds]
        const roundIdx = rounds.findIndex((r) => r.number === event.round)
        if (roundIdx >= 0) {
          rounds[roundIdx] = {
            ...rounds[roundIdx],
            convergence: event.result,
          }
        }
        set({
          currentDebate: { ...currentDebate, rounds },
        })
        break
      }

      case 'converged':
      case 'debate_complete': {
        const status = event.type === 'converged' ? 'completed' : (event.status || 'completed')
        set({
          currentDebate: {
            ...currentDebate,
            status,
          },
          streamingTokens: {},
        })
        get().fetchDebates()
        get().fetchDebate(currentDebate.id)
        break
      }

      case 'error': {
        set({
          error: event.message || 'An error occurred during debate',
          currentDebate: {
            ...currentDebate,
            status: 'error',
          },
        })
        break
      }
    }
  },
}))
