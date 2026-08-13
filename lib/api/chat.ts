import { BACKEND_BASE_URL, getToken, request } from './http'

export type BackendConversationMessage = {
  id: string
  session_id: string
  role: 'trainee' | 'patient'
  content: string
  severity: number
  risk_flags: string[]
  ai_provider?: string | null
  ai_model?: string | null
  tokens_input?: number | null
  tokens_output?: number | null
  tokens_used?: number | null
  latency_ms?: number | null
  created_at: string
}

export async function getConversationHistory(sessionId: string) {
  return request<BackendConversationMessage[]>(`/conversation/${sessionId}/history`)
}

export async function sendConversationMessage(sessionId: string, content: string) {
  return request<BackendConversationMessage>(`/conversation/${sessionId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/**
 * Conecta al endpoint SSE de streaming.
 * Retorna un EventSource que emite chunks del NPC en tiempo real.
 *
 * Uso en el componente:
 *   const es = await connectConversationStream(sessionId, content)
 *   es.onmessage = (e) => {
 *     const data = JSON.parse(e.data)
 *     if (data.chunk) setResponse(prev => prev + data.chunk)
 *     if (data.done) { setSeverity(data.severity); es.close() }
 *   }
 */
export type StreamDonePayload = {
  severity: number
  should_close: boolean
  closing_kind: 'success' | 'crisis' | 'inappropriate' | null
  metrics?: {
    provider: string
    model: string
    tokens_input: number
    tokens_output: number
    latency_ms: number
    ttft_ms: number
  }
}

export type StreamHandle = {
  close: () => void
  onChunk: (cb: (text: string) => void) => void
  onDone: (cb: (data: StreamDonePayload) => void) => void
  onError: (cb: (err: Error) => void) => void
  /** Llama esto DESPUES de configurar los callbacks para empezar a leer */
  start: () => void
}

/**
 * Conecta al endpoint SSE de streaming. Resuelve el race condition con
 * onChunk/onDone: el reader NO arranca hasta que el caller llame start().
 */
export async function connectConversationStream(
  sessionId: string,
  content: string,
): Promise<StreamHandle> {
  const token = await getToken()

  const response = await fetch(`${BACKEND_BASE_URL}/conversation/${sessionId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Error ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  let chunkCallback: ((text: string) => void) | null = null
  let doneCallback: ((data: StreamDonePayload) => void) | null = null
  let errorCallback: ((err: Error) => void) | null = null
  let closed = false
  let started = false

  const readLoop = async () => {
    let buffer = ''
    try {
      while (!closed) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.chunk && chunkCallback) chunkCallback(payload.chunk)
            if (payload.done && doneCallback) {
              doneCallback({
                severity: payload.severity,
                should_close: payload.should_close,
                closing_kind: payload.closing_kind ?? null,
                metrics: payload.metrics,
              })
            }
          } catch {
            // chunk malformado — ignorar
          }
        }
      }
    } catch (err) {
      if (errorCallback) errorCallback(err as Error)
    }
  }

  return {
    close: () => { closed = true; reader.cancel().catch(() => {}) },
    onChunk: (cb) => { chunkCallback = cb },
    onDone: (cb) => { doneCallback = cb },
    onError: (cb) => { errorCallback = cb },
    start: () => {
      if (started) return
      started = true
      void readLoop()
    },
  }
}
