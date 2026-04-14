CREATE TABLE `friendships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requester_user_id` text NOT NULL,
	`addressee_user_id` text NOT NULL,
	`status` text DEFAULT 'accepted' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`requester_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`addressee_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friendships_requester_addressee_unique` ON `friendships` (`requester_user_id`,`addressee_user_id`);--> statement-breakpoint
CREATE INDEX `friendships_requester_idx` ON `friendships` (`requester_user_id`);--> statement-breakpoint
CREATE INDEX `friendships_addressee_idx` ON `friendships` (`addressee_user_id`);--> statement-breakpoint
CREATE INDEX `friendships_status_idx` ON `friendships` (`status`);--> statement-breakpoint
ALTER TABLE `games` ADD `time_to_beat_main_seconds` integer;--> statement-breakpoint
ALTER TABLE `games` ADD `time_to_beat_completionist_seconds` integer;--> statement-breakpoint
ALTER TABLE `games` ADD `similar_games` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `contains_spoilers` integer DEFAULT false NOT NULL;
