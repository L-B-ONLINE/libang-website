CREATE TABLE `minecraft_link_attempts` (
	`state` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verifier` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `minecraft_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`uuid` text NOT NULL,
	`name` text NOT NULL,
	`skin_url` text,
	`skin_variant` text,
	`capes` text NOT NULL,
	`connected_at` integer NOT NULL
);
