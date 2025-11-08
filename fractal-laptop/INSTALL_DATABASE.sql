-- ===================================
-- FRACTAL LAPTOP-OS - DATABASE INSTALLATION
-- ===================================
-- Run this entire file in HeidiSQL to install all required tables
-- Version: 1.0.0
-- ===================================

-- ===================================
-- TABLE 1: LAPTOP DATA
-- ===================================
-- Stores each player's laptop settings, installed apps, and VPN status

CREATE TABLE IF NOT EXISTS laptop_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizenid VARCHAR(50) NOT NULL UNIQUE COMMENT 'Player CitizenID',
    settings LONGTEXT NOT NULL DEFAULT '{}' COMMENT 'JSON encoded settings (wallpaper, theme, etc.)',
    installed_apps LONGTEXT NOT NULL DEFAULT '[]' COMMENT 'JSON encoded list of installed apps',
    vpn_enabled TINYINT(1) DEFAULT 0 COMMENT '1 = VPN active, 0 = VPN off',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores player laptop settings and data';

-- ===================================
-- TABLE 2: CRYPTO WALLETS
-- ===================================
-- Stores unique wallet address and balance for each player

CREATE TABLE IF NOT EXISTS `crypto_wallets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Player CitizenID',
    `wallet_address` VARCHAR(64) NOT NULL UNIQUE COMMENT 'Unique 64-char wallet address (0x...)',
    `wallet_balance` DECIMAL(15,4) DEFAULT 0.0000 COMMENT 'FBT balance in wallet',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX(`citizenid`),
    INDEX(`wallet_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Player crypto wallets with unique addresses';

-- ===================================
-- TABLE 3: CRYPTO TRANSACTIONS
-- ===================================
-- Records all crypto transactions between players

