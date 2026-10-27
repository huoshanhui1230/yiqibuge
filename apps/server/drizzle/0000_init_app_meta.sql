CREATE TABLE `app_meta` (
	`k` varchar(64) NOT NULL,
	`v` varchar(255) NOT NULL,
	`updated_at` datetime(0) NOT NULL,
	CONSTRAINT `app_meta_k` PRIMARY KEY(`k`)
);
