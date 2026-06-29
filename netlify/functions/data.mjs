import { getStore } from "@netlify/blobs";

// Shared data store for the WorldStrides 1266 shipment tracker.
// GET  /api/data            -> { overrides: {...} }
// POST /api/data {id,field,value,tripId?} -> applies one edit, returns { ok:true }

export default async (req) => {
  const store = getStore("ws1266-tracker");

  if (req.method === "GET") {
    const data = (await store.get("overrides", { type: "json" })) || {};
    return Response.json({ overrides: data }, {
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); }
    catch { return new Response("Bad JSON", { status: 400 }); }

    const { id, field, value, tripId } = body || {};
    if (id === undefined || !field) return new Response("Missing id/field", { status: 400 });

    const data = (await store.get("overrides", { type: "json" })) || {};
    data[id] = data[id] || {};
    if (field === "tracking" || field === "notes") {
      data[id][field] = data[id][field] || {};
      data[id][field][tripId] = value;
    } else {
      data[id][field] = value;
    }
    await store.setJSON("overrides", data);
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/data" };
