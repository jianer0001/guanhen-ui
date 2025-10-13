export async function onRequest({ request, next }: any) {
  // Basic security headers
  const security = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
  }

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...security,
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'access-control-allow-headers': 'content-type,authorization,x-requested-with',
      },
    })
  }

  // Continue to next function or static asset
  try {
    return await next()
  } catch (e) {
    return new Response(null, {
      status: 500,
      headers: {
        ...security,
        'access-control-allow-origin': '*',
      },
    })
  }
}
