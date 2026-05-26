// GET  /api/index  → R2의 index.json 반환 (없으면 빈 배열)
// PUT  /api/index  → 요청 본문(JSON)을 index.json 으로 저장
// R2 버킷은 Pages 프로젝트에 binding 이름 "greennote" 로 연결되어 있어야 한다.

export async function onRequestGet({ env }) {
  const obj = await env.greennote.get("index.json");
  const body = obj ? obj.body : "[]";
  return new Response(body, {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function onRequestPut({ env, request }) {
  const text = await request.text();
  try { JSON.parse(text); } catch { return new Response("invalid json", { status: 400 }); }
  await env.greennote.put("index.json", text, {
    httpMetadata: { contentType: "application/json" },
  });
  return new Response("ok");
}
