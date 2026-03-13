// ブログカテゴリー取得用APIエンドポイント
// microCMSから「ブログカテゴリー」を取得する

export async function onRequest(context) {
  try {
    const serviceId = context.env.MICROCMS_SERVICE_ID;
    const apiKey = context.env.MICROCMS_API_KEY;

    if (!serviceId || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://${serviceId}.microcms.io/api/v1/categories`;

    const response = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`microCMS API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch categories' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
