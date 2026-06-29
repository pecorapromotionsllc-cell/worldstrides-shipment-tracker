import type { Config } from "@netlify/functions";
import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { tripEdits, venueEdits } from "../../db/schema.js";

// GET  /api/data -> { overrides: {...} }
// POST /api/data {id,field,value,tripId?} -> applies one edit.

const editableFields = new Set(["contact", "status", "tracking", "notes"]);

function asOverrides(
  venues: Array<typeof venueEdits.$inferSelect>,
  trips: Array<typeof tripEdits.$inferSelect>,
) {
  const overrides: Record<string, {
    contact?: string;
    status?: string;
    tracking?: Record<string, string>;
    notes?: Record<string, string>;
  }> = {};

  for (const venue of venues) {
    const id = String(venue.venueId);
    overrides[id] = overrides[id] || {};
    if (venue.contact !== null) overrides[id].contact = venue.contact;
    if (venue.status !== null) overrides[id].status = venue.status;
  }

  for (const trip of trips) {
    const id = String(trip.venueId);
    overrides[id] = overrides[id] || {};
    if (trip.tracking !== null) {
      overrides[id].tracking = overrides[id].tracking || {};
      overrides[id].tracking[trip.tripId] = trip.tracking;
    }
    if (trip.notes !== null) {
      overrides[id].notes = overrides[id].notes || {};
      overrides[id].notes[trip.tripId] = trip.notes;
    }
  }

  return overrides;
}

export default async (req: Request) => {
  if (req.method === "GET") {
    const [venues, trips] = await Promise.all([
      db.select().from(venueEdits),
      db.select().from(tripEdits),
    ]);

    return Response.json({ overrides: asOverrides(venues, trips) }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const { id, field, value, tripId } = body || {};
    if (id === undefined || !field) return new Response("Missing id/field", { status: 400 });
    if (!editableFields.has(field)) return new Response("Unsupported field", { status: 400 });

    const venueId = Number(id);
    if (!Number.isInteger(venueId) || venueId < 0) return new Response("Invalid id", { status: 400 });

    if (field === "tracking" || field === "notes") {
      if (!tripId) return new Response("Missing tripId", { status: 400 });
      await db.insert(tripEdits)
        .values({ venueId, tripId, [field]: String(value ?? "") })
        .onConflictDoUpdate({
          target: [tripEdits.venueId, tripEdits.tripId],
          set: {
            [field]: String(value ?? ""),
            updatedAt: sql`now()`,
          },
        });
    } else {
      await db.insert(venueEdits)
        .values({ venueId, [field]: String(value ?? "") })
        .onConflictDoUpdate({
          target: venueEdits.venueId,
          set: {
            [field]: String(value ?? ""),
            updatedAt: sql`now()`,
          },
        });
    }

    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/data" };
