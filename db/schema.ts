// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
export {};
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const bookmarks = sqliteTable("bookmarks", {
  userId: text("user_id").notNull(),
  kind: text("kind", { enum: ["post", "guide", "version"] }).notNull(),
  resourceId: text("resource_id").notNull(),
  title: text("title").notNull(),
  href: text("href").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, table => [primaryKey({ columns: [table.userId, table.kind, table.resourceId] }), index("bookmarks_user_created_idx").on(table.userId, table.createdAt)]);

export const serverUpdates = sqliteTable("server_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serverSlug: text("server_slug").notNull(),
  category: text("category", { enum: ["announcement", "update", "development", "maintenance"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  authorId: text("author_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, table => [index("server_updates_published_idx").on(table.published, table.createdAt)]);

export const serverPairCodes = sqliteTable("server_pair_codes", {
  serverSlug: text("server_slug").primaryKey(),
  codeHash: text("code_hash").notNull(),
  requestedBy: text("requested_by").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, table => [uniqueIndex("server_pair_codes_hash_idx").on(table.codeHash)]);

export const serverCredentials = sqliteTable("server_credentials", {
  id: text("id").primaryKey(),
  serverSlug: text("server_slug").notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, table => [uniqueIndex("server_credentials_slug_idx").on(table.serverSlug)]);

export const serverHeartbeats = sqliteTable("server_heartbeats", {
  serverSlug: text("server_slug").primaryKey(),
  credentialId: text("credential_id").notNull(),
  state: text("state", { enum: ["online", "offline"] }).notNull(),
  playersOnline: integer("players_online").notNull(),
  playersMax: integer("players_max").notNull(),
  gameVersion: text("game_version").notNull(),
  supportedVersions: text("supported_versions").notNull(),
  software: text("software").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
