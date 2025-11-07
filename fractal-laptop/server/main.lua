local QBCore = exports['qb-core']:GetCoreObject()
local ESX = nil

-- Framework Detection
if Config.Framework == 'esx' then
    ESX = exports['es_extended']:getSharedObject()
end

-- ====================================
-- INTEGRATION VALIDATION SYSTEM
-- ====================================

local IntegrationStatus = {
    cryptoMiner = {
        installed = false,
        validated = false,
        lastCheck = 0
    }
}

-- Validate Crypto Miner Integration
local function ValidateCryptoMinerIntegration()
    -- Cache validation for 30 seconds to avoid repeated checks
    if IntegrationStatus.cryptoMiner.lastCheck + 30 > os.time() then
        return IntegrationStatus.cryptoMiner.validated
    end
    
    IntegrationStatus.cryptoMiner.lastCheck = os.time()
    
    -- Check if integration is enabled in config
    if not Config.Integrations or not Config.Integrations.cryptoMiner or not Config.Integrations.cryptoMiner.enabled then
        IntegrationStatus.cryptoMiner.validated = false
        return false
    end
    
    -- Check 1: Is the resource installed and running?
    local resourceName = 'fractal-cryptominer'
    local resourceState = GetResourceState(resourceName)
    
    if resourceState ~= 'started' and resourceState ~= 'starting' then
        IntegrationStatus.cryptoMiner.installed = false
        IntegrationStatus.cryptoMiner.validated = false
        return false
    end
    
    IntegrationStatus.cryptoMiner.installed = true
    
    -- Check 2: Validate exports exist (proves it's the real script)
    local success, minerExport = pcall(function()
        return exports['fractal-cryptominer']:GetAllActiveMiners()
    end)
    
    if not success then
        IntegrationStatus.cryptoMiner.validated = false
        return false
    end
    
    -- All checks passed!
    IntegrationStatus.cryptoMiner.validated = true
    return true
end

-- Boss Menu Caching (Performance Optimization)
local BossMenuCache = {}
local CacheExpiry = {}

-- Helper function to clear cache
local function ClearBossMenuCache(jobName)
    if BossMenuCache[jobName] then
        BossMenuCache[jobName] = nil
        CacheExpiry[jobName] = nil
    end
end

-- Helper function to check cache validity
local function IsCacheValid(jobName, cacheTime)
    -- Always use caching if enabled (ignore cacheTime parameter, use config)
    if not Config.BossMenu.performance.cacheEmployees and not Config.BossMenu.performance.cacheTransactions then
        return false
    end
    
    if not CacheExpiry[jobName] then
        return false
    end
    
    -- Cache is valid for 60 seconds (increased from 30 for better performance)
    return os.time() < CacheExpiry[jobName]
end

-- Helper function to get framework-specific player data
local function GetFrameworkPlayer(src)
    if Config.Framework == 'qb-core' then
        return QBCore.Functions.GetPlayer(src)
    elseif Config.Framework == 'esx' then
        return ESX.GetPlayerFromId(src)
    end
    return nil
end

-- Get player by citizenid (for offline players)
local function GetFrameworkPlayerByCitizenid(citizenid)
    if Config.Framework == 'qb-core' then
        -- QBCore uses GetPlayerByCitizenId (capital I)
        return QBCore.Functions.GetPlayerByCitizenId(citizenid)
    elseif Config.Framework == 'esx' then
        return ESX.GetPlayerFromIdentifier(citizenid)
    end
    return nil
end

-- Helper function to check if player is boss
local function IsPlayerBoss(player)
    if Config.Framework == 'qb-core' then
        return player.PlayerData.job.isboss == true
    elseif Config.Framework == 'esx' then
        local job = player.job
        return job.grade_name == 'boss' or (job.grade and job.grade >= Config.BossMenu.permissions.minBossGrade)
    end
    return false
end

-- Helper function to get player job
local function GetPlayerJob(player)
    if Config.Framework == 'qb-core' then
        return player.PlayerData.job
    elseif Config.Framework == 'esx' then
        return player.job
    end
    return nil
end

-- Notify helper function (Framework-aware)
local function NotifyPlayer(sourceId, message, notifType)
    if Config.Framework == 'qb-core' then
        TriggerClientEvent('QBCore:Notify', sourceId, message, notifType)
    elseif Config.Framework == 'esx' then
        TriggerClientEvent('esx:showNotification', sourceId, message)
    end
end

-- ====================================
-- USEABLE ITEM REGISTRATION
-- ====================================

CreateThread(function()
    Wait(500) -- Wait for QBCore to load
    
    if QBCore and QBCore.Functions and QBCore.Functions.CreateUseableItem then
        QBCore.Functions.CreateUseableItem(Config.LaptopItem, function(source, item)
            TriggerClientEvent('fractal-laptop:client:useLaptop', source)
        end)
    end
    
    -- Validate integrations on startup
    Wait(2000) -- Wait for all resources to load
    
    if Config.Integrations.cryptoMiner.enabled then
        ValidateCryptoMinerIntegration()
    end
end)

-- ====================================
-- DATABASE FUNCTIONS
-- ====================================

-- Forward declaration for CanAccessCryptoWash
local function CanAccessCryptoWash(player)
    if not Config.CryptoWash or not Config.CryptoWash.enabled then
        return false
    end
    
    local job = GetPlayerJob(player)
    if not job then return false end
    
    local jobName = Config.Framework == 'qb-core' and job.name or job.name
    local jobGrade = Config.Framework == 'qb-core' and (job.grade.level or 0) or (job.grade or 0)
    
    -- Check if job is whitelisted
    local isWhitelisted = false
    for _, whitelistedJob in ipairs(Config.CryptoWash.whitelistedJobs) do
        if jobName == whitelistedJob then
            isWhitelisted = true
            break
        end
    end
    
    if not isWhitelisted then
        return false
    end
    
    -- Check minimum grade requirement
    return jobGrade >= Config.CryptoWash.minGrade
end

-- Check which USB items player has and return available apps
local function GetAvailableUSBApps(source)
    local availableApps = {}
    local Player = QBCore.Functions.GetPlayer(source)
    
    if not Player then
        return availableApps
    end
    
    -- Validate crypto miner integration
    local cryptoMinerValid = ValidateCryptoMinerIntegration()
    
    -- Check for each USB type
    for usbItem, usbData in pairs(Config.USB.items) do
        if exports['lj-inventory']:HasItem(source, usbItem, 1) then
            -- Player has this USB, check each app
            for _, appId in ipairs(usbData.apps) do
                local shouldAdd = false
                
                -- Apps that require Crypto Miner Integration
                if appId == 'crypto_wash' or appId == 'mining_monitor' then
                    if cryptoMinerValid then
                        -- Special check for crypto_wash - also requires job permissions
                        if appId == 'crypto_wash' then
                            if CanAccessCryptoWash(Player) then
                                shouldAdd = true
                            end
                        else
                            shouldAdd = true
                        end
                    else
                        -- Crypto miner not validated, skip these apps
                        print('^3[Laptop-OS]^7 App "' .. appId .. '" requires Crypto Miner integration (disabled)')
                    end
                else
                    -- Other apps don't need crypto miner
                    shouldAdd = true
                end
                
                if shouldAdd then
                    table.insert(availableApps, appId)
                end
            end
        end
    end
    
    return availableApps
end

-- Get player's laptop data
local function GetLaptopData(citizenid)
    local result = MySQL.Sync.fetchAll('SELECT * FROM laptop_data WHERE citizenid = ?', {citizenid})
    
    if result[1] then
        return {
            settings = json.decode(result[1].settings),
            installedApps = json.decode(result[1].installed_apps),
            vpnEnabled = false -- Will be set based on inventory, not database
        }
    else
        -- Create default laptop data
        local defaultData = {
            settings = {
                wallpaper = 1,
                theme = 'light',
                username = 'User'
            },
            installedApps = {},
            vpnEnabled = false -- Will be set based on inventory, not database
        }
        
        -- Note: We don't store vpn_enabled in database anymore - it's inventory-based
        MySQL.Sync.execute('INSERT INTO laptop_data (citizenid, settings, installed_apps) VALUES (?, ?, ?)', {
            citizenid,
            json.encode(defaultData.settings),
            json.encode(defaultData.installedApps)
        })
        
        return defaultData
    end
end

-- Save laptop settings
local function SaveLaptopSettings(citizenid, newSettings)
    -- Get current settings first
    local currentData = GetLaptopData(citizenid)
    
    -- Merge new settings with existing settings
    local mergedSettings = currentData.settings or {}
    for key, value in pairs(newSettings) do
        mergedSettings[key] = value
    end
    
    -- Save merged settings (use Sync to wait for completion)
    MySQL.Sync.execute('UPDATE laptop_data SET settings = ? WHERE citizenid = ?', {
        json.encode(mergedSettings),
        citizenid
    })
end

-- Save installed apps
local function SaveInstalledApps(citizenid, apps)
    -- Use Sync to wait for completion
    MySQL.Sync.execute('UPDATE laptop_data SET installed_apps = ? WHERE citizenid = ?', {
        json.encode(apps),
        citizenid
    })
end

-- Check if player has VPN access (based on inventory item)
local function HasVPNAccess(source)
    if not Config.VPN.enabled or not Config.VPN.autoDetect then
        return false
    end
    
    local hasVPN = exports['lj-inventory']:HasItem(source, Config.VPN.itemName, 1)
    return hasVPN
end

-- ====================================
-- CALLBACKS
-- ====================================

-- Get laptop data
QBCore.Functions.CreateCallback('fractal-laptop:server:getLaptopData', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then 
        cb(nil)
        return 
    end
    
    local laptopData = GetLaptopData(Player.PlayerData.citizenid)
    
    -- Check VPN access based on inventory (not database)
    laptopData.vpnEnabled = HasVPNAccess(source)
    
    -- Check which USB apps are available based on inventory
    laptopData.availableUSBApps = GetAvailableUSBApps(source)
    
    -- Add Terminal help text
    laptopData.terminalHelp = Config.TerminalHelp
    
    cb(laptopData)
end)

-- Get USB items in inventory
QBCore.Functions.CreateCallback('fractal-laptop:server:getUSBItems', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then 
        cb({})
        return 
    end
    
    local usbItems = {}
    
    for usbItem, usbData in pairs(Config.USB.items) do
        -- Check if player has USB item using lj-inventory
        local hasItem = exports['lj-inventory']:HasItem(source, usbItem, 1)
        
        if hasItem then
            table.insert(usbItems, {
                item = usbItem,
                label = usbData.label,
                apps = usbData.apps
            })
        end
    end
    
    cb(usbItems)
end)

-- Install app from USB
QBCore.Functions.CreateCallback('fractal-laptop:server:installAppFromUSB', function(source, cb, usbItem)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then 
        cb(false, {})
        return 
    end
    
    -- Check if player has the USB item using lj-inventory
    local hasUSB = exports['lj-inventory']:HasItem(source, usbItem, 1)
    
    if not hasUSB then
        cb(false, {})
        return
    end
    
    -- Get USB data
    local usbData = Config.USB.items[usbItem]
    if not usbData then
        cb(false, {})
        return
    end
    
    -- Get current installed apps
    local laptopData = GetLaptopData(Player.PlayerData.citizenid)
    local installedApps = laptopData.installedApps or {}
    
    -- Add new apps from USB
    for _, appId in pairs(usbData.apps) do
        if not table.contains(installedApps, appId) then
            table.insert(installedApps, appId)
        end
    end
    
    -- Save updated apps
    SaveInstalledApps(Player.PlayerData.citizenid, installedApps)
    
    -- Send notification
    TriggerClientEvent('QBCore:Notify', source, 'Apps installed from ' .. usbData.label, 'success')
    
    cb(true, installedApps)
end)

-- ====================================
-- EVENTS
-- ====================================

-- Save settings
RegisterNetEvent('fractal-laptop:server:saveSettings', function(settings)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    SaveLaptopSettings(Player.PlayerData.citizenid, settings)
    
    -- Update client
    local laptopData = GetLaptopData(Player.PlayerData.citizenid)
    TriggerClientEvent('fractal-laptop:client:updateLaptopData', src, laptopData)
end)

-- Refresh VPN status (called when inventory changes)
RegisterNetEvent('fractal-laptop:server:refreshVPN', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Get updated laptop data with current VPN status from inventory
    local laptopData = GetLaptopData(Player.PlayerData.citizenid)
    laptopData.vpnEnabled = HasVPNAccess(src)
    
    -- Update client
    TriggerClientEvent('fractal-laptop:client:updateLaptopData', src, laptopData)
end)

-- ====================================
-- TERMINAL & .ONION SYSTEM
-- ====================================

-- Execute Terminal Command
QBCore.Functions.CreateCallback('fractal-laptop:server:executeTerminalCommand', function(source, cb, command, progress)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({success = false, error = 'Player not found'})
        return
    end
    
    -- Special puzzle: TOR Browser access (multi-step)
    -- Step 1: scan --network
    if command == 'scan --network' then
        local torProgress = progress['tor_access'] or 0
        if torProgress == 0 then
            cb({
                success = true,
                output = '> Scanning network interfaces...\n> Found 3 active connections\n> Found 1 encrypted relay node\n> Node IP: 192.168.13.37\n\n[!] Use "connect 192.168.13.37" to establish connection',
                siteId = 'tor_access',
                commandIndex = 1,
                keywordRevealed = false
            })
            return
        end
    end
    
    -- Step 2: connect 192.168.13.37
    if command == 'connect 192.168.13.37' then
        local torProgress = progress['tor_access'] or 0
        if torProgress == 1 then
            cb({
                success = true,
                output = '> Establishing connection to relay node...\n> Handshake initiated... OK\n> Connection established\n> Relay node requires authentication\n\n[!] Use "auth --bypass" to bypass authentication',
                siteId = 'tor_access',
                commandIndex = 2,
                keywordRevealed = false
            })
            return
        end
    end
    
    -- Step 3: auth --bypass
    if command == 'auth --bypass' then
        local torProgress = progress['tor_access'] or 0
        if torProgress == 2 then
            cb({
                success = true,
                output = '> Running authentication bypass...\n> Exploiting CVE-2024-0x1337...\n> Access granted!\n> Downloading TOR Browser launcher...\n> Installation complete\n\n[SUCCESS] TOR Browser is now accessible!\n[!] Type "launch --tor" to open TOR Browser',
                siteId = 'tor_access',
                commandIndex = 3,
                keywordRevealed = false
            })
            return
        end
    end
    
    -- Step 4: launch --tor (opens TOR Browser)
    if command == 'launch --tor' then
        local torProgress = progress['tor_access'] or 0
        if torProgress >= 3 then
            cb({
                success = true,
                output = '> Launching TOR Browser...\n> Initializing onion routing...\n> Connecting through encrypted relays...\n> Connection secured!\n\n[TOR BROWSER LAUNCHED]',
                openTorBrowser = true
            })
            return
        else
            cb({
                success = true,
                output = '> ERROR: TOR Browser not installed\n> Run network scan to begin setup process'
            })
            return
        end
    end
    
    -- Check each .onion site's command chains
    for _, site in pairs(Config.OnionSites) do
        for cmdIndex, cmdData in pairs(site.terminalCommands) do
            if cmdData.command == command then
                -- Check if player is at the right step in the chain
                local currentProgress = progress[tostring(site.id)] or 0
                
                if cmdIndex == currentProgress + 1 then
                    -- Correct command in sequence
                    cb({
                        success = true,
                        output = cmdData.response,
                        siteId = site.id,
                        commandIndex = cmdIndex,
                        keywordRevealed = cmdData.revealsKeyword or false
                    })
                    return
                end
            end
        end
    end
    
    -- Command not found
    cb({success = false})
end)

-- Get Unlocked .onion Sites
QBCore.Functions.CreateCallback('fractal-laptop:server:getUnlockedOnionSites', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({})
        return
    end
    
    -- Get unlocked site IDs from database
    local unlockedSites = MySQL.Sync.fetchAll('SELECT site_id FROM unlocked_onion_sites WHERE citizenid = ?', {Player.PlayerData.citizenid})
    
    -- Build list of unlocked sites with full data
    local sites = {}
    for _, record in pairs(unlockedSites) do
        for _, site in pairs(Config.OnionSites) do
            if site.id == record.site_id then
                table.insert(sites, {
                    id = site.id,
                    name = site.name,
                    url = site.url,
                    description = site.description,
                    icon = site.icon,
                    color = site.color,
                    category = site.category
                })
                break
            end
        end
    end
    
    cb(sites)
end)

-- Unlock .onion Site with Keyword
QBCore.Functions.CreateCallback('fractal-laptop:server:unlockOnionSite', function(source, cb, keyword)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({success = false, error = 'Player not found'})
        return
    end
    
    -- Find site with matching keyword
    local foundSite = nil
    for _, site in pairs(Config.OnionSites) do
        if site.keyword == keyword then
            foundSite = site
            break
        end
    end
    
    if not foundSite then
        cb({success = false, error = 'Invalid keyword'})
        return
    end
    
    -- Check if already unlocked
    local existing = MySQL.Sync.fetchAll('SELECT id FROM unlocked_onion_sites WHERE citizenid = ? AND site_id = ?', {
        Player.PlayerData.citizenid,
        foundSite.id
    })
    
    if existing and #existing > 0 then
        cb({success = false, error = 'Site already unlocked'})
        return
    end
    
    -- Unlock site
    MySQL.Async.insert('INSERT INTO unlocked_onion_sites (citizenid, site_id) VALUES (?, ?)', {
        Player.PlayerData.citizenid,
        foundSite.id
    }, function(insertId)
        if insertId then
            cb({
                success = true,
                siteName = foundSite.name,
                siteId = foundSite.id
            })
        else
            cb({success = false, error = 'Failed to unlock site'})
        end
    end)
end)

-- Visit .onion Site (logging)
RegisterNetEvent('fractal-laptop:server:visitOnionSite', function(siteId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Log visit (for analytics)
    if Config.Debug then
        local siteName = 'Unknown'
        for _, site in pairs(Config.OnionSites) do
            if site.id == siteId then
                siteName = site.name
                break
            end
        end
        print(string.format('[TOR Browser] Player %s visited .onion site: %s', Player.PlayerData.citizenid, siteName))
    end
end)

-- ====================================
-- SILK ROAD MARKETPLACE SYSTEM
-- ====================================

-- Get Silk Road Marketplace Data
QBCore.Functions.CreateCallback('fractal-laptop:server:getSilkRoadData', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({success = false, error = 'Player not found'})
        return
    end
    
    -- Get player balances
    local blackMoneyBalance = 0
    local cryptoBalance = 0
    
    if Config.SilkRoad.payment.blackMoney.enabled then
        local blackMoneyItem = Player.Functions.GetItemByName(Config.SilkRoad.payment.blackMoney.itemName)
        blackMoneyBalance = blackMoneyItem and blackMoneyItem.amount or 0
    end
    
    if Config.SilkRoad.payment.crypto.enabled then
        -- Check if player has crypto USB ledger
        local hasUSB = Player.Functions.GetItemByName(Config.SilkRoad.payment.crypto.usbItemName)
        if hasUSB then
            -- Get crypto balance from wallet
            local wallet = MySQL.Sync.fetchAll('SELECT wallet_balance FROM crypto_wallets WHERE citizenid = ?', {Player.PlayerData.citizenid})
            if wallet and wallet[1] then
                cryptoBalance = wallet[1].wallet_balance or 0
            end
        end
    end
    
    -- Get current stock for products
    local productsWithStock = {}
    for _, product in pairs(Config.SilkRoad.products) do
        local currentStock = product.stockLimit
        
        if product.stockLimit > 0 then
            -- Get purchase count from database
            local purchases = MySQL.Sync.fetchAll('SELECT COUNT(*) as count FROM silk_road_purchases WHERE product_id = ?', {product.id})
            local purchaseCount = purchases and purchases[1] and purchases[1].count or 0
            currentStock = math.max(0, product.stockLimit - purchaseCount)
        end
        
        table.insert(productsWithStock, {
            id = product.id,
            name = product.name,
            description = product.description,
            category = product.category,
            price = product.price,
            cryptoPrice = product.cryptoPrice,
            image = product.image,
            stockLimit = product.stockLimit,
            currentStock = currentStock,
            itemReward = product.itemReward,
            itemAmount = product.itemAmount
        })
    end
    
    cb({
        success = true,
        data = {
            products = productsWithStock,
            categories = Config.SilkRoad.categories,
            paymentMethods = {
                blackMoney = Config.SilkRoad.payment.blackMoney.enabled,
                crypto = Config.SilkRoad.payment.crypto.enabled
            },
            playerBalance = {
                blackMoney = blackMoneyBalance,
                crypto = cryptoBalance
            }
        }
    })
end)

-- Purchase Silk Road Product
QBCore.Functions.CreateCallback('fractal-laptop:server:purchaseSilkRoadProduct', function(source, cb, productId, paymentMethod)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({success = false, error = 'Player not found'})
        return
    end
    
    -- Find product
    local product = nil
    for _, p in pairs(Config.SilkRoad.products) do
        if p.id == productId then
            product = p
            break
        end
    end
    
    if not product then
        cb({success = false, error = 'Product not found'})
        return
    end
    
    -- Check stock
    if product.stockLimit > 0 then
        local purchases = MySQL.Sync.fetchAll('SELECT COUNT(*) as count FROM silk_road_purchases WHERE product_id = ?', {productId})
        local purchaseCount = purchases and purchases[1] and purchases[1].count or 0
        local currentStock = math.max(0, product.stockLimit - purchaseCount)
        
        if currentStock <= 0 then
            cb({success = false, error = 'Product is out of stock'})
            return
        end
    end
    
    -- Process payment
    local paymentSuccess = false
    local paymentType = ''
    local paymentAmount = 0
    
    if paymentMethod == 'blackmoney' and Config.SilkRoad.payment.blackMoney.enabled then
        -- Black money payment
        local blackMoneyItem = Player.Functions.GetItemByName(Config.SilkRoad.payment.blackMoney.itemName)
        if blackMoneyItem and blackMoneyItem.amount >= product.price then
            Player.Functions.RemoveItem(Config.SilkRoad.payment.blackMoney.itemName, product.price)
            paymentSuccess = true
            paymentType = 'black_money'
            paymentAmount = product.price
        else
            cb({success = false, error = 'Insufficient black money'})
            return
        end
    elseif paymentMethod == 'crypto' and Config.SilkRoad.payment.crypto.enabled then
        -- Crypto payment
        local hasUSB = Player.Functions.GetItemByName(Config.SilkRoad.payment.crypto.usbItemName)
        if not hasUSB then
            cb({success = false, error = 'Crypto USB Ledger required for FBT payments'})
            return
        end
        
        local wallet = MySQL.Sync.fetchAll('SELECT wallet_balance FROM crypto_wallets WHERE citizenid = ?', {Player.PlayerData.citizenid})
        if wallet and wallet[1] and wallet[1].wallet_balance >= product.cryptoPrice then
            -- Deduct crypto
            MySQL.Async.execute('UPDATE crypto_wallets SET wallet_balance = wallet_balance - ? WHERE citizenid = ?', {
                product.cryptoPrice,
                Player.PlayerData.citizenid
            })
            paymentSuccess = true
            paymentType = 'crypto'
            paymentAmount = product.cryptoPrice
        else
            cb({success = false, error = 'Insufficient FBT crypto'})
            return
        end
    else
        cb({success = false, error = 'Invalid payment method'})
        return
    end
    
    -- Give item reward
    if paymentSuccess then
        Player.Functions.AddItem(product.itemReward, product.itemAmount)
        TriggerClientEvent('inventory:client:ItemBox', source, QBCore.Shared.Items[product.itemReward], 'add', product.itemAmount)
        
        -- Record purchase
        MySQL.Async.insert('INSERT INTO silk_road_purchases (citizenid, product_id, product_name, payment_type, payment_amount, item_reward, item_amount) VALUES (?, ?, ?, ?, ?, ?, ?)', {
            Player.PlayerData.citizenid,
            productId,
            product.name,
            paymentType,
            paymentAmount,
            product.itemReward,
            product.itemAmount
        })
        
        cb({
            success = true,
            message = string.format('Purchase complete! %dx %s delivered to inventory', product.itemAmount, product.name)
        })
    else
        cb({success = false, error = 'Payment failed'})
    end
end)

-- ====================================
-- BLACKHAT FORUMS SYSTEM
-- ====================================

-- Generate random hacker alias
local function generateHackerAlias()
    local prefixes = {'Dark', 'Cyber', 'Shadow', 'Ghost', 'Phantom', 'Zero', 'Null', 'Void', 'Binary', 'Hex', 'Crypto', 'Neo', 'Agent', 'Matrix'}
    local suffixes = {'Hacker', 'Runner', 'Breaker', 'Coder', 'Hunter', 'Wolf', 'Raven', 'Phoenix', 'Viper', 'Reaper', '404', 'Root', 'Admin', 'Exploit'}
    local numbers = math.random(1, 9999)
    
    local prefix = prefixes[math.random(#prefixes)]
    local suffix = suffixes[math.random(#suffixes)]
    
    return prefix .. suffix .. numbers
end

-- Get all forum posts
QBCore.Functions.CreateCallback('fractal-laptop:server:getForumPosts', function(source, cb)
    MySQL.Async.fetchAll([[
        SELECT 
            p.*,
            (SELECT COUNT(*) FROM blackhat_forum_comments WHERE post_id = p.id) as comment_count
        FROM blackhat_forum_posts p
        ORDER BY p.created_at DESC
    ]], {}, function(posts)
        cb({success = true, posts = posts or {}})
    end)
end)

-- Get single forum post with comments
QBCore.Functions.CreateCallback('fractal-laptop:server:getForumPost', function(source, cb, postId)
    -- Get post
    MySQL.Async.fetchAll('SELECT * FROM blackhat_forum_posts WHERE id = ?', {postId}, function(postResult)
        if not postResult or #postResult == 0 then
            cb({success = false, error = 'Post not found'})
            return
        end
        
        local post = postResult[1]
        
        -- Get comments for this post
        MySQL.Async.fetchAll('SELECT * FROM blackhat_forum_comments WHERE post_id = ? ORDER BY created_at ASC', {postId}, function(comments)
            cb({
                success = true,
                post = post,
                comments = comments or {}
            })
        end)
    end)
end)

-- Create new forum post
QBCore.Functions.CreateCallback('fractal-laptop:server:createForumPost', function(source, cb, category, title, content)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({success = false, error = 'Player not found'})
        return
    end
    
    -- Validate input
    if not title or title == '' or not content or content == '' then
        cb({success = false, error = 'Title and content are required'})
        return
    end
    
    if #title > 255 then
        cb({success = false, error = 'Title is too long'})
        return
    end
    
    -- Generate random hacker alias
    local alias = generateHackerAlias()
    
    -- Insert post
    MySQL.Async.insert([[
        INSERT INTO blackhat_forum_posts (citizenid, author_alias, title, content, category, upvotes)
        VALUES (?, ?, ?, ?, ?, 0)
    ]], {
        Player.PlayerData.citizenid,
        alias,
        title,
        content,
        category or 'general'
    }, function(postId)
        if postId then
            cb({success = true, postId = postId, alias = alias})
        else
            cb({success = false, error = 'Failed to create post'})
        end
    end)
end)

-- Add comment to post
QBCore.Functions.CreateCallback('fractal-laptop:server:addForumComment', function(source, cb, postId, content)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then
        cb({success = false, error = 'Player not found'})
        return
    end
    
    -- Validate input
    if not content or content == '' then
        cb({success = false, error = 'Comment cannot be empty'})
        return
    end
    
    -- Check if post exists
    MySQL.Async.fetchAll('SELECT id FROM blackhat_forum_posts WHERE id = ?', {postId}, function(result)
        if not result or #result == 0 then
            cb({success = false, error = 'Post not found'})
            return
        end
        
        -- Generate random hacker alias
        local alias = generateHackerAlias()
        
        -- Insert comment
        MySQL.Async.insert([[
            INSERT INTO blackhat_forum_comments (post_id, citizenid, author_alias, content, upvotes)
            VALUES (?, ?, ?, ?, 0)
        ]], {
            postId,
            Player.PlayerData.citizenid,
            alias,
            content
        }, function(commentId)
            if commentId then
                cb({success = true, commentId = commentId, alias = alias})
            else
                cb({success = false, error = 'Failed to add comment'})
            end
        end)
    end)
end)

-- ====================================
-- NOTES APP
-- ====================================

-- Get all notes for a player
QBCore.Functions.CreateCallback('fractal-laptop:server:getNotes', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then 
        cb({})
        return 
    end
    
    local notes = MySQL.Sync.fetchAll('SELECT * FROM laptop_notes WHERE citizenid = ? ORDER BY updated_at DESC', {
        Player.PlayerData.citizenid
    })
    
    cb(notes or {})
end)

-- Create a new note
RegisterNetEvent('fractal-laptop:server:createNote', function(title, content)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    MySQL.Sync.execute('INSERT INTO laptop_notes (citizenid, title, content) VALUES (?, ?, ?)', {
        Player.PlayerData.citizenid,
        title,
        content
    })
    
    TriggerClientEvent('QBCore:Notify', src, 'Note created successfully', 'success')
    
    -- Send updated notes list to client
    local notes = MySQL.Sync.fetchAll('SELECT * FROM laptop_notes WHERE citizenid = ? ORDER BY updated_at DESC', {
        Player.PlayerData.citizenid
    })
    TriggerClientEvent('fractal-laptop:client:updateNotes', src, notes)
end)

-- Update an existing note
RegisterNetEvent('fractal-laptop:server:updateNote', function(noteId, title, content)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Verify the note belongs to this player
    local note = MySQL.Sync.fetchAll('SELECT * FROM laptop_notes WHERE id = ? AND citizenid = ?', {
        noteId,
        Player.PlayerData.citizenid
    })
    
    if not note[1] then
        TriggerClientEvent('QBCore:Notify', src, 'Note not found or access denied', 'error')
        return
    end
    
    MySQL.Sync.execute('UPDATE laptop_notes SET title = ?, content = ? WHERE id = ? AND citizenid = ?', {
        title,
        content,
        noteId,
        Player.PlayerData.citizenid
    })
    
    TriggerClientEvent('QBCore:Notify', src, 'Note updated successfully', 'success')
    
    -- Send updated notes list to client
    local notes = MySQL.Sync.fetchAll('SELECT * FROM laptop_notes WHERE citizenid = ? ORDER BY updated_at DESC', {
        Player.PlayerData.citizenid
    })
    TriggerClientEvent('fractal-laptop:client:updateNotes', src, notes)
end)

-- Delete a note
RegisterNetEvent('fractal-laptop:server:deleteNote', function(noteId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Verify the note belongs to this player
    local note = MySQL.Sync.fetchAll('SELECT * FROM laptop_notes WHERE id = ? AND citizenid = ?', {
        noteId,
        Player.PlayerData.citizenid
    })
    
    if not note[1] then
        TriggerClientEvent('QBCore:Notify', src, 'Note not found or access denied', 'error')
        return
    end
    
    MySQL.Sync.execute('DELETE FROM laptop_notes WHERE id = ? AND citizenid = ?', {
        noteId,
        Player.PlayerData.citizenid
    })
    
    TriggerClientEvent('QBCore:Notify', src, 'Note deleted successfully', 'success')
    
    -- Send updated notes list to client
    local notes = MySQL.Sync.fetchAll('SELECT * FROM laptop_notes WHERE citizenid = ? ORDER BY updated_at DESC', {
        Player.PlayerData.citizenid
    })
    TriggerClientEvent('fractal-laptop:client:updateNotes', src, notes)
end)

-- ====================================
-- CRYPTO WALLET SYSTEM
-- ====================================

-- Generate unique wallet address (SHA256-like hash)
local function GenerateWalletAddress(citizenid)
    local chars = '0123456789abcdef'
    local hash = '0x'
    
    -- Convert citizenid to a number seed (handle alphanumeric)
    local seed = os.time()
    for i = 1, #citizenid do
        seed = seed + string.byte(citizenid:sub(i,i)) * i
    end
    
    math.randomseed(seed)
    
    for i = 1, 62 do
        local index = math.random(1, #chars)
        hash = hash .. chars:sub(index, index)
    end
    
    return hash
end

-- Get or create wallet for player
local function GetOrCreateWallet(citizenid)
    print('[Crypto Wallet] Getting wallet for citizenid:', citizenid)
    local wallet = MySQL.Sync.fetchAll('SELECT * FROM crypto_wallets WHERE citizenid = ?', {citizenid})
    
    if wallet[1] then
        print('[Crypto Wallet] Found existing wallet:', wallet[1].wallet_address)
        return wallet[1]
    else
        -- Create new wallet with unique address
        print('[Crypto Wallet] No wallet found, creating new one...')
        local walletAddress = GenerateWalletAddress(citizenid)
        print('[Crypto Wallet] Generated address:', walletAddress)
        
        MySQL.Sync.execute('INSERT INTO crypto_wallets (citizenid, wallet_address, wallet_balance) VALUES (?, ?, ?)', {
            citizenid,
            walletAddress,
            0.0000
        })
        
        -- Fetch the newly created wallet
        wallet = MySQL.Sync.fetchAll('SELECT * FROM crypto_wallets WHERE citizenid = ?', {citizenid})
        print('[Crypto Wallet] Created wallet successfully:', wallet[1] and wallet[1].wallet_address or 'ERROR')
        return wallet[1]
    end
end

-- Get total crypto balance (wallet + all miners)
local function GetTotalBalance(citizenid)
    local wallet = GetOrCreateWallet(citizenid)
    local walletBalance = tonumber(wallet.wallet_balance) or 0
    
    -- Get balance from all miners (if crypto-miner script exists)
    local minersBalance = 0
    local success, miners = pcall(function()
        return MySQL.Sync.fetchAll('SELECT SUM(crypto_balance) as total FROM crypto_miners WHERE citizenid = ?', {citizenid})
    end)
    
    if success and miners and miners[1] then
        minersBalance = tonumber(miners[1].total) or 0
    end
    
    return {
        wallet = walletBalance,
        miners = minersBalance,
        total = walletBalance + minersBalance
    }
end

-- Get USB crypto balance (only if crypto miner integration is valid)
local function GetUSBCryptoBalance(source)
    -- Check if USB integration is enabled
    if not ValidateCryptoMinerIntegration() or not Config.Integrations.cryptoMiner.features.usbIntegration then
        return 0, nil
    end
    
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return 0, nil end
    
    -- Check if player has USB drive with crypto
    local hasUSB = exports['lj-inventory']:HasItem(source, 'usb_drive', 1)
    if not hasUSB then
        return 0, nil
    end
    
    -- Get USB item data
    for slot, item in pairs(Player.PlayerData.items) do
        if item and item.name == 'usb_drive' and item.info then
            local cryptoAmount = tonumber(item.info.crypto) or 0
            return cryptoAmount, slot
        end
    end
    
    return 0, nil
end

-- Get wallet info
QBCore.Functions.CreateCallback('fractal-laptop:server:getWalletInfo', function(source, cb)
    print('[Crypto Wallet] getWalletInfo callback triggered for source:', source)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then 
        print('[Crypto Wallet] ERROR: No player found for source:', source)
        cb(nil)
        return 
    end
    
    print('[Crypto Wallet] Player found, citizenid:', Player.PlayerData.citizenid)
    local wallet = GetOrCreateWallet(Player.PlayerData.citizenid)
    local balance = GetTotalBalance(Player.PlayerData.citizenid)
    
    -- Get USB crypto balance
    local usbCrypto, usbSlot = GetUSBCryptoBalance(source)
    
    local walletInfo = {
        address = wallet.wallet_address,
        balance = balance,
        usbBalance = usbCrypto,
        hasUSB = usbCrypto > 0 or usbSlot ~= nil,
        created = wallet.created_at
    }
    
    print('[Crypto Wallet] Sending wallet info back:')
    print('  - Address:', walletInfo.address)
    print('  - Balance:', json.encode(walletInfo.balance))
    print('  - USB Balance:', usbCrypto)
    
    cb(walletInfo)
end)

-- Find wallet by address
QBCore.Functions.CreateCallback('fractal-laptop:server:findWalletByAddress', function(source, cb, walletAddress)
    local wallet = MySQL.Sync.fetchAll('SELECT * FROM crypto_wallets WHERE wallet_address = ?', {walletAddress})
    
    if wallet[1] then
        cb({
            found = true,
            citizenid = wallet[1].citizenid,
            address = wallet[1].wallet_address
        })
    else
        cb({found = false})
    end
end)

-- Send crypto to another wallet
RegisterNetEvent('fractal-laptop:server:sendCrypto', function(toAddress, amount, description)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    amount = tonumber(amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid amount', 'error')
        return
    end
    
    -- Get sender wallet
    local senderWallet = GetOrCreateWallet(Player.PlayerData.citizenid)
    local senderBalance = GetTotalBalance(Player.PlayerData.citizenid)
    
    -- Check if sender has enough balance (from wallet only, not miners)
    if senderBalance.wallet < amount then
        TriggerClientEvent('QBCore:Notify', src, 'Insufficient wallet balance. Withdraw from miners first!', 'error')
        return
    end
    
    -- Find recipient wallet
    local recipientWallet = MySQL.Sync.fetchAll('SELECT * FROM crypto_wallets WHERE wallet_address = ?', {toAddress})
    
    if not recipientWallet[1] then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid wallet address', 'error')
        return
    end
    
    -- Can't send to yourself
    if recipientWallet[1].citizenid == Player.PlayerData.citizenid then
        TriggerClientEvent('QBCore:Notify', src, 'Cannot send crypto to yourself', 'error')
        return
    end
    
    -- Deduct from sender
    MySQL.Sync.execute('UPDATE crypto_wallets SET wallet_balance = wallet_balance - ? WHERE citizenid = ?', {
        amount,
        Player.PlayerData.citizenid
    })
    
    -- Add to recipient
    MySQL.Sync.execute('UPDATE crypto_wallets SET wallet_balance = wallet_balance + ? WHERE citizenid = ?', {
        amount,
        recipientWallet[1].citizenid
    })
    
    -- Record transaction
    MySQL.Sync.execute([[
        INSERT INTO crypto_transactions 
        (from_wallet, to_wallet, from_citizenid, to_citizenid, amount, transaction_type, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        senderWallet.wallet_address,
        toAddress,
        Player.PlayerData.citizenid,
        recipientWallet[1].citizenid,
        amount,
        'transfer',
        description or 'Crypto transfer',
        'completed'
    })
    
    -- Notify both parties
    TriggerClientEvent('QBCore:Notify', src, string.format('Sent %.4f crypto to %s', amount, toAddress:sub(1, 10) .. '...'), 'success')
    
    -- Find recipient if online
    local RecipientPlayer = QBCore.Functions.GetPlayerByCitizenId(recipientWallet[1].citizenid)
    if RecipientPlayer then
        TriggerClientEvent('QBCore:Notify', RecipientPlayer.PlayerData.source, string.format('Received %.4f crypto!', amount), 'success')
        TriggerClientEvent('fractal-laptop:client:refreshWallet', RecipientPlayer.PlayerData.source)
    end
    
    -- Refresh sender's wallet
    TriggerClientEvent('fractal-laptop:client:refreshWallet', src)
end)

-- Deposit crypto from USB to wallet
RegisterNetEvent('fractal-laptop:server:depositFromUSB', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Validate crypto miner integration
    if not ValidateCryptoMinerIntegration() or not Config.Integrations.cryptoMiner.features.usbIntegration then
        TriggerClientEvent('QBCore:Notify', src, 'USB features require Fractal Crypto Miner script', 'error')
        return
    end
    
    amount = tonumber(amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid amount', 'error')
        return
    end
    
    -- Get USB crypto balance
    local usbCrypto, usbSlot = GetUSBCryptoBalance(src)
    
    if not usbSlot then
        TriggerClientEvent('QBCore:Notify', src, 'No USB drive found', 'error')
        return
    end
    
    if usbCrypto < amount then
        TriggerClientEvent('QBCore:Notify', src, 'Insufficient crypto on USB', 'error')
        return
    end
    
    -- Round to 4 decimal places
    amount = math.floor(amount * 10000 + 0.5) / 10000
    usbCrypto = math.floor(usbCrypto * 10000 + 0.5) / 10000
    
    -- Cap to available balance if slightly over (floating point tolerance)
    if amount > usbCrypto then
        amount = usbCrypto
    end
    
    -- Get USB item
    local usbItem = Player.PlayerData.items[usbSlot]
    if not usbItem or not usbItem.info then
        TriggerClientEvent('QBCore:Notify', src, 'USB drive error', 'error')
        return
    end
    
    -- Add unique USB ID if it doesn't exist (prevents stacking exploit)
    if not usbItem.info.usbid then
        usbItem.info.usbid = 'USB-' .. os.time() .. '-' .. math.random(10000, 99999)
    end
    
    -- Deduct from USB
    usbItem.info.crypto = usbCrypto - amount
    
    -- Remove crypto info if empty (but keep usbid to prevent stacking)
    if usbItem.info.crypto <= 0 then
        usbItem.info.crypto = nil
        usbItem.info.cryptoSymbol = nil
    end
    
    exports['lj-inventory']:SetItemData(src, 'usb_drive', 'info', usbItem.info, usbSlot)
    
    -- Add to wallet
    local wallet = GetOrCreateWallet(Player.PlayerData.citizenid)
    MySQL.Sync.execute('UPDATE crypto_wallets SET wallet_balance = wallet_balance + ? WHERE citizenid = ?', {
        amount,
        Player.PlayerData.citizenid
    })
    
    -- Record transaction
    MySQL.Sync.execute([[
        INSERT INTO crypto_transactions 
        (from_wallet, to_wallet, from_citizenid, to_citizenid, amount, transaction_type, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        'USB_DRIVE',
        wallet.wallet_address,
        Player.PlayerData.citizenid,
        Player.PlayerData.citizenid,
        amount,
        'deposit_usb',
        'Deposited from USB to wallet',
        'completed'
    })
    
    TriggerClientEvent('QBCore:Notify', src, string.format('Deposited %.4f FBT from USB to wallet', amount), 'success')
    TriggerClientEvent('fractal-laptop:client:refreshWallet', src)
end)

-- Withdraw crypto from wallet to USB
RegisterNetEvent('fractal-laptop:server:withdrawToUSB', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    -- Validate crypto miner integration
    if not ValidateCryptoMinerIntegration() or not Config.Integrations.cryptoMiner.features.usbIntegration then
        TriggerClientEvent('QBCore:Notify', src, 'USB features require Fractal Crypto Miner script', 'error')
        return
    end
    
    amount = tonumber(amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid amount', 'error')
        return
    end
    
    -- Check if player has USB
    local usbCrypto, usbSlot = GetUSBCryptoBalance(src)
    
    if not usbSlot then
        TriggerClientEvent('QBCore:Notify', src, 'No USB drive found in inventory', 'error')
        return
    end
    
    -- Get wallet balance
    local wallet = GetOrCreateWallet(Player.PlayerData.citizenid)
    local walletBalance = tonumber(wallet.wallet_balance) or 0
    
    -- Round to 4 decimal places
    amount = math.floor(amount * 10000 + 0.5) / 10000
    walletBalance = math.floor(walletBalance * 10000 + 0.5) / 10000
    
    if walletBalance < amount then
        TriggerClientEvent('QBCore:Notify', src, 'Insufficient wallet balance', 'error')
        return
    end
    
    -- Cap to available balance if slightly over (floating point tolerance)
    if amount > walletBalance then
        amount = walletBalance
    end
    
    -- Get USB item
    local usbItem = Player.PlayerData.items[usbSlot]
    if not usbItem or not usbItem.info then
        TriggerClientEvent('QBCore:Notify', src, 'USB drive error', 'error')
        return
    end
    
    -- Add unique USB ID if it doesn't exist (prevents stacking exploit)
    if not usbItem.info.usbid then
        usbItem.info.usbid = 'USB-' .. os.time() .. '-' .. math.random(10000, 99999)
    end
    
    -- Deduct from wallet
    MySQL.Sync.execute('UPDATE crypto_wallets SET wallet_balance = wallet_balance - ? WHERE citizenid = ?', {
        amount,
        Player.PlayerData.citizenid
    })
    
    -- Add to USB
    usbItem.info.crypto = (tonumber(usbItem.info.crypto) or 0) + amount
    usbItem.info.cryptoSymbol = 'FBT'
    exports['lj-inventory']:SetItemData(src, 'usb_drive', 'info', usbItem.info, usbSlot)
    
    -- Record transaction
    MySQL.Sync.execute([[
        INSERT INTO crypto_transactions 
        (from_wallet, to_wallet, from_citizenid, to_citizenid, amount, transaction_type, description, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        wallet.wallet_address,
        'USB_DRIVE',
        Player.PlayerData.citizenid,
        Player.PlayerData.citizenid,
        amount,
        'withdraw_usb',
        'Withdrawn from wallet to USB',
        'completed'
    })
    
    TriggerClientEvent('QBCore:Notify', src, string.format('Withdrawn %.4f FBT from wallet to USB', amount), 'success')
    TriggerClientEvent('fractal-laptop:client:refreshWallet', src)
end)

-- Get transaction history
QBCore.Functions.CreateCallback('fractal-laptop:server:getTransactions', function(source, cb, limit)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then 
        cb({})
        return 
    end
    
    limit = limit or 50
    
    local transactions = MySQL.Sync.fetchAll([[
        SELECT * FROM crypto_transactions 
        WHERE from_citizenid = ? OR to_citizenid = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    ]], {
        Player.PlayerData.citizenid,
        Player.PlayerData.citizenid,
        limit
    })
    
    cb(transactions or {})
end)

-- ====================================
-- BOSS MENU SYSTEM
-- ====================================

-- Get society account balance
local function GetSocietyAccount(jobName)
    local success, balance = pcall(function()
        return exports['qb-management']:GetAccount(jobName)
    end)
    
    if success and balance then
        return tonumber(balance) or 0
    end
    
    -- Fallback to qb-banking if qb-management not available
    local bankingBalance = exports['qb-banking']:GetAccountBalance(jobName)
    return tonumber(bankingBalance) or 0
end

-- Add money to society account (Framework & Config aware)
local function AddSocietyMoney(jobName, amount)
    local system = Config.BossMenu.societySystem
    
    if system == 'qb-management' then
        local success = pcall(function()
            return exports['qb-management']:AddMoney(jobName, amount)
        end)
        if not success then
            TriggerEvent('qb-bossmenu:server:addAccountMoney', jobName, amount)
        end
    elseif system == 'qb-banking' then
        TriggerEvent('qb-banking:server:AddMoney', 'society_' .. jobName, amount)
    elseif system == 'qb-bossmenu' then
        TriggerEvent('qb-bossmenu:server:addAccountMoney', jobName, amount)
    elseif system == 'esx' and Config.Framework == 'esx' then
        MySQL.Async.execute('UPDATE addon_account_data SET money = money + ? WHERE account_name = ?', {amount, 'society_' .. jobName})
    end
end

-- Remove money from society account (Framework & Config aware)
local function RemoveSocietyMoney(jobName, amount)
    local system = Config.BossMenu.societySystem
    
    if system == 'qb-management' then
        local success = pcall(function()
            return exports['qb-management']:RemoveMoney(jobName, amount)
        end)
        if not success then
            TriggerEvent('qb-bossmenu:server:removeAccountMoney', jobName, amount)
        end
    elseif system == 'qb-banking' then
        TriggerEvent('qb-banking:server:RemoveMoney', 'society_' .. jobName, amount)
    elseif system == 'qb-bossmenu' then
        TriggerEvent('qb-bossmenu:server:removeAccountMoney', jobName, amount)
    elseif system == 'esx' and Config.Framework == 'esx' then
        MySQL.Async.execute('UPDATE addon_account_data SET money = money - ? WHERE account_name = ?', {amount, 'society_' .. jobName})
    end
end

-- Get language strings helper
local function GetLanguageStrings()
    local lang = Config.BossMenu.language or 'en'
    return Config.BossMenu.languages[lang] or Config.BossMenu.languages['en']
end

-- Get Boss Menu Data (With Caching & Multi-Framework Support)
local function CreateBossMenuCallback()
    if Config.Framework == 'qb-core' then
        return QBCore.Functions.CreateCallback
    elseif Config.Framework == 'esx' then
        -- ESX uses lib.RegisterCallback (qb-core compatibility wrapper)
        return function(name, callback)
            lib.RegisterCallback(name, callback)
        end
    else
        return QBCore.Functions.CreateCallback
    end
end

CreateBossMenuCallback()('fractal-laptop:server:getBossMenuData', function(source, cb)
    if not Config.BossMenu.enabled then
        cb({error = 'disabled'})
        return
    end
    
    local Player = GetFrameworkPlayer(source)
    if not Player then 
        cb(nil)
        return 
    end
    
    local job = GetPlayerJob(Player)
    if not job then
        cb({error = 'no_job'})
        return
    end
    
    local jobName = Config.Framework == 'qb-core' and job.name or job.name
    local jobLabel = Config.Framework == 'qb-core' and job.label or (ESX.GetJob(jobName) and ESX.GetJob(jobName).label or jobName)
    
    -- Check if player is boss
    if not IsPlayerBoss(Player) then
        cb({error = 'not_boss'})
        return
    end
    
    -- Check cache (Performance Optimization) - Always check cache first to avoid expensive queries
    if IsCacheValid(jobName, 60) and BossMenuCache[jobName] then
        cb(BossMenuCache[jobName])
        return
    end
    
    -- Get society balance
    local balance = GetSocietyAccount(jobName)
    
    -- Get all employees (Framework-aware query with pagination)
    local employees = {}
    if Config.Framework == 'qb-core' then
        employees = MySQL.Sync.fetchAll([[
            SELECT 
                p.citizenid,
                p.charinfo,
                p.job
            FROM players p
            WHERE JSON_EXTRACT(p.job, '$.name') = ?
            ORDER BY JSON_EXTRACT(p.job, '$.grade.level') DESC, p.citizenid ASC
            LIMIT ?
        ]], {jobName, Config.BossMenu.performance.maxEmployeesPerPage})
    elseif Config.Framework == 'esx' then
        employees = MySQL.Sync.fetchAll([[
            SELECT 
                identifier as citizenid,
                firstname,
                lastname,
                job,
                job_grade
            FROM users
            WHERE job = ?
            ORDER BY job_grade DESC, identifier ASC
            LIMIT ?
        ]], {jobName, Config.BossMenu.performance.maxEmployeesPerPage})
    end
    
    -- Format employees data (Framework-aware)
    local formattedEmployees = {}
    for _, emp in ipairs(employees) do
        local name, grade, gradeName, payment, isboss, identifier
        
        if Config.Framework == 'qb-core' then
            local charInfo = json.decode(emp.charinfo)
            local jobData = json.decode(emp.job)
            name = (charInfo.firstname or 'Unknown') .. ' ' .. (charInfo.lastname or '')
            grade = jobData.grade.level or 0
            gradeName = jobData.grade.name or 'Employee'
            payment = jobData.grade.payment or 0
            isboss = jobData.grade.isboss or false
            identifier = emp.citizenid
        elseif Config.Framework == 'esx' then
            name = (emp.firstname or 'Unknown') .. ' ' .. (emp.lastname or '')
            grade = emp.job_grade or 0
            local jobGradeData = ESX.GetJob(jobName).grades[tostring(grade)]
            gradeName = jobGradeData and jobGradeData.name or 'Employee'
            payment = jobGradeData and jobGradeData.salary or 0
            isboss = jobGradeData and jobGradeData.name == 'boss' or false
            identifier = emp.citizenid
        end
        
        -- Check if employee is online (Framework-aware)
        local onlinePlayer = nil
        local isOnline = false
        if Config.Framework == 'qb-core' then
            onlinePlayer = QBCore.Functions.GetPlayerByCitizenId(identifier)
            isOnline = onlinePlayer ~= nil
        elseif Config.Framework == 'esx' then
            onlinePlayer = ESX.GetPlayerFromIdentifier(identifier)
            isOnline = onlinePlayer ~= nil
        end
        
        table.insert(formattedEmployees, {
            citizenid = identifier,
            name = name,
            grade = grade,
            gradeName = gradeName,
            payment = payment,
            isboss = isboss,
            isOnline = isOnline,
            source = isOnline and (Config.Framework == 'qb-core' and onlinePlayer.PlayerData.source or onlinePlayer.source) or nil
        })
    end
    
    -- Get job grades for promotion/demotion (Framework-aware)
    local jobGrades = {}
    if Config.Framework == 'qb-core' then
        local sharedJob = QBCore.Shared.Jobs[jobName]
        if sharedJob and sharedJob.grades then
            for gradeLevel, gradeData in pairs(sharedJob.grades) do
                table.insert(jobGrades, {
                    level = tonumber(gradeLevel),
                    name = gradeData.name,
                    payment = gradeData.payment,
                    isboss = gradeData.isboss or false
                })
            end
            table.sort(jobGrades, function(a, b) return a.level < b.level end)
        end
    elseif Config.Framework == 'esx' then
        local esxJob = ESX.GetJob(jobName)
        if esxJob and esxJob.grades then
            for gradeLevel, gradeData in pairs(esxJob.grades) do
                table.insert(jobGrades, {
                    level = tonumber(gradeLevel),
                    name = gradeData.name,
                    payment = gradeData.salary,
                    isboss = gradeData.name == 'boss' or false
                })
            end
            table.sort(jobGrades, function(a, b) return a.level < b.level end)
        end
    end
    
    -- Get transaction history (Framework-aware with pagination)
    local transactionLimit = Config.BossMenu.performance.maxTransactions or 100
    local transactions = {}
    
    if Config.Framework == 'qb-core' then
        transactions = MySQL.Sync.fetchAll([[
            SELECT * FROM bank_statements 
            WHERE account_name = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ]], {jobName, transactionLimit})
    elseif Config.Framework == 'esx' then
        transactions = MySQL.Sync.fetchAll([[
            SELECT * FROM billing 
            WHERE society = ? 
            ORDER BY time DESC 
            LIMIT ?
        ]], {'society_' .. jobName, transactionLimit})
    end
    
    -- Get MOTD and Journal (from boss_menu_data table)
    local bossData = MySQL.Sync.fetchAll('SELECT * FROM boss_menu_data WHERE job_name = ?', {jobName})
    local motd = ''
    local journal = ''
    
    if bossData[1] then
        motd = bossData[1].motd or ''
        journal = bossData[1].journal or ''
    end
    
    -- Build response with language strings
    local response = {
        job = {
            name = jobName,
            label = jobLabel,
            balance = balance
        },
        employees = formattedEmployees,
        grades = jobGrades,
        transactions = transactions or {},
        motd = motd,
        journal = journal,
        language = GetLanguageStrings(),
        customization = Config.BossMenu.customization
    }
    
    -- Cache the result (Performance Optimization) - Increased to 60 seconds
    if Config.BossMenu.performance.cacheEmployees or Config.BossMenu.performance.cacheTransactions then
        BossMenuCache[jobName] = response
        CacheExpiry[jobName] = os.time() + 60 -- 60 second cache (reduced query frequency)
    end
    
    cb(response)
end)

-- Hire Employee (Framework-aware)
RegisterNetEvent('fractal-laptop:server:hireEmployee', function(targetCitizenid)
    if not Config.BossMenu.features.hireFire then return end
    
    local src = source
    local Player = GetFrameworkPlayer(src)
    if not Player then return end
    
    local job = GetPlayerJob(Player)
    if not job or not IsPlayerBoss(Player) then
        NotifyPlayer(src, 'You are not authorized to hire employees', 'error')
        return
    end
    
    local jobName = Config.Framework == 'qb-core' and job.name or job.name
    local jobLabel = Config.Framework == 'qb-core' and job.label or (ESX.GetJob(jobName) and ESX.GetJob(jobName).label or jobName)
    
    -- Get target player
    local TargetPlayer = nil
    if Config.Framework == 'qb-core' then
        TargetPlayer = QBCore.Functions.GetPlayerByCitizenId(targetCitizenid)
    elseif Config.Framework == 'esx' then
        TargetPlayer = ESX.GetPlayerFromIdentifier(targetCitizenid)
    end
    
    if not TargetPlayer then
        NotifyPlayer(src, 'Player not found', 'error')
        return
    end
    
    -- Find lowest grade
    local lowestGrade = 0
    if Config.Framework == 'qb-core' then
        local sharedJob = QBCore.Shared.Jobs[jobName]
        if sharedJob and sharedJob.grades then
            for gradeLevel, _ in pairs(sharedJob.grades) do
                local level = tonumber(gradeLevel)
                if level < lowestGrade or lowestGrade == 0 then
                    lowestGrade = level
                end
            end
        end
        TargetPlayer.Functions.SetJob(jobName, lowestGrade)
    elseif Config.Framework == 'esx' then
        local esxJob = ESX.GetJob(jobName)
        if esxJob and esxJob.grades then
            for gradeLevel, _ in pairs(esxJob.grades) do
                local level = tonumber(gradeLevel)
                if level < lowestGrade or lowestGrade == 0 then
                    lowestGrade = level
                end
            end
        end
        TargetPlayer.setJob(jobName, lowestGrade)
    end
    
    -- Clear cache
    ClearBossMenuCache(jobName)
    
    NotifyPlayer(src, 'Employee hired successfully', 'success')
    NotifyPlayer(Config.Framework == 'qb-core' and TargetPlayer.PlayerData.source or TargetPlayer.source, 'You have been hired as ' .. jobLabel, 'success')
end)

-- Fire Employee
RegisterNetEvent('fractal-laptop:server:fireEmployee', function(targetCitizenid)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized to fire employees', 'error')
        return
    end
    
    local TargetPlayer = QBCore.Functions.GetPlayerByCitizenId(targetCitizenid)
    if not TargetPlayer then
        TriggerClientEvent('QBCore:Notify', src, 'Player not found', 'error')
        return
    end
    
    TargetPlayer.Functions.SetJob('unemployed', 0)
    TriggerClientEvent('QBCore:Notify', src, 'Employee fired', 'success')
    TriggerClientEvent('QBCore:Notify', TargetPlayer.PlayerData.source, 'You have been fired from ' .. job.label, 'error')
end)

-- Update Employee Grade
RegisterNetEvent('fractal-laptop:server:updateEmployeeGrade', function(targetCitizenid, newGrade)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized to change employee grades', 'error')
        return
    end
    
    local TargetPlayer = QBCore.Functions.GetPlayerByCitizenId(targetCitizenid)
    if not TargetPlayer then
        TriggerClientEvent('QBCore:Notify', src, 'Player not found', 'error')
        return
    end
    
    TargetPlayer.Functions.SetJob(job.name, tonumber(newGrade))
    TriggerClientEvent('QBCore:Notify', src, 'Employee grade updated', 'success')
    TriggerClientEvent('QBCore:Notify', TargetPlayer.PlayerData.source, 'Your position has been updated', 'success')
end)

-- Society Deposit
RegisterNetEvent('fractal-laptop:server:depositSocietyMoney', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized', 'error')
        return
    end
    
    amount = tonumber(amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid amount', 'error')
        return
    end
    
    local bankBalance = Player.PlayerData.money.bank
    if bankBalance < amount then
        TriggerClientEvent('QBCore:Notify', src, 'Insufficient funds', 'error')
        return
    end
    
    Player.Functions.RemoveMoney('bank', amount)
    AddSocietyMoney(job.name, amount)
    
    -- Log transaction
    MySQL.Async.execute([[
        INSERT INTO bank_statements (account_name, amount, transaction_type, citizenid, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ]], {job.name, amount, 'deposit', Player.PlayerData.citizenid})
    
    -- Clear cache and refresh client
    ClearBossMenuCache(job.name)
    TriggerClientEvent('fractal-laptop:client:bossMenuTransactionComplete', src, true, 'Deposit successful')
    TriggerClientEvent('QBCore:Notify', src, 'Deposited $' .. amount .. ' to society account', 'success')
end)

-- Society Withdraw
RegisterNetEvent('fractal-laptop:server:withdrawSocietyMoney', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized', 'error')
        return
    end
    
    amount = tonumber(amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid amount', 'error')
        return
    end
    
    local societyBalance = GetSocietyAccount(job.name)
    if societyBalance < amount then
        TriggerClientEvent('QBCore:Notify', src, 'Insufficient society funds', 'error')
        return
    end
    
    RemoveSocietyMoney(job.name, amount)
    Player.Functions.AddMoney('bank', amount)
    
    -- Log transaction
    MySQL.Async.execute([[
        INSERT INTO bank_statements (account_name, amount, transaction_type, citizenid, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ]], {job.name, -amount, 'withdraw', Player.PlayerData.citizenid})
    
    -- Clear cache and refresh client
    ClearBossMenuCache(job.name)
    TriggerClientEvent('fractal-laptop:client:bossMenuTransactionComplete', src, true, 'Withdraw successful')
    TriggerClientEvent('QBCore:Notify', src, 'Withdrew $' .. amount .. ' from society account', 'success')
end)

-- Give Employee Bonus
RegisterNetEvent('fractal-laptop:server:giveEmployeeBonus', function(targetCitizenid, amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized', 'error')
        return
    end
    
    amount = tonumber(amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Invalid amount', 'error')
        return
    end
    
    local societyBalance = GetSocietyAccount(job.name)
    if societyBalance < amount then
        TriggerClientEvent('QBCore:Notify', src, 'Insufficient society funds', 'error')
        return
    end
    
    local TargetPlayer = QBCore.Functions.GetPlayerByCitizenId(targetCitizenid)
    if not TargetPlayer then
        TriggerClientEvent('QBCore:Notify', src, 'Player not found', 'error')
        return
    end
    
    RemoveSocietyMoney(job.name, amount)
    TargetPlayer.Functions.AddMoney('bank', amount)
    
    -- Log transaction
    MySQL.Async.execute([[
        INSERT INTO bank_statements (account_name, amount, transaction_type, citizenid, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ]], {job.name, -amount, 'bonus', targetCitizenid})
    
    TriggerClientEvent('QBCore:Notify', src, 'Gave bonus of $' .. amount, 'success')
    TriggerClientEvent('QBCore:Notify', TargetPlayer.PlayerData.source, 'You received a bonus of $' .. amount, 'success')
end)

-- Save MOTD
RegisterNetEvent('fractal-laptop:server:saveMOTD', function(motd)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized', 'error')
        return
    end
    
    -- Check if record exists
    local exists = MySQL.Sync.fetchAll('SELECT id FROM boss_menu_data WHERE job_name = ?', {job.name})
    
    if exists[1] then
        MySQL.Async.execute('UPDATE boss_menu_data SET motd = ? WHERE job_name = ?', {motd, job.name})
    else
        MySQL.Async.execute('INSERT INTO boss_menu_data (job_name, motd) VALUES (?, ?)', {job.name, motd})
    end
    
    TriggerClientEvent('QBCore:Notify', src, 'Message of the Day saved', 'success')
end)

-- Save Journal
RegisterNetEvent('fractal-laptop:server:saveJournal', function(journal)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local job = Player.PlayerData.job
    if not job.isboss then
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized', 'error')
        return
    end
    
    -- Check if record exists
    local exists = MySQL.Sync.fetchAll('SELECT id FROM boss_menu_data WHERE job_name = ?', {job.name})
    
    if exists[1] then
        MySQL.Async.execute('UPDATE boss_menu_data SET journal = ? WHERE job_name = ?', {journal, job.name})
    else
        MySQL.Async.execute('INSERT INTO boss_menu_data (job_name, journal) VALUES (?, ?)', {job.name, journal})
    end
    
    TriggerClientEvent('QBCore:Notify', src, 'Business journal saved', 'success')
end)

-- Get online players for hiring
-- ====================================
-- MINING MONITOR APP
-- ====================================

-- Get All Active Miners Data
QBCore.Functions.CreateCallback('fractal-laptop:server:getMiningMonitorData', function(source, cb)
    -- Check if fractal-cryptominer resource is running
    if GetResourceState('fractal-cryptominer') ~= 'started' then
        print('[Laptop-OS] Mining Monitor: fractal-cryptominer resource not started')
        cb({ error = 'Mining system not available', miners = {}, cryptoPrice = 0, cryptoSymbol = 'FBT', stats = { totalMiners = 0, activeMiners = 0, totalCrypto = 0, totalHashrate = 0, averageHashrate = 0 } })
        return
    end
    
    -- Use callback instead of export (more reliable)
    print('[Laptop-OS] Mining Monitor: Triggering callback for source ' .. source)
    QBCore.Functions.TriggerCallback('fractal-cryptominer:server:getAllActiveMiners', source, function(result)
        print('[Laptop-OS] Mining Monitor: Callback response received')
        print('[Laptop-OS] Mining Monitor: Result type: ' .. type(result))
        
        if not result then
            print('[Laptop-OS] Mining Monitor: No data received from callback')
            cb({ error = 'No miner data received', miners = {}, cryptoPrice = 0, cryptoSymbol = 'FBT', stats = { totalMiners = 0, activeMiners = 0, totalCrypto = 0, totalHashrate = 0, averageHashrate = 0 } })
            return
        end
        
        local minersData = result.miners or {}
        local cryptoPrice = result.cryptoPrice or 0
        local cryptoSymbol = result.cryptoSymbol or 'FBT'
        
        print('[Laptop-OS] Mining Monitor: Received ' .. #minersData .. ' miners')
        print('[Laptop-OS] Mining Monitor: CryptoPrice: ' .. tostring(cryptoPrice))
        print('[Laptop-OS] Mining Monitor: CryptoSymbol: ' .. tostring(cryptoSymbol))
    
        -- Format miners data for client
        local formattedMiners = {}
        local totalCrypto = 0
        local activeMiningCount = 0
        local totalHashrate = 0
        
        for i, miner in ipairs(minersData) do
            print('[Laptop-OS] Mining Monitor: Processing miner ' .. i .. ': ' .. tostring(miner.minerid))
            
            -- Safely extract values
            local cryptoBalance = tonumber(miner.cryptoBalance) or 0
            local hashrate = tonumber(miner.hashrate) or 0
            local totalRuntime = tonumber(miner.totalRuntime) or 0
            local lastMine = tonumber(miner.lastMine) or 0
            local isMining = miner.isMining == true or miner.isMining == 1
            
            totalCrypto = totalCrypto + cryptoBalance
            if isMining then
                activeMiningCount = activeMiningCount + 1
            end
            totalHashrate = totalHashrate + hashrate
            
            -- Safely extract position
            local position = { x = 0, y = 0, z = 0 }
            if miner.position then
                if type(miner.position) == 'table' then
                    position.x = tonumber(miner.position.x) or 0
                    position.y = tonumber(miner.position.y) or 0
                    position.z = tonumber(miner.position.z) or 0
                end
            end
            
            -- Count parts safely
            local partsCount = 0
            if miner.parts then
                if type(miner.parts) == 'table' then
                    -- Count CPU if installed
                    if miner.parts.cpu and miner.parts.cpu.installed then
                        partsCount = partsCount + 1
                    end
                    -- Count Power Supply if installed
                    if miner.parts.powersupply and miner.parts.powersupply.installed then
                        partsCount = partsCount + 1
                    end
                    -- Count GPUs if installed
                    if miner.parts.gpus then
                        if type(miner.parts.gpus) == 'table' then
                            for _, gpu in pairs(miner.parts.gpus) do
                                if gpu and gpu.installed then
                                    partsCount = partsCount + 1
                                end
                            end
                        end
                    end
                    -- Count any other parts (for future expansion)
                    for partType, partData in pairs(miner.parts) do
                        if partType ~= 'cpu' and partType ~= 'powersupply' and partType ~= 'gpus' then
                            if type(partData) == 'table' and partData.installed then
                                partsCount = partsCount + 1
                            end
                        end
                    end
                end
            end
            
            formattedMiners[#formattedMiners + 1] = {
                minerid = tostring(miner.minerid or 'Unknown'),
                owner = tostring(miner.owner or 'Unknown'),
                position = position,
                cryptoBalance = cryptoBalance,
                isMining = isMining,
                hashrate = hashrate,
                totalRuntime = totalRuntime,
                lastMine = lastMine,
                partsCount = partsCount
            }
        end
        
        print('[Laptop-OS] Mining Monitor: Returning ' .. #formattedMiners .. ' formatted miners')
        print('[Laptop-OS] Mining Monitor: Stats - Total: ' .. #formattedMiners .. ', Active: ' .. activeMiningCount .. ', Crypto: ' .. totalCrypto .. ', Hashrate: ' .. totalHashrate)
        
        cb({
            miners = formattedMiners,
            cryptoPrice = cryptoPrice,
            cryptoSymbol = cryptoSymbol,
            stats = {
                totalMiners = #formattedMiners,
                activeMiners = activeMiningCount,
                totalCrypto = totalCrypto,
                totalHashrate = totalHashrate,
                averageHashrate = #formattedMiners > 0 and (totalHashrate / #formattedMiners) or 0
            }
        })
    end)
end)

QBCore.Functions.CreateCallback('fractal-laptop:server:getOnlinePlayers', function(source, cb)
    local players = QBCore.Functions.GetQBPlayers()
    local onlinePlayers = {}
    
    for _, player in pairs(players) do
        if player.PlayerData.job.name == 'unemployed' then
            table.insert(onlinePlayers, {
                citizenid = player.PlayerData.citizenid,
                name = player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname,
                source = player.PlayerData.source
            })
        end
    end
    
    cb(onlinePlayers)
end)

-- ====================================
-- UTILITY FUNCTIONS
-- ====================================

function table.contains(table, element)
    for _, value in pairs(table) do
        if value == element then
            return true
        end
    end
    return false
end

-- ====================================
-- CRYPTO WASH SYSTEM
-- ====================================

-- CanAccessCryptoWash is now defined earlier (before GetAvailableUSBApps)

-- Check if player is law enforcement
local function IsLawEnforcement(player)
    if not Config.CryptoWash then return false end
    
    local job = GetPlayerJob(player)
    if not job then return false end
    
    local jobName = Config.Framework == 'qb-core' and job.name or job.name
    
    for _, leJob in ipairs(Config.CryptoWash.lawEnforcementJobs) do
        if jobName == leJob then
            return true
        end
    end
    
    return false
end

-- Generate unique wash ID
local function GenerateWashId()
    return 'wash_' .. math.random(100000, 999999) .. '_' .. os.time()
end

-- Active washes tracking
local ActiveWashes = {}

-- Get crypto price from fractal-cryptominer
local function GetCryptoPrice()
    local price = 150 -- Default fallback
    if GetResourceState('fractal-cryptominer') == 'started' then
        local success, result = pcall(function()
            return exports['fractal-cryptominer']:GetCryptoPrice()
        end)
        if success and result then
            price = tonumber(result) or price
        end
    end
    return price
end

-- Calculate wash time based on crypto amount
local function CalculateWashTime(cryptoAmount)
    local settings = Config.CryptoWash.riskSettings
    return settings.baseTime + (cryptoAmount * settings.timePerCrypto)
end

-- Calculate alert chance per minute
local function CalculateAlertChance(cryptoAmount)
    local settings = Config.CryptoWash.riskSettings
    return math.min(100, settings.baseAlertChance + (cryptoAmount * settings.alertMultiplier))
end

-- Start Crypto Wash Operation
QBCore.Functions.CreateCallback('fractal-laptop:server:startCryptoWash', function(source, cb)
    local Player = GetFrameworkPlayer(source)
    if not Player then
        cb({ success = false, error = 'Player not found' })
        return
    end
    
    -- Check permissions
    if not CanAccessCryptoWash(Player) then
        cb({ success = false, error = 'You do not have permission to use Crypto Wash' })
        return
    end
    
    cb({ success = true, message = 'Ready to start wash' })
end)

-- Get USB drives with crypto
QBCore.Functions.CreateCallback('fractal-laptop:server:getCryptoWashUSBs', function(source, cb)
    local Player = GetFrameworkPlayer(source)
    if not Player then
        cb({ success = false, usbs = {} })
        return
    end
    
    local usbList = {}
    
    if Config.Framework == 'qb-core' then
        local items = Player.PlayerData.items
        for slot, item in pairs(items) do
            if item and item.name == Config.CryptoWash.usbItemName then
                local cryptoAmount = 0
                local cryptoSymbol = 'FBT'
                
                if item.info and item.info.crypto then
                    cryptoAmount = tonumber(item.info.crypto) or 0
                    cryptoSymbol = item.info.cryptoSymbol or 'FBT'
                end
                
                if cryptoAmount > 0 then
                    table.insert(usbList, {
                        slot = slot,
                        label = item.label or 'USB Drive',
                        crypto = cryptoAmount,
                        symbol = cryptoSymbol
                    })
                end
            end
        end
    end
    
    cb({ success = true, usbs = usbList })
end)

-- Start wash operation
RegisterNetEvent('fractal-laptop:server:startCryptoWash', function(data)
    local src = source
    local Player = GetFrameworkPlayer(src)
    if not Player then return end
    
    -- Check permissions
    if not CanAccessCryptoWash(Player) then
        NotifyPlayer(src, 'You do not have permission to use Crypto Wash', 'error')
        return
    end
    
    local usbSlot = data.usbSlot
    local cryptoAmount = tonumber(data.cryptoAmount) or 0
    local supervisorCut = tonumber(data.supervisorCut) or Config.CryptoWash.defaultSupervisorCut
    
    -- Validate inputs
    if cryptoAmount <= 0 then
        NotifyPlayer(src, 'Invalid crypto amount', 'error')
        return
    end
    
    if supervisorCut < Config.CryptoWash.minSupervisorCut or supervisorCut > Config.CryptoWash.maxSupervisorCut then
        NotifyPlayer(src, string.format('Supervisor cut must be between %d%% and %d%%', Config.CryptoWash.minSupervisorCut, Config.CryptoWash.maxSupervisorCut), 'error')
        return
    end
    
    -- Get USB item
    local usbItem = nil
    if Config.Framework == 'qb-core' then
        usbItem = Player.PlayerData.items[usbSlot]
    end
    
    if not usbItem or usbItem.name ~= Config.CryptoWash.usbItemName then
        NotifyPlayer(src, 'USB drive not found', 'error')
        return
    end
    
    -- Get crypto from USB
    local usbCrypto = 0
    if usbItem.info and usbItem.info.crypto then
        usbCrypto = tonumber(usbItem.info.crypto) or 0
    end
    
    -- Check if USB has any crypto
    if usbCrypto <= 0 then
        NotifyPlayer(src, 'No crypto available on USB drive', 'error')
        return
    end
    
    if usbCrypto < cryptoAmount then
        NotifyPlayer(src, 'Not enough crypto on USB drive', 'error')
        return
    end
    
    -- Get player coords (request from client via callback)
    local coords = {x = 0.0, y = 0.0, z = 0.0}
    local success, result = pcall(function()
        local ped = GetPlayerPed(src)
        if ped and ped > 0 then
            local pedCoords = GetEntityCoords(ped)
            return {x = pedCoords.x, y = pedCoords.y, z = pedCoords.z}
        end
        return nil
    end)
    if success and result then
        coords = result
    end
    
    -- Calculate values
    local cryptoPrice = GetCryptoPrice()
    local cashValue = cryptoAmount * cryptoPrice
    local supervisorPayout = math.floor(cashValue * (supervisorCut / 100))
    local ownerPayout = math.floor(cashValue - supervisorPayout)
    
    -- Calculate wash time
    local washTime = CalculateWashTime(cryptoAmount)
    local startTime = os.time() * 1000
    local endTime = startTime + washTime
    
    -- Generate wash ID
    local washId = GenerateWashId()
    
    -- Get player identifiers
    local supervisorCitizenid = Config.Framework == 'qb-core' and Player.PlayerData.citizenid or Player.identifier
    local supervisorName = Config.Framework == 'qb-core' and Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname or Player.getName()
    
    -- For now, owner is the same as supervisor (can be changed later to support different owners)
    local ownerCitizenid = supervisorCitizenid
    local ownerName = supervisorName
    
    -- Create wash operation
    local washData = {
        washId = washId,
        supervisorCitizenid = supervisorCitizenid,
        supervisorName = supervisorName,
        ownerCitizenid = ownerCitizenid,
        ownerName = ownerName,
        usbSlot = usbSlot,
        cryptoAmount = cryptoAmount,
        cryptoSymbol = usbItem.info.cryptoSymbol or 'FBT',
        supervisorCutPercent = supervisorCut,
        cashValue = cashValue,
        supervisorPayout = supervisorPayout,
        ownerPayout = ownerPayout,
        startTime = startTime,
        endTime = endTime,
        progress = 0.0,
        status = 'active',
        location = coords,
        alertSent = false,
        alertTime = nil
    }
    
    -- Insert into database
    MySQL.Async.insert([[
        INSERT INTO crypto_wash_operations 
        (wash_id, supervisor_citizenid, supervisor_name, owner_citizenid, owner_name, usb_slot, crypto_amount, crypto_symbol, supervisor_cut_percent, cash_value, supervisor_payout, owner_payout, start_time, end_time, progress, status, location_x, location_y, location_z)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        washId, supervisorCitizenid, supervisorName, ownerCitizenid, ownerName, usbSlot, cryptoAmount, washData.cryptoSymbol, supervisorCut, cashValue, supervisorPayout, ownerPayout, startTime, endTime, 0.0, 'active', coords.x, coords.y, coords.z
    }, function(insertId)
        if insertId then
            print('^2[Laptop-OS]^7 Crypto wash inserted into database with ID:', insertId)
        else
            print('^1[Laptop-OS ERROR]^7 Failed to insert crypto wash into database!')
        end
    end)
    
    -- Store in active washes
    ActiveWashes[washId] = washData
    
    -- Remove crypto from USB
    usbItem.info = usbItem.info or {}
    usbItem.info.crypto = usbCrypto - cryptoAmount
    
    if usbItem.info.crypto <= 0 then
        usbItem.info.crypto = nil
        usbItem.info.cryptoSymbol = nil
    end
    
    -- Update USB in inventory
    if Config.Framework == 'qb-core' then
        local updateSuccess = exports['lj-inventory']:SetItemData(src, Config.CryptoWash.usbItemName, 'info', usbItem.info, usbSlot)
        if not updateSuccess then
            print('^1[Laptop-OS ERROR]^7 Failed to update USB item in inventory!')
            NotifyPlayer(src, 'Failed to update USB drive', 'error')
            return
        end
        print('^2[Laptop-OS]^7 USB updated - Removed', cryptoAmount, 'crypto, Remaining:', (usbCrypto - cryptoAmount))
    end
    
    -- Send to client with all wash data
    TriggerClientEvent('fractal-laptop:client:cryptoWashStarted', src, washData)
    
    NotifyPlayer(src, string.format('Crypto wash started! Processing %s %s...', cryptoAmount, washData.cryptoSymbol), 'success')
    
    print('^2[Laptop-OS]^7 Crypto wash started:', washId, 'for', supervisorCitizenid, 'Amount:', cryptoAmount, washData.cryptoSymbol)
    print('^2[Laptop-OS]^7 Wash data being sent to client:', json.encode(washData))
end)

-- Get active washes for current player
QBCore.Functions.CreateCallback('fractal-laptop:server:getMyActiveWashes', function(source, cb)
    local Player = GetFrameworkPlayer(source)
    if not Player then
        cb({ success = false, washes = {} })
        return
    end
    
    local citizenid = Config.Framework == 'qb-core' and Player.PlayerData.citizenid or Player.identifier
    local myWashes = {}
    
    -- Check active washes in memory
    for washId, wash in pairs(ActiveWashes) do
        if wash.supervisorCitizenid == citizenid or wash.ownerCitizenid == citizenid then
            if wash.status == 'active' then
                local currentTime = os.time() * 1000
                local elapsed = currentTime - wash.startTime
                local total = wash.endTime - wash.startTime
                local progress = math.min(100, (elapsed / total) * 100)
                
                table.insert(myWashes, {
                    washId = wash.washId,
                    cryptoAmount = wash.cryptoAmount,
                    cryptoSymbol = wash.cryptoSymbol,
                    progress = progress,
                    endTime = wash.endTime,
                    startTime = wash.startTime
                })
            end
        end
    end
    
    -- Also check database for any active washes
    MySQL.Async.fetchAll('SELECT * FROM crypto_wash_operations WHERE (supervisor_citizenid = ? OR owner_citizenid = ?) AND status = ?', {
        citizenid, citizenid, 'active'
    }, function(result)
        if result then
            for _, dbWash in ipairs(result) do
                -- Check if already in myWashes
                local found = false
                for _, myWash in ipairs(myWashes) do
                    if myWash.washId == dbWash.wash_id then
                        found = true
                        break
                    end
                end
                
                if not found then
                    local currentTime = os.time() * 1000
                    local elapsed = currentTime - dbWash.start_time
                    local total = dbWash.end_time - dbWash.start_time
                    local progress = math.min(100, (elapsed / total) * 100)
                    
                    table.insert(myWashes, {
                        washId = dbWash.wash_id,
                        cryptoAmount = dbWash.crypto_amount,
                        cryptoSymbol = dbWash.crypto_symbol,
                        progress = progress,
                        endTime = dbWash.end_time,
                        startTime = dbWash.start_time
                    })
                end
            end
        end
        
        cb({ success = true, washes = myWashes })
    end)
end)

-- Get active wash progress
QBCore.Functions.CreateCallback('fractal-laptop:server:getCryptoWashProgress', function(source, cb, washId)
    local wash = ActiveWashes[washId]
    if not wash then
        -- Try to load from database
        MySQL.Async.fetchAll('SELECT * FROM crypto_wash_operations WHERE wash_id = ? AND status = ?', {washId, 'active'}, function(result)
            if result and #result > 0 then
                local dbWash = result[1]
                local currentTime = os.time() * 1000
                local elapsed = currentTime - dbWash.start_time
                local total = dbWash.end_time - dbWash.start_time
                local progress = math.min(100, (elapsed / total) * 100)
                
                cb({
                    success = true,
                    washId = washId,
                    progress = progress,
                    status = dbWash.status,
                    endTime = dbWash.end_time,
                    cryptoAmount = dbWash.crypto_amount,
                    cryptoSymbol = dbWash.crypto_symbol
                })
            else
                cb({ success = false, error = 'Wash not found' })
            end
        end)
        return
    end
    
    local currentTime = os.time() * 1000
    local elapsed = currentTime - wash.startTime
    local total = wash.endTime - wash.startTime
    local progress = math.min(100, (elapsed / total) * 100)
    
    cb({
        success = true,
        washId = washId,
        progress = progress,
        status = wash.status,
        endTime = wash.endTime,
        cryptoAmount = wash.cryptoAmount,
        cryptoSymbol = wash.cryptoSymbol
    })
end)

-- Get wash history for current player
QBCore.Functions.CreateCallback('fractal-laptop:server:getWashHistory', function(source, cb)
    local Player = GetFrameworkPlayer(source)
    if not Player then
        cb({ success = false, washes = {} })
        return
    end
    
    local citizenid = Config.Framework == 'qb-core' and Player.PlayerData.citizenid or Player.identifier
    
    -- Get completed washes from database
    MySQL.Async.fetchAll('SELECT * FROM crypto_wash_operations WHERE (supervisor_citizenid = ? OR owner_citizenid = ?) AND status = ? ORDER BY completed_at DESC LIMIT 50', {
        citizenid, citizenid, 'completed'
    }, function(result)
        local washes = {}
        
        if result then
            for _, wash in ipairs(result) do
                table.insert(washes, {
                    washId = wash.wash_id,
                    supervisorName = wash.supervisor_name,
                    ownerName = wash.owner_name,
                    cryptoAmount = wash.crypto_amount,
                    cryptoSymbol = wash.crypto_symbol,
                    supervisorCutPercent = wash.supervisor_cut_percent,
                    cashValue = wash.cash_value,
                    supervisorPayout = wash.supervisor_payout,
                    ownerPayout = wash.owner_payout,
                    completedAt = wash.completed_at
                })
            end
        end
        
        cb({ success = true, washes = washes })
    end)
end)

-- Get active washes (for law enforcement)
QBCore.Functions.CreateCallback('fractal-laptop:server:getActiveCryptoWashes', function(source, cb)
    local Player = GetFrameworkPlayer(source)
    if not Player then
        cb({ success = false, washes = {} })
        return
    end
    
    -- Check if law enforcement
    if not IsLawEnforcement(Player) then
        cb({ success = false, washes = {} })
        return
    end
    
    -- Get active washes from database
    MySQL.Async.fetchAll('SELECT * FROM crypto_wash_operations WHERE status = ?', {'active'}, function(result)
        local washes = {}
        
        if result then
            for _, wash in ipairs(result) do
                local currentTime = os.time() * 1000
                local elapsed = currentTime - wash.start_time
                local total = wash.end_time - wash.start_time
                local progress = math.min(100, (elapsed / total) * 100)
                
                table.insert(washes, {
                    washId = wash.wash_id,
                    supervisorName = wash.supervisor_name,
                    location = {x = wash.location_x, y = wash.location_y, z = wash.location_z},
                    progress = progress,
                    cryptoAmount = wash.crypto_amount,
                    cryptoSymbol = wash.crypto_symbol,
                    cashValue = wash.cash_value,
                    startTime = wash.start_time,
                    endTime = wash.end_time
                })
            end
        end
        
        cb({ success = true, washes = washes })
    end)
end)

-- Process wash completion and alerts thread
CreateThread(function()
    while true do
        Wait(5000) -- Check every 5 seconds
        
        local currentTime = os.time() * 1000
        
        -- Process active washes
        for washId, wash in pairs(ActiveWashes) do
            if wash.status == 'active' then
                -- Update progress
                local elapsed = currentTime - wash.startTime
                local total = wash.endTime - wash.startTime
                local progress = math.min(100, (elapsed / total) * 100)
                wash.progress = progress
                
                -- Check if completed
                if currentTime >= wash.endTime then
                    -- Complete wash
                    wash.status = 'completed'
                    
                    -- Give payouts
                    local supervisorPlayer = GetFrameworkPlayerByCitizenid(wash.supervisorCitizenid)
                    local ownerPlayer = GetFrameworkPlayerByCitizenid(wash.ownerCitizenid)
                    
                    if supervisorPlayer then
                        if Config.CryptoWash.payoutType == 'bank' then
                            supervisorPlayer.Functions.AddMoney('bank', wash.supervisorPayout)
                        else
                            supervisorPlayer.Functions.AddMoney('cash', wash.supervisorPayout)
                        end
                        NotifyPlayer(supervisorPlayer.PlayerData.source, string.format('Crypto wash completed! You received $%s', wash.supervisorPayout), 'success')
                    end
                    
                    if ownerPlayer and ownerPlayer.PlayerData.citizenid ~= supervisorPlayer.PlayerData.citizenid then
                        if Config.CryptoWash.payoutType == 'bank' then
                            ownerPlayer.Functions.AddMoney('bank', wash.ownerPayout)
                        else
                            ownerPlayer.Functions.AddMoney('cash', wash.ownerPayout)
                        end
                        NotifyPlayer(ownerPlayer.PlayerData.source, string.format('Crypto wash completed! You received $%s', wash.ownerPayout), 'success')
                    end
                    
                    -- Update database
                    MySQL.Async.execute('UPDATE crypto_wash_operations SET status = ?, progress = ?, completed_at = NOW() WHERE wash_id = ?', {
                        'completed', 100.0, washId
                    })
                    
                    -- Notify clients
                    TriggerClientEvent('fractal-laptop:client:cryptoWashCompleted', -1, washId)
                    
                    -- Remove from active
                    ActiveWashes[washId] = nil
                else
                    -- Check for alerts (every minute)
                    if not wash.alertSent then
                        local alertChance = CalculateAlertChance(wash.cryptoAmount)
                        local shouldAlert = math.random(1, 100) <= alertChance
                        
                        if shouldAlert then
                            wash.alertSent = true
                            wash.alertTime = currentTime
                            
                            -- Send alert to law enforcement
                            TriggerClientEvent('fractal-laptop:client:cryptoWashAlert', -1, {
                                washId = washId,
                                location = wash.location,
                                cryptoAmount = wash.cryptoAmount,
                                cryptoSymbol = wash.cryptoSymbol
                            })
                            
                            -- Update database
                            MySQL.Async.execute('UPDATE crypto_wash_operations SET alert_sent = ?, alert_time = ? WHERE wash_id = ?', {
                                1, currentTime, washId
                            })
                        end
                    end
                    
                    -- Update progress in database
                    MySQL.Async.execute('UPDATE crypto_wash_operations SET progress = ? WHERE wash_id = ?', {
                        progress, washId
                    })
                end
            end
        end
        
        -- Load active washes from database on startup
        if next(ActiveWashes) == nil then
            MySQL.Async.fetchAll('SELECT * FROM crypto_wash_operations WHERE status = ?', {'active'}, function(result)
                if result then
                    for _, dbWash in ipairs(result) do
                        ActiveWashes[dbWash.wash_id] = {
                            washId = dbWash.wash_id,
                            supervisorCitizenid = dbWash.supervisor_citizenid,
                            supervisorName = dbWash.supervisor_name,
                            ownerCitizenid = dbWash.owner_citizenid,
                            ownerName = dbWash.owner_name,
                            usbSlot = dbWash.usb_slot,
                            cryptoAmount = dbWash.crypto_amount,
                            cryptoSymbol = dbWash.crypto_symbol,
                            supervisorCutPercent = dbWash.supervisor_cut_percent,
                            cashValue = dbWash.cash_value,
                            supervisorPayout = dbWash.supervisor_payout,
                            ownerPayout = dbWash.owner_payout,
                            startTime = dbWash.start_time,
                            endTime = dbWash.end_time,
                            progress = dbWash.progress,
                            status = dbWash.status,
                            location = {x = dbWash.location_x, y = dbWash.location_y, z = dbWash.location_z},
                            alertSent = dbWash.alert_sent == 1,
                            alertTime = dbWash.alert_time
                        }
                    end
                end
            end)
        end
    end
end)

-- ====================================
-- RESOURCE START
-- ====================================

CreateThread(function()
    Wait(2000) -- Wait for MySQL to be ready
    
    -- Create laptop_data table
    local success1 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `laptop_data` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `citizenid` VARCHAR(50) NOT NULL UNIQUE,
            `settings` LONGTEXT NOT NULL DEFAULT '{}',
            `installed_apps` LONGTEXT NOT NULL DEFAULT '[]',
            `vpn_enabled` TINYINT(1) DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY `citizenid` (`citizenid`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    -- Create crypto_wallets table
    local success2 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `crypto_wallets` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `citizenid` VARCHAR(50) NOT NULL UNIQUE,
            `wallet_address` VARCHAR(64) NOT NULL UNIQUE,
            `wallet_balance` DECIMAL(15,4) DEFAULT 0.0000,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(`citizenid`),
            INDEX(`wallet_address`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    -- Create crypto_transactions table
    local success3 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `crypto_transactions` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `from_wallet` VARCHAR(64) NOT NULL,
            `to_wallet` VARCHAR(64) NOT NULL,
            `from_citizenid` VARCHAR(50) NOT NULL,
            `to_citizenid` VARCHAR(50) NOT NULL,
            `amount` DECIMAL(15,4) NOT NULL,
            `transaction_type` VARCHAR(50) NOT NULL,
            `description` VARCHAR(255),
            `status` VARCHAR(50) DEFAULT 'completed',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`from_wallet`),
            INDEX(`to_wallet`),
            INDEX(`from_citizenid`),
            INDEX(`to_citizenid`),
            INDEX(`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    -- Create unlocked_onion_sites table
    local success4 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `unlocked_onion_sites` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `citizenid` VARCHAR(50) NOT NULL,
            `site_id` INT NOT NULL,
            `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_unlock` (`citizenid`, `site_id`),
            INDEX(`citizenid`),
            INDEX(`site_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    -- Create silk_road_purchases table
    local success5 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `silk_road_purchases` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `citizenid` VARCHAR(50) NOT NULL,
            `product_id` INT NOT NULL,
            `product_name` VARCHAR(255) NOT NULL,
            `payment_type` VARCHAR(50) NOT NULL,
            `payment_amount` DECIMAL(15,4) NOT NULL,
            `item_reward` VARCHAR(100) NOT NULL,
            `item_amount` INT NOT NULL,
            `purchased_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`citizenid`),
            INDEX(`product_id`),
            INDEX(`purchased_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    -- Create blackhat_forum_posts table
    local success6 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `blackhat_forum_posts` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `citizenid` VARCHAR(50) NOT NULL,
            `author_alias` VARCHAR(100) NOT NULL,
            `title` VARCHAR(255) NOT NULL,
            `content` TEXT NOT NULL,
            `category` VARCHAR(50) DEFAULT 'general',
            `upvotes` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`citizenid`),
            INDEX(`created_at`),
            INDEX(`category`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    -- Create blackhat_forum_comments table
    local success7 = MySQL.Sync.execute([[
        CREATE TABLE IF NOT EXISTS `blackhat_forum_comments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `post_id` INT NOT NULL,
            `citizenid` VARCHAR(50) NOT NULL,
            `author_alias` VARCHAR(100) NOT NULL,
            `content` TEXT NOT NULL,
            `upvotes` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`post_id`),
            INDEX(`citizenid`),
            INDEX(`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]])
    
    if success1 and success2 and success3 and success4 and success5 and success6 and success7 then
        print('^2[Laptop-OS]^7 ✅ All database tables initialized successfully')
    else
        print('^1[Laptop-OS ERROR]^7 ❌ Some database tables failed to create! Run IMPORT_CRYPTO_WALLET_TABLES.sql manually in HeidiSQL')
    end
    
    -- Verify tables exist
    local result1 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "laptop_data"')
    local result2 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "crypto_wallets"')
    local result3 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "crypto_transactions"')
    local result4 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "unlocked_onion_sites"')
    local result5 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "silk_road_purchases"')
    local result6 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "blackhat_forum_posts"')
    local result7 = MySQL.Sync.fetchAll('SHOW TABLES LIKE "blackhat_forum_comments"')
    
    if result1 and #result1 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "laptop_data" exists and is ready')
    end
    if result2 and #result2 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "crypto_wallets" exists and is ready')
    end
    if result3 and #result3 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "crypto_transactions" exists and is ready')
    end
    if result4 and #result4 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "unlocked_onion_sites" exists and is ready')
    end
    if result5 and #result5 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "silk_road_purchases" exists and is ready')
    end
    if result6 and #result6 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "blackhat_forum_posts" exists and is ready')
    end
    if result7 and #result7 > 0 then
        print('^2[Laptop-OS]^7 ✅ Table "blackhat_forum_comments" exists and is ready')
    end
end)

-- ====================================
-- BROWSER SYSTEM CALLBACKS
-- ====================================

-- Get browser stats (online players, etc.)
QBCore.Functions.CreateCallback('fractal-laptop:server:getBrowserStats', function(source, cb)
    local onlinePlayers = #GetPlayers()
    cb({ success = true, onlinePlayers = onlinePlayers })
end)

-- Get banking info
QBCore.Functions.CreateCallback('fractal-laptop:server:getBrowserBanking', function(source, cb)
    local Player = GetFrameworkPlayer(source)
    if not Player then
        cb({ success = false })
        return
    end
    
    local bank = 0
    local cash = 0
    
    if Config.Framework == 'qb-core' then
        bank = Player.PlayerData.money.bank or 0
        cash = Player.PlayerData.money.cash or 0
    elseif Config.Framework == 'esx' then
        bank = Player.getAccount('bank').money or 0
        cash = Player.getMoney() or 0
    end
    
    -- Get recent transactions (last 10)
    local transactions = {}
    -- TODO: Implement transaction history if you have a banking system
    
    cb({ success = true, bank = bank, cash = cash, transactions = transactions })
end)

-- Get news articles
QBCore.Functions.CreateCallback('fractal-laptop:server:getBrowserNews', function(source, cb)
    -- Get news from database or config
    local news = {}
    
    -- Example news articles (you can move this to a database)
    table.insert(news, {
        title = 'Welcome to FractalRP',
        content = 'Welcome to our server! Check out our Discord for updates and announcements.',
        date = os.date('%Y-%m-%d')
    })
    
    cb({ success = true, news = news })
end)

-- Get marketplace items
QBCore.Functions.CreateCallback('fractal-laptop:server:getBrowserMarketplace', function(source, cb, data)
    local searchQuery = data.search or nil
    local category = data.category or 'all'
    
    -- Get items from qb-core/shared/items.lua or inventory system
    local items = {}
    
    -- TODO: Load items from your items.lua or shop system
    -- This is a placeholder - you'll need to integrate with your actual item system
    
    cb({ success = true, items = items })
end)

-- Get available jobs
QBCore.Functions.CreateCallback('fractal-laptop:server:getBrowserJobs', function(source, cb, data)
    local filter = data.filter or 'all'
    
    local jobs = {}
    
    -- Get jobs from QBCore
    if Config.Framework == 'qb-core' and QBCore.Shared.Jobs then
        for jobName, jobData in pairs(QBCore.Shared.Jobs) do
            local jobType = 'civilian'
            if jobName == 'police' or jobName == 'sheriff' or jobName == 'fib' then
                jobType = 'law'
            elseif jobName == 'ambulance' or jobName == 'doctor' then
                jobType = 'medical'
            end
            
            if filter == 'all' or filter == jobType then
                table.insert(jobs, {
                    name = jobName,
                    label = jobData.label or jobName,
                    description = 'Join the ' .. (jobData.label or jobName) .. ' profession',
                    type = jobType,
                    minGrade = 0,
                    salary = jobData.grades and jobData.grades[0] and jobData.grades[0].payment or 0
                })
            end
        end
    end
    
    cb({ success = true, jobs = jobs })
end)

-- Get crypto price
QBCore.Functions.CreateCallback('fractal-laptop:server:getBrowserCrypto', function(source, cb)
    -- Get crypto price from fractal-cryptominer
    local cryptoPrice = 0
    local change = 0
    
    if GetResourceState('fractal-cryptominer') == 'started' then
        QBCore.Functions.TriggerCallback('fractal-cryptominer:server:getCryptoPrice', source, function(price)
            cryptoPrice = price or 0
            -- Calculate change (placeholder - you'd track previous price)
            change = math.random(-5, 5) -- Random change for demo
            
            -- Generate price history for chart
            local history = {}
            for i = 1, 20 do
                table.insert(history, cryptoPrice + math.random(-10, 10))
            end
            
            cb({ success = true, price = cryptoPrice, change = change, history = history })
        end)
    else
        cb({ success = true, price = 0, change = 0, history = {} })
    end
end)

-- Search players
QBCore.Functions.CreateCallback('fractal-laptop:server:searchPlayers', function(source, cb, data)
    local query = data.query or ''
    local results = {}
    
    if query and #query >= 2 then
        local players = QBCore.Functions.GetPlayers()
        for _, playerId in ipairs(players) do
            local Player = QBCore.Functions.GetPlayer(playerId)
            if Player then
                local name = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
                local citizenid = Player.PlayerData.citizenid
                
                if string.find(string.lower(name), string.lower(query)) or string.find(citizenid, query) then
                    table.insert(results, {
                        name = name,
                        citizenid = citizenid,
                        job = Player.PlayerData.job.name,
                        online = true
                    })
                end
            end
        end
    end
    
    cb({ success = true, players = results })
end)

