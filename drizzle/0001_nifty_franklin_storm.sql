CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`igdb_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`summary` text,
	`cover_url` text,
	`first_release_date` integer,
	`rating` real,
	`platforms` text DEFAULT '[]' NOT NULL,
	`genres` text DEFAULT '[]' NOT NULL,
	`checksum` text,
	`igdb_updated_at` integer,
	`last_synced_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_igdb_id_unique` ON `games` (`igdb_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);--> statement-breakpoint
CREATE INDEX `games_name_idx` ON `games` (`name`);--> statement-breakpoint
CREATE INDEX `games_last_synced_at_idx` ON `games` (`last_synced_at`);