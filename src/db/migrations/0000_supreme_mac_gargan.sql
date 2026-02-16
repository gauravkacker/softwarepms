CREATE TABLE `combinations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`description` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `combinations_name_unique` ON `combinations` (`name`);--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`common_potencies` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medicines_name_unique` ON `medicines` (`name`);