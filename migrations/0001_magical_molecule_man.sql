ALTER TABLE `history` ADD `stage` text;--> statement-breakpoint
ALTER TABLE `history` ADD `approximate` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `stage` text;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `approximate` integer DEFAULT 0 NOT NULL;