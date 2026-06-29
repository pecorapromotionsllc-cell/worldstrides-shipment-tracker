import { getStore } from "@netlify/blobs";

// Shared data store for the WorldStrides 1266 shipment tracker.
//   GET  /api/data  -> { overrides: {...} }
//   POST /api/data  with either:
//        { id, field, value, tripId? }         (single edit)
//     or { overrides: {...} }                  (bulk save — "Save changes" button)
//   -> { ok:true, overrides:{...} }
// Errors are returned as JSON { error: "..." } so the page can show the real reason.

const STORE = "ws1266-tracker";
const KEY = "overrides";

// Strong consistency so a read right after a write always reflects the write.
function db() { return getStore({ name: STORE, consistency: "strong" }); }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function deepMerge(target, src) {
  for (const k in src) {
    const v = src[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] = (target[k] && typeof target[k] === "object") ? target[k] : {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

export default async (req) => {
  try {
    const store = db();

    if (req.method === "GET") {
      const data = (await store.get(KEY, { type: "json" })) || {};
      return json({ overrides: data });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "Bad JSON body" }, 400);

      const data = (await store.get(KEY, { type: "json" })) || {};

      if (body.overrides && typeof body.overrides === "object") {
        // Bulk save from the "Save changes" button.
        deepMerge(data, body.overrides);
      } else {
        const { id, field, value, tripId } = body;
        if (id === undefined || !field) return json({ error: "Missing id/field" }, 400);
        data[id] = data[id] || {};
        if (field === "tracking" || field === "notes") {
          data[id][field] = data[id][field] || {};
          data[id][field][tripId] = value;
        } else {
          data[id][field] = value;
        }
      }

      await store.setJSON(KEY, data);
      return json({ ok: true, overrides: data });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    // Surface the real error (e.g. Blobs misconfig) instead of failing silently.
    return json({ error: String((e && e.message) || e) }, 500);
  }
};

export const config = { path: "/api/data" };