CREATE TABLE IF NOT EXISTS `crypto_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `from_wallet` VARCHAR(64) NOT NULL COMMENT 'Sender wallet address',
    `to_wallet` VARCHAR(64) NOT NULL COMMENT 'Recipient wallet address',
    `from_citizenid` VARCHAR(50) NOT NULL COMMENT 'Sender CitizenID',
    `to_citizenid` VARCHAR(50) NOT NULL COMMENT 'Recipient CitizenID',
    `amount` DECIMAL(15,4) NOT NULL COMMENT 'FBT amount transferred',
    `transaction_type` VARCHAR(50) NOT NULL COMMENT 'transfer, deposit_usb, withdraw_usb',
    `description` VARCHAR(255) COMMENT 'Optional transaction description',
    `status` VARCHAR(50) DEFAULT 'completed' COMMENT 'Transaction status',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`from_wallet`),
    INDEX(`to_wallet`),
    INDEX(`from_citizenid`),
    INDEX(`to_citizenid`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='All crypto transaction history';

-- ===================================
-- TABLE 4: CRYPTO WASH OPERATIONS
-- ===================================
-- Tracks money laundering operations (REQUIRES FRACTAL-CRYPTOMINER)

CREATE TABLE IF NOT EXISTS `crypto_wash_operations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL COMMENT 'Player CitizenID',
    `business_name` VARCHAR(100) COMMENT 'Business/Job name',
    `crypto_amount` DECIMAL(15,4) NOT NULL COMMENT 'Amount of crypto being washed',
    `supervisor_cut` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Supervisor cut percentage',
    `start_time` BIGINT NOT NULL COMMENT 'Unix timestamp when wash started',
    `end_time` BIGINT NOT NULL COMMENT 'Unix timestamp when wash completes',
    `duration_minutes` INT NOT NULL COMMENT 'How long the wash takes',
    `status` VARCHAR(50) DEFAULT 'in_progress' COMMENT 'in_progress, completed, cancelled',
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`citizenid`),
    INDEX(`status`),
    INDEX(`business_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Crypto money laundering operations';

-- ===================================
-- TABLE 5: UNLOCKED ONION SITES
-- ===================================
-- Stores .onion sites unlocked by players via Terminal keywords

CREATE TABLE IF NOT EXISTS `unlocked_onion_sites` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL COMMENT 'Player CitizenID',
    `site_id` INT NOT NULL COMMENT '.onion site ID from config',
    `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_unlock` (`citizenid`, `site_id`),
    INDEX(`citizenid`),
    INDEX(`site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Player unlocked .onion sites via Terminal';

-- ===================================
-- TABLE 6: SILK ROAD PURCHASES
-- ===================================
-- Tracks purchases from Silk Road marketplace

CREATE TABLE IF NOT EXISTS `silk_road_purchases` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL COMMENT 'Player CitizenID',
    `product_id` INT NOT NULL COMMENT 'Product ID from config',
    `product_name` VARCHAR(255) NOT NULL COMMENT 'Product name',
    `payment_type` VARCHAR(50) NOT NULL COMMENT 'black_money or crypto',
    `payment_amount` DECIMAL(15,4) NOT NULL COMMENT 'Amount paid',
    `item_reward` VARCHAR(100) NOT NULL COMMENT 'Item given',
    `item_amount` INT NOT NULL COMMENT 'Quantity given',
    `purchased_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`citizenid`),
    INDEX(`product_id`),
    INDEX(`purchased_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Silk Road marketplace purchase history';

-- ===================================
-- TABLE 7: BLACKHAT FORUM POSTS
-- ===================================
-- Stores forum posts for BlackHat Forums .onion site

CREATE TABLE IF NOT EXISTS `blackhat_forum_posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL COMMENT 'Post author CitizenID',
    `author_alias` VARCHAR(100) NOT NULL COMMENT 'Anonymous hacker alias',
    `title` VARCHAR(255) NOT NULL COMMENT 'Post title',
    `content` TEXT NOT NULL COMMENT 'Post content',
    `category` VARCHAR(50) DEFAULT 'general' COMMENT 'Post category',
    `upvotes` INT DEFAULT 0 COMMENT 'Upvote count',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`citizenid`),
    INDEX(`created_at`),
    INDEX(`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='BlackHat Forums posts';

-- ===================================
-- TABLE 8: BLACKHAT FORUM COMMENTS
-- ===================================
-- Stores comments on forum posts

CREATE TABLE IF NOT EXISTS `blackhat_forum_comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL COMMENT 'Parent post ID',
    `citizenid` VARCHAR(50) NOT NULL COMMENT 'Comment author CitizenID',
    `author_alias` VARCHAR(100) NOT NULL COMMENT 'Anonymous hacker alias',
    `content` TEXT NOT NULL COMMENT 'Comment content',
    `upvotes` INT DEFAULT 0 COMMENT 'Upvote count',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `blackhat_forum_posts`(`id`) ON DELETE CASCADE,
    INDEX(`post_id`),
    INDEX(`citizenid`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='BlackHat Forums comments';

-- ===================================
-- TABLE 9: BOSS MENU DATA (OPTIONAL)
-- ===================================
-- Stores society/business data for Boss Menu app

CREATE TABLE IF NOT EXISTS `boss_menu_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `society` VARCHAR(50) NOT NULL COMMENT 'Society/Business name',
    `type` VARCHAR(50) NOT NULL COMMENT 'deposit, withdraw, payment',
    `amount` DECIMAL(15,2) NOT NULL,
    `citizen_id` VARCHAR(50) COMMENT 'Who performed the transaction',
    `description` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`society`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Boss menu transaction history';

-- ===================================
-- INSTALLATION COMPLETE!
-- ===================================
-- Tables created successfully:
-- ✅ laptop_data (player laptop settings)
-- ✅ crypto_wallets (wallet addresses and balances)
-- ✅ crypto_transactions (transaction history)
-- ✅ crypto_wash_operations (money laundering - requires crypto miner)
-- ✅ unlocked_onion_sites (terminal unlocked .onion sites)
-- ✅ silk_road_purchases (marketplace purchase tracking)
-- ✅ blackhat_forum_posts (forum posts)
-- ✅ blackhat_forum_comments (forum comments)
-- ✅ boss_menu_transactions (boss menu data - optional)
--
-- Your Fractal Laptop-OS script is now ready to use!
-- ===================================

-- ===================================
-- IMPORTANT NOTES:
-- ===================================
-- 1. These tables auto-create on server start (this is backup)
-- 2. Safe to run multiple times (IF NOT EXISTS)
-- 3. crypto_wash_operations requires fractal-cryptominer script
-- 4. boss_menu_transactions is optional (only if using Boss Menu app)
-- ===================================

-- ===================================
-- CRYPTO MINER INTEGRATION:
-- ===================================
-- If you purchased Fractal Crypto Miner:
-- 1. Set Config.Integrations.cryptoMiner.enabled = true
-- 2. Add license key to config.lua
-- 3. Add convar to server.cfg: setr fractal_cryptominer_license "YOUR-KEY"
-- 4. Restart both scripts
-- 5. Crypto Wash and Mining Monitor apps will unlock!
-- ===================================

-- ===================================
-- TROUBLESHOOTING:
-- ===================================
-- If tables don't create automatically:
-- 1. Check oxmysql or mysql-async is installed
-- 2. Verify database connection in server.cfg
-- 3. Run this SQL file manually
-- 4. Restart laptop-os resource
-- 5. Check server console for errors
-- ===================================


