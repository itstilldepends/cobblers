import type { WSEvent } from '../types'

export function connectDebateWS(
  debateId: string,
  onEvent: (event: WSEvent) => void,
  apiKeys: Record<string, string> = {}
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(
    `${protocol}://${window.location.host}/api/debates/${debateId}/ws`
  )

  ws.onopen = () => {
    // Backend expects api_keys as first message
    ws.send(JSON.stringify({ api_keys: apiKeys }))
  }

  ws.onmessage = (e) => {
    try {
      const event: WSEvent = JSON.parse(e.data)
      onEvent(event)
    } catch (err) {
      console.error('Failed to parse WS message:', err)
    }
  }

  ws.onerror = (e) => {
    console.error('WS error:', e)
  }

  ws.onclose = () => {
    console.log('WS connection closed for debate:', debateId)
  }

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  }
}
