/**
 * Cloudflare Pages Function
 * /api/blogs へのリクエストを受け取り、
 * サーバー側でmicroCMSのAPIを呼び出して結果を返す。
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
    // URLからクエリパラメータを取得
    const url = new URL(context.request.url);
    const blogId = url.searchParams.get('id');
    
    // 特定の記事IDが指定されている場合と、リスト取得の場合で処理を分ける
    let apiUrl;
    if (blogId) {
      // 特定の記事を取得（depth=2で関連記事の詳細情報も取得）
      apiUrl = `https://${SERVICE_ID}.microcms.io/api/v1/blogs/${blogId}?depth=2`;
    } else {
      // 記事一覧を取得（最新3件、depth=2で関連記事の詳細情報も取得）
      apiUrl = `https://${SERVICE_ID}.microcms.io/api/v1/blogs?limit=3&orders=-publishedAt&depth=2`;
    }
    
    const res = await fetch(apiUrl, {
      headers: { 'X-MICROCMS-API-KEY': API_KEY },
    });

    if (!res.ok) throw new Error(`microCMS API error: ${res.status}`);

    const data = await res.json();
    
    // 単一記事取得の場合、contentsの形式に統一
    const responseData = blogId ? { contents: [data] } : data;

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
