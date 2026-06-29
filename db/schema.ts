import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const venueEdits = pgTable("venue_edits", {
  venueId: integer("venue_id").primaryKey(),
  contact: text("contact"),
  status: text("status"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tripEdits = pgTable("trip_edits", {
  venueId: integer("venue_id").notNull(),
  tripId: text("trip_id").notNull(),
  tracking: text("tracking"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.venueId, table.tripId] }),
]);
