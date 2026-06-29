CREATE TABLE "trip_edits" (
	"venue_id" integer,
	"trip_id" text,
	"tracking" text,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_edits_pkey" PRIMARY KEY("venue_id","trip_id")
);
--> statement-breakpoint
CREATE TABLE "venue_edits" (
	"venue_id" integer PRIMARY KEY,
	"contact" text,
	"status" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
