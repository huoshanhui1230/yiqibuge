CREATE TABLE `app_user` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`openid` varchar(64) NOT NULL,
	`unionid` varchar(64),
	`nickname` varchar(32),
	`avatar_url` varchar(512),
	`timezone` varchar(64),
	`theme` enum('sticker','cute','clean') NOT NULL DEFAULT 'sticker',
	`quiet_start` char(5) NOT NULL DEFAULT '23:00',
	`quiet_end` char(5) NOT NULL DEFAULT '08:00',
	`motion_off` boolean NOT NULL DEFAULT false,
	`created_at` datetime(0) NOT NULL,
	`updated_at` datetime(0) NOT NULL,
	`deleted_at` datetime(0),
	CONSTRAINT `app_user_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_app_user_openid` UNIQUE(`openid`)
);
--> statement-breakpoint
CREATE TABLE `circle` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(24) NOT NULL,
	`avatar` varchar(512) NOT NULL,
	`type` enum('friends','family','colleagues','classmates','other') NOT NULL DEFAULT 'other',
	`owner_id` bigint unsigned NOT NULL,
	`timezone` varchar(64) NOT NULL,
	`invite_token` char(22),
	`invite_code` char(6),
	`invite_expire_at` datetime(0),
	`need_approval` boolean NOT NULL DEFAULT false,
	`invite_owner_only` boolean NOT NULL DEFAULT false,
	`pigeon_enabled` boolean NOT NULL DEFAULT true,
	`penalty_text` varchar(60),
	`status` enum('active','dissolved') NOT NULL DEFAULT 'active',
	`dissolved_at` datetime(0),
	`created_at` datetime(0) NOT NULL,
	`updated_at` datetime(0) NOT NULL,
	CONSTRAINT `circle_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_circle_invite_token` UNIQUE(`invite_token`),
	CONSTRAINT `uk_circle_invite_code` UNIQUE(`invite_code`)
);
--> statement-breakpoint
CREATE TABLE `circle_join_request` (
	`circle_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`requested_at` datetime(0) NOT NULL,
	`decided_at` datetime(0),
	`decided_by` bigint unsigned,
	CONSTRAINT `pk_circle_join_request` PRIMARY KEY(`circle_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `circle_member` (
	`circle_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`group_nickname` varchar(24),
	`status` enum('active','left','removed') NOT NULL DEFAULT 'active',
	`joined_at` datetime(0) NOT NULL,
	`left_at` datetime(0),
	`exempt_month` char(7),
	`exempt_used` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `pk_circle_member` PRIMARY KEY(`circle_id`,`user_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_app_user_unionid` ON `app_user` (`unionid`);--> statement-breakpoint
CREATE INDEX `idx_circle_owner` ON `circle` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_circle_join_request_status` ON `circle_join_request` (`circle_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_circle_member_user` ON `circle_member` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_circle_member_circle` ON `circle_member` (`circle_id`,`status`);