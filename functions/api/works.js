/**
 * Cloudflare Pages Function
 * /api/works へのリクエストを受け取り、
 * サーバー側でmicroCMSの「実績」APIを呼び出して結果を返す。
 * APIキーはCloudflareの環境変数に保存されるため、
 * 訪問者からは一切見えない。
 */
export async function onRequest(context) {
  const { env } = context;

  const SERVICE_ID = env.MICROCMS_SERVICE_ID;
  const API_KEY    = env.MICROCMS_API_KEY;

  if (!SERVICE_ID || !API_KEY) {
    return new Response(
      JSON.stringify({ error: '環境変数が設定されていません。Cloudflareダッシュボードを確認してください。' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(
      `https://${SERVICE_ID}.microcms.io/api/v1/works?limit=100`,
      {
        headers: { 'X-MICROCMS-API-KEY': API_KEY },
      }
    );

    if (!res.ok) throw new Error(`microCMS API error: ${res.status}`);

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
