CREATE TABLE `history` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle` text NOT NULL,
	`name` text NOT NULL,
	`action` text NOT NULL,
	`balance` integer,
	`actor` text NOT NULL,
	`time` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`balance` integer,
	`actor` text,
	`updated` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`token` text
);
