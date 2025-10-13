type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | null | undefined>
  body?: TBody
  timeoutMs?: number
}

export interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

function assertHeaders(obj: unknown): obj is Record<string, string> {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof k !== 'string' || typeof v !== 'string') return false
    }
    return true
  }
  return false
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === null || v === undefined) continue
    params.append(k, String(v))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

export async function apiFetch<T = unknown, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<ApiResponse<T>> {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return { ok: false, status: 400, error: 'Invalid path' }
  }
  const method = (options.method ?? 'GET').toUpperCase() as HttpMethod
  const allowed: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  if (!allowed.includes(method)) return { ok: false, status: 405, error: 'Unsupported method' }

  const headers: Record<string, string> = assertHeaders(options.headers) ? options.headers : {}
  const timeoutMs = typeof options.timeoutMs === 'number' && options.timeoutMs > 0 ? options.timeoutMs : 10000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let body: BodyInit | undefined
  if (method !== 'GET') {
    if (options.body !== undefined && options.body !== null) {
      // Prefer JSON
      // If FormData/Blob/ArrayBuffer, let browser set the correct content-type
      if ((typeof FormData !== 'undefined' && options.body instanceof FormData) ||
          (typeof Blob !== 'undefined' && options.body instanceof Blob) ||
          (typeof ArrayBuffer !== 'undefined' && options.body instanceof ArrayBuffer)) {
        body = options.body as unknown as BodyInit
      } else {
        headers['content-type'] = headers['content-type'] || 'application/json; charset=utf-8'
        body = headers['content-type'].includes('application/json')
          ? JSON.stringify(options.body)
          : (options.body as unknown as BodyInit)
      }
    }
  }

  const url = `/api${path}` + buildQuery(options.query)

  try {
    const resp = await fetch(url, { method, headers, body, signal: controller.signal })
    clearTimeout(timer)
    const ct = resp.headers.get('content-type') || ''
    const isJson = ct.includes('application/json')
    const data = isJson ? await resp.json() : await resp.text()
    return { ok: resp.ok, status: resp.status, data: data as T }
  } catch (e) {
    const isAbort = e instanceof Error && e.name === 'AbortError'
    return { ok: false, status: isAbort ? 408 : 500, error: isAbort ? 'Request timeout' : 'Network error' }
  }
}

// Example usage:
// const res = await apiFetch<MyType>('/users', { method: 'GET' })
// if (res.ok) console.log(res.data)
