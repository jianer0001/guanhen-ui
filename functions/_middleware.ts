export async function onRequest({ request }: any) {
  // Basic security headers
  const security = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
  }

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

  // Continue
  try {
    return undefined as any // allow request to proceed to next function/asset
  } catch (e) {
    const security = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    }
    return new Response(null, {
      status: 500,
      headers: {
        ...security,
        'access-control-allow-origin': '*',
      },
    })
  }
}
