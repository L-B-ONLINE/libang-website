// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
export {};
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category", { enum: ["notice", "free", "question", "development", "gaming", "daily"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
}, (table) => [
  index("posts_created_at_idx").on(table.createdAt),
  index("posts_category_created_at_idx").on(table.category, table.createdAt),
]);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const subadmins = sqliteTable("subadmins", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
});

export const guideSections = sqliteTable("guide_sections", {
  key: text("key").primaryKey(),
  content: text("content").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const minecraftProfiles = sqliteTable("minecraft_profiles", {
  userId: text("user_id").primaryKey(),
  uuid: text("uuid").notNull(),
  name: text("name").notNull(),
  skinUrl: text("skin_url"),
  skinVariant: text("skin_variant"),
  capes: text("capes").notNull(),
  connectedAt: integer("connected_at", { mode: "timestamp_ms" }).notNull(),
});

export const minecraftLinkAttempts = sqliteTable("minecraft_link_attempts", {
  state: text("state").primaryKey(),
  userId: text("user_id").notNull(),
  verifier: text("verifier").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
