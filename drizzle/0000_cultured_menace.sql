CREATE TABLE `pre_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`registered_at` integer DEFAULT (unixepoch()) NOT NULL,
	`notification_sent` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pre_registrations_email_unique` ON `pre_registrations` (`email`);