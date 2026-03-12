import type { DebateListItem, DebateSession, DebateBrief } from '../types'

const BASE = '/api'

export async function createDebate(
  question: string,
  modelIds: string[],
  maxRounds: number,
  apiKeys: Record<string, string>,
  judgeModelId?: string | null
): Promise<DebateSession> {
  const res = await fetch(`${BASE}/debates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      model_ids: modelIds,
      judge_model_id: judgeModelId || null,
      max_rounds: maxRounds,
      api_keys: apiKeys,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listDebates(): Promise<DebateListItem[]> {
  const res = await fetch(`${BASE}/debates`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getDebate(id: string): Promise<DebateSession> {
  const res = await fetch(`${BASE}/debates/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteDebate(id: string): Promise<void> {
  const res = await fetch(`${BASE}/debates/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
}

export async function editBrief(
  debateId: string,
  roundNum: number,
  brief: Partial<DebateBrief>
): Promise<void> {
  const res = await fetch(`${BASE}/debates/${debateId}/rounds/${roundNum}/brief`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brief),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function resumeDebate(
  id: string,
  apiKeys: Record<string, string>
): Promise<void> {
  const res = await fetch(`${BASE}/debates/${id}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_keys: apiKeys }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function forkDebate(
  id: string,
  forkAtRound: number,
  apiKeys: Record<string, string>,
  question?: string
): Promise<DebateSession> {
  const res = await fetch(`${BASE}/debates/${id}/fork`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fork_at_round: forkAtRound,
      api_keys: apiKeys,
      question,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function validateKeys(
  apiKeys: Record<string, string>
): Promise<Record<string, boolean>> {
  const res = await fetch(`${BASE}/validate-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_keys: apiKeys }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listModels(): Promise<{ model_id: string; provider: string }[]> {
  const res = await fetch(`${BASE}/models`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
