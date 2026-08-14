exports.handler = async (event) => {
  const target = process.env.APPS_SCRIPT_URL;

  if (!target) {
    return json({
      ok: false,
      error: 'APPS_SCRIPT_URL is not configured'
    }, 500);
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const qs = params.toString() ? `?${params.toString()}` : '';
    const url = target + qs;

    const init = {
      method: event.httpMethod,
      redirect: 'follow',
      headers: {}
    };

    if (event.httpMethod === 'POST') {
      init.body = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64')
        : (event.body || '');

      init.headers['content-type'] =
        event.headers['content-type'] ||
        'application/x-www-form-urlencoded;charset=UTF-8';
    }

    const r = await fetch(url, init);
    const text = await r.text();

    return {
      statusCode: r.status,
      headers: {
        'content-type':
          r.headers.get('content-type') ||
          'application/json; charset=utf-8',
        'cache-control': 'no-store'
      },
      body: text
    };

  } catch (e) {
    return json({
      ok: false,
      error: String(e)
    }, 502);
  }
};

function json(obj, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    },
    body: JSON.stringify(obj)
  };
}
