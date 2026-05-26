// Cloudflare Worker (static assets + R2)
//   GET    /api/index       → R2의 index.json 반환 (없으면 빈 배열)
//   PUT    /api/index       → 요청 본문(JSON)을 index.json 으로 저장
//   GET    /api/image/{id}  → R2에서 사진 반환
//   PUT    /api/image/{id}  → 사진 업로드 (본문: 이미지 바이너리)
//   DELETE /api/image/{id}  → 사진 삭제
// 그 외 경로는 public/ 의 정적 파일(env.ASSETS)로 처리된다.
// R2 버킷 binding 이름은 "greennote".

function imgKey(id) {
  const clean = String(id || "").replace(/[^a-z0-9]/gi, ""); // 경로 조작 방지
  return clean ? "img/" + clean : null;
}

async function handleIndex(request, env) {
  if (request.method === "GET") {
    const obj = await env.greennote.get("index.json");
    const body = obj ? obj.body : "[]";
    return new Response(body, {
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  if (request.method === "PUT") {
    const text = await request.text();
    try { JSON.parse(text); } catch { return new Response("invalid json", { status: 400 }); }
    await env.greennote.put("index.json", text, {
      httpMetadata: { contentType: "application/json" },
    });
    return new Response("ok");
  }
  return new Response("method not allowed", { status: 405 });
}

async function handleImage(request, env, id) {
  const k = imgKey(id);
  if (!k) return new Response("bad id", { status: 400 });

  if (request.method === "GET") {
    const obj = await env.greennote.get(k);
    if (!obj) return new Response("not found", { status: 404 });
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(obj.body, { headers });
  }
  if (request.method === "PUT") {
    const data = await request.arrayBuffer();
    await env.greennote.put(k, data, {
      httpMetadata: { contentType: request.headers.get("content-type") || "image/jpeg" },
    });
    return new Response("ok");
  }
  if (request.method === "DELETE") {
    await env.greennote.delete(k);
    return new Response("ok");
  }
  return new Response("method not allowed", { status: 405 });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/index") return handleIndex(request, env);

    const imgPrefix = "/api/image/";
    if (pathname.startsWith(imgPrefix)) {
      return handleImage(request, env, pathname.slice(imgPrefix.length));
    }

    return env.ASSETS.fetch(request);
  },
};
