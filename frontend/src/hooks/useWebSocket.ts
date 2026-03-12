import { useEffect, useRef } from 'react'
import { connectDebateWS } from '../api/ws'
import { useDebateStore } from '../stores/debateStore'

export function useWebSocket(debateId: string | null, active: boolean) {
  const updateFromEvent = useDebateStore((s) => s.updateFromEvent)
  const apiKeys = useDebateStore((s) => s.apiKeys)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!debateId || !active) return

    cleanupRef.current = connectDebateWS(debateId, updateFromEvent, apiKeys)

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [debateId, active, updateFromEvent, apiKeys])
}
