const ALLOWED_ORIGINS = [
  'https://stooq.com',
  'https://api.exchangerate.host',
  'https://api.exchangerate-api.com',
];

const CACHE_DURATION = 120;
const STALE_WHILE_REVALIDATE = 300;

interface ProxyRequest {
  url: string;
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_ORIGINS.some((origin) => parsedUrl.origin === origin);
  } catch {
    return false;
  }
}

function sanitizeHeaders(headers: Headers): Headers {
  const sanitized = new Headers();

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'content-disposition') {
      return;
    }

    if (
      lowerKey === 'content-type' ||
      lowerKey === 'content-length' ||
      lowerKey === 'cache-control' ||
      lowerKey === 'etag' ||
      lowerKey === 'last-modified'
    ) {
      sanitized.set(key, value);
    }
  });

  return sanitized;
}

export async function GET(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!isAllowedUrl(targetUrl)) {
      return new Response(
        JSON.stringify({ error: 'URL not allowed' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FinancialAdvisorApp/1.0',
        'Accept': 'text/csv, application/json, text/plain, */*',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'External API request failed',
          status: response.status
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const sanitizedHeaders = sanitizeHeaders(response.headers);
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
    };

    sanitizedHeaders.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') || 'text/plain';
    const data = await response.text();

    return new Response(data, {
      status: 200,
      headers: {
        ...responseHeaders,
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('[Market Proxy] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal proxy error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
