// GET    /api/image/{id}  → R2에서 사진 반환
// PUT    /api/image/{id}  → 사진 업로드 (본문: 이미지 바이너리)
// DELETE /api/image/{id}  → 사진 삭제
// R2 버킷 binding 이름은 "greennote".

function key(params) {
  const id = String(params.id || "").replace(/[^a-z0-9]/gi, ""); // 경로 조작 방지
  return id ? "img/" + id : null;
}

export async function onRequestGet({ env, params }) {
  const k = key(params);
  if (!k) return new Response("bad id", { status: 400 });
  const obj = await env.greennote.get(k);
  if (!obj) return new Response("not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

export async function onRequestPut({ env, params, request }) {
  const k = key(params);
  if (!k) return new Response("bad id", { status: 400 });
  const data = await request.arrayBuffer();
  await env.greennote.put(k, data, {
    httpMetadata: { contentType: request.headers.get("content-type") || "image/jpeg" },
  });
  return new Response("ok");
}

export async function onRequestDelete({ env, params }) {
  const k = key(params);
  if (!k) return new Response("bad id", { status: 400 });
  await env.greennote.delete(k);
  return new Response("ok");
}
