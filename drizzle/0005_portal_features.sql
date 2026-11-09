CREATE TABLE `bookmarks` (
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`resource_id` text NOT NULL,
	`title` text NOT NULL,
	`href` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `kind`, `resource_id`)
);
--> statement-breakpoint
CREATE INDEX `bookmarks_user_created_idx` ON `bookmarks` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `server_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`server_slug` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `server_credentials_slug_idx` ON `server_credentials` (`server_slug`);--> statement-breakpoint
CREATE TABLE `server_heartbeats` (
	`server_slug` text PRIMARY KEY NOT NULL,
	`credential_id` text NOT NULL,
	`state` text NOT NULL,
	`players_online` integer NOT NULL,
	`players_max` integer NOT NULL,
	`game_version` text NOT NULL,
	`supported_versions` text NOT NULL,
	`software` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `server_pair_codes` (
	`server_slug` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`requested_by` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `server_pair_codes_hash_idx` ON `server_pair_codes` (`code_hash`);--> statement-breakpoint
CREATE TABLE `server_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`server_slug` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `server_updates_published_idx` ON `server_updates` (`published`,`created_at`);