// Vercel serverless function: the shared store behind /api/data.
// Backed by Upstash Redis, created from the Vercel dashboard
// (project → Storage → Create Database → Upstash Redis → Connect).
// The integration injects the REST URL/token env vars used below.
// One key holds the whole JSON document the frontend reads and writes.

const KEY = "smi-data";
const EMPTY = { attempts: [], bookings: [], prizes: [] };

// The Vercel ↔ Upstash integration names its variables <PREFIX>_REST_API_URL
// and <PREFIX>_REST_API_TOKEN (prefix chosen when connecting, e.g. KV or
// STORAGE). Upstash's own console uses UPSTASH_REDIS_REST_URL/_TOKEN.
// Accept any of them so the prefix doesn't matter.
function redis() {
  const env = process.env;
  const urlKey = Object.keys(env).find((k) => /(_REST_API_URL|REDIS_REST_URL)$/.test(k) && /^https?:\/\//.test(env[k] || ""));
  if (!urlKey) return null;
  const tokenKey = urlKey.replace(/URL$/, "TOKEN");
  const token = env[tokenKey];
  if (!token) return null;
  return { url: env[urlKey].replace(/\/$/, ""), headers: { Authorization: `Bearer ${token}` } };
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    return typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  const r = redis();
  if (!r) {
    res.status(503).end(JSON.stringify({ error: "no store connected", hint: "Vercel → Storage → Upstash Redis" }));
    return;
  }

  try {
    if (req.method === "GET") {
      const resp = await fetch(`${r.url}/get/${KEY}`, { headers: r.headers });
      const { result } = await resp.json();
      res.status(200).end(result || JSON.stringify(EMPTY));
      return;
    }
    if (req.method === "PUT" || req.method === "POST") {
      const body = await readBody(req);
      const doc = JSON.parse(body); // reject invalid payloads
      if (!doc || !Array.isArray(doc.bookings)) throw new Error("bad shape");
      const resp = await fetch(`${r.url}/set/${KEY}`, { method: "POST", headers: r.headers, body });
      const out = await resp.json();
      if (out.error) throw new Error(out.error);
      res.status(200).end('{"ok":true}');
      return;
    }
    res.status(405).end("{}");
  } catch (e) {
    res.status(400).end(JSON.stringify({ ok: false, error: String(e.message || e) }));
  }
}
