export const onRequest: PagesFunction = async ({ request, env }) => {
  // Env must provide WORKER_URL, e.g., https://your-worker.your-subdomain.workers.dev
  const workerBase = env.WORKER_URL
  if (typeof workerBase !== 'string' || !workerBase.startsWith('http')) {
    return new Response(JSON.stringify({ error: 'WORKER_URL not configured' }), {
      status: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    })
  }

  // Build target URL by preserving path and query after /api
  const url = new URL(request.url)
  const apiPrefix = '/api'
  const pathAfterApi = url.pathname.startsWith(apiPrefix)
    ? url.pathname.substring(apiPrefix.length)
    : url.pathname
  // Ensure single slash joining
  const targetUrl = new URL(
    pathAfterApi.replace(/^\/+/, ''),
    workerBase.endsWith('/') ? workerBase : workerBase + '/',
  )
  targetUrl.search = url.search

  // Copy method and body safely
  const method = request.method.toUpperCase()
  const safeMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
  if (!safeMethods.has(method)) {
    return new Response(JSON.stringify({ error: 'Unsupported method' }), {
      status: 405,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  // Forward headers but drop hop-by-hop and sensitive ones
  const hopByHop = new Set([
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailer', 'transfer-encoding', 'upgrade', 'host'
  ])
  const outHeaders = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (!hopByHop.has(lower)) {
      // Prevent overriding our CORS
      if (lower !== 'origin') {
        outHeaders.set(key, value)
      }
    }
  })

  // Build init with timeout using AbortController
  const controller = new AbortController()
  const timeoutMs = 15000
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let body: BodyInit | null = null
  if (method !== 'GET' && method !== 'HEAD') {
    // Only forward body if content-length not zero
    body = await request.clone().arrayBuffer()
  }

  try {
    const resp = await fetch(targetUrl, {
      method,
      headers: outHeaders,
      body,
      signal: controller.signal,
    })
    clearTimeout(timer)

    // Compose CORS headers for browser
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,x-requested-with',
    }

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const mergedHeaders = new Headers(resp.headers)
    Object.entries(corsHeaders).forEach(([k, v]) => mergedHeaders.set(k, v))

    return new Response(resp.body, {
      status: resp.status,
      headers: mergedHeaders,
    })
  } catch (err) {
    const isAbort = err instanceof Error && (err.name === 'AbortError')
    return new Response(JSON.stringify({ error: isAbort ? 'Upstream timeout' : 'Upstream error' }), {
      status: isAbort ? 504 : 502,
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
    })
  }
}
