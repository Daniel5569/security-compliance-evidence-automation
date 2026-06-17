import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  sequenceNumber: integer("sequence_number").notNull(),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  beforeStatus: text("before_status").notNull(),
  afterStatus: text("after_status").notNull(),
  note: text("note").notNull(),
  chainHash: text("chain_hash").notNull(),
  previousHash: text("previous_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
