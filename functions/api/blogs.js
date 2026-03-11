export async function onRequest(context) {
  const serviceId = context.env.MICROCMS_SERVICE_ID;
  const apiKey    = context.env.MICROCMS_API_KEY;

  if (!serviceId || !apiKey) {
    return new Response(JSON.stringify({ error: 'API設定がありません' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const res = await fetch(
      `https://${serviceId}.microcms.io/api/v1/blogs?limit=6&orders=-publishedAt`,
      { headers: { 'X-MICROCMS-API-KEY': apiKey } }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `microCMS error: ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
