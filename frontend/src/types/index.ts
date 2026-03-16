export type DebateStatus = 'running' | 'paused' | 'completed' | 'error'

export interface ModelResponse {
  model_id: string
  provider: string
  text: string
}

export interface Disagreement {
  topic: string
  positions: Record<string, string>
}

export interface DebateBrief {
  consensus: string[]
  disagreements: Disagreement[]
  open_questions: string[]
  summary: string
  edited: boolean
}

export interface ConvergenceResult {
  converged: boolean
  confidence: number
  reasoning: string
}

export interface Round {
  number: number
  responses: ModelResponse[]
  brief: DebateBrief | null
  convergence: ConvergenceResult | null
  follow_up: string | null
}

export interface DebateSession {
  id: string
  question: string
  model_ids: string[]
  judge_model_id: string | null
  max_rounds: number
  status: DebateStatus
  rounds: Round[]
  forked_from: string | null
  fork_point: number | null
  created_at: string
}

export interface DebateListItem {
  id: string
  question: string
  status: string
  model_ids: string[]
  round_count: number
  created_at: string
  forked_from: string | null
}

export interface WSEvent {
  type: 'round_start' | 'token' | 'model_response' | 'model_error' | 'brief_generated' | 'brief_error' | 'convergence_check' | 'converged' | 'debate_complete' | 'error'
  [key: string]: any
}

export interface ApiKeys {
  [provider: string]: string
}
