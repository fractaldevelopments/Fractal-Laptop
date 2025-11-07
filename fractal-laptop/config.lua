Config = {}

-- ====================================
-- FRAMEWORK
-- ====================================
Config.Framework = 'qb-core' -- 'qb-core' or 'esx'

-- ====================================
-- SCRIPT INTEGRATIONS
-- ====================================
-- This system allows laptop-os to work with your other FractalRP scripts
-- Each integration can be toggled independently

Config.Integrations = {
    -- ===================================
    -- FRACTAL CRYPTO MINER INTEGRATION
    -- ===================================
    cryptoMiner = {
        -- Enable integration with fractal-cryptominer script
        enabled = true,  -- Set to false if you don't have crypto miner installed
        
        -- Auto-detect if script is installed (recommended: true)
        autoDetect = true,
        
        -- Features that get unlocked with crypto miner:
        features = {
            cryptoWash = true,        -- Money laundering app (requires usb_drive with crypto)
            miningMonitor = true,     -- Monitor all active miners
            usbIntegration = true,    -- Deposit/withdraw crypto from USB in wallet app
            cryptoWalletFull = true   -- Full wallet features (if false, only player-to-player transfers)
        }
    },
    
    -- ===================================
    -- FUTURE INTEGRATIONS (Template)
    -- ===================================
    -- Add your future scripts here:
    -- 
    -- exampleScript = {
    --     enabled = false,
    --     autoDetect = true,
    --     features = {
    --         feature1 = true,
    --         feature2 = true
    --     }
    -- }
}

-- ====================================
-- LAPTOP ITEM
-- ====================================
Config.LaptopItem = 'laptop' -- Item name in qb-core/shared/items.lua

-- USB System
Config.USB = {
    enabled = true,
    
    -- USB items and the apps they unlock
    items = {
        ['usb_hacking'] = {
            label = 'Hacking USB Drive',
            apps = {'terminal', 'network_scanner', 'exploit_kit'}
        },
        ['usb_crypto'] = {
            label = 'Crypto USB Drive', 
            apps = {'crypto_wallet', 'mining_monitor', 'blockchain_explorer'}
        },
        ['usb_documents'] = {
            label = 'Documents USB Drive',
            apps = {'file_explorer', 'text_editor', 'pdf_reader'}
        },
        ['usb_entertainment'] = {
            label = 'Entertainment USB Drive',
            apps = {'media_player', 'games', 'streaming'}
        },
        ['usb_drive'] = {
            label = 'USB Drive',
            apps = {'crypto_wash'} -- Crypto Wash requires USB drive with crypto
        }
    }
}

-- VPN System
Config.VPN = {
    enabled = true,
    autoDetect = true, -- Automatically unlock apps when player has VPN card
    itemName = 'vpn_card', -- VPN access card item
    
    -- Websites/features that require VPN
    restricted_sites = {
        'darknet_market',
        'underground_forums',
        'illegal_streaming',
        'crypto_mixer',
        'exploit_database'
    },
    
    -- Apps that require VPN
    restricted_apps = {
        'tor_browser',
        'crypto_tumbler',
        'exploit_kit'
    }
}

-- Default Apps (Always Available)
Config.DefaultApps = {
    {
        id = 'browser',
        name = 'Browser',
        icon = 'fas fa-globe',
        color = '#4285F4',
        requiresVPN = false
    },
    {
        id = 'settings',
        name = 'Settings',
        icon = 'fas fa-cog',
        color = '#5F6368',
        requiresVPN = false
    },
    {
        id = 'file_manager',
        name = 'Files',
        icon = 'fas fa-folder',
        color = '#FBBC04',
        requiresVPN = false
    },
    {
        id = 'notes',
        name = 'Notes',
        icon = 'fas fa-sticky-note',
        color = '#FFF475',
        requiresVPN = false
    },
    {
        id = 'calculator',
        name = 'Calculator',
        icon = 'fas fa-calculator',
        color = '#34A853',
        requiresVPN = false
    },
    {
        id = 'boss_menu',
        name = 'Boss Menu',
        icon = 'fas fa-briefcase',
        color = '#9C27B0',
        requiresVPN = false
    },
    -- TOR Browser is HIDDEN from desktop - only accessible via Terminal keyword reveal
    -- {
    --     id = 'tor_browser',
    --     name = 'TOR Browser',
    --     icon = 'fas fa-user-secret',
    --     color = '#7C3AED',
    --     requiresVPN = true
    -- },
    {
        id = 'terminal',
        name = 'Terminal',
        icon = 'fas fa-terminal',
        color = '#000000',
        requiresVPN = false
    },
}

-- ====================================
-- TOR BROWSER & TERMINAL CONFIGURATION
-- ====================================
-- .onion sites that can be unlocked through Terminal commands
Config.OnionSites = {
    -- Site 1: Example Black Market
    {
        id = 1,
        name = 'Silk Road 3.0',
        url = 'silkroad3abc123.onion',
        description = 'Underground marketplace for illicit goods',
        icon = 'fa-shopping-bag',
        color = '#EC4899',
        category = 'marketplace',
        
        -- Keyword needed to access this site in TOR Browser
        keyword = 'SILK_ACCESS_2025',
        
        -- Terminal command chain to reveal the keyword
        terminalCommands = {
            {
                command = 'scan --network',
                response = 'Scanning network for hidden nodes...\n\n[FOUND] Hidden node detected: 192.168.33.7\nUse: connect 192.168.33.7'
            },
            {
                command = 'connect 192.168.33.7',
                response = 'Establishing secure connection...\n[SUCCESS] Connected to hidden server\n\nAccess granted. Use: decrypt --file market.dat'
            },
            {
                command = 'decrypt --file market.dat',
                response = 'Decrypting market.dat...\n\n[DECRYPTION COMPLETE]\n═══════════════════════════════\nSITE: Silk Road 3.0\nKEYWORD: SILK_ACCESS_2025\n═══════════════════════════════\n\nUse this keyword in TOR Browser to access the site.',
                revealsKeyword = true -- This command reveals the keyword
            }
        }
    },
    
    -- Site 2: Example Hacking Forum
    {
        id = 2,
        name = 'BlackHat Forums',
        url = 'blackhat456xyz.onion',
        description = 'Anonymous hacking discussion board',
        icon = 'fa-user-secret',
        color = '#7C3AED',
        category = 'forum',
        
        keyword = 'BLACKHAT_KEY_777',
        
        terminalCommands = {
            {
                command = 'probe --deep',
                response = 'Deep scan initiated...\n\n[SIGNAL DETECTED] Encrypted transmission on port 9050\nUse: intercept 9050'
            },
            {
                command = 'intercept 9050',
                response = '[INTERCEPTING] Packet capture in progress...\n[DATA ACQUIRED] Encrypted forum credentials found\n\nUse: decode --packet forum'
            },
            {
                command = 'decode --packet forum',
                response = 'Decoding encrypted packet...\n\n[DECODE SUCCESSFUL]\n═══════════════════════════════\nSITE: BlackHat Forums\nKEYWORD: BLACKHAT_KEY_777\n═══════════════════════════════\n\nUse this keyword in TOR Browser to access the site.',
                revealsKeyword = true
            }
        }
    },
    
    -- ==========================================
    -- ADD YOUR OWN .ONION SITES BELOW:
    -- ==========================================
    -- Template:
    -- {
    --     id = 3,
    --     name = 'Your Site Name',
    --     url = 'yoursite123.onion',
    --     description = 'Site description',
    --     icon = 'fa-icon-name',
    --     color = '#HEXCOLOR',
    --     category = 'marketplace/forum/service/custom',
    --     keyword = 'YOUR_UNIQUE_KEYWORD',
    --     terminalCommands = {
    --         { command = 'your command', response = 'Response text' },
    --         { command = 'next command', response = 'More text' },
    --         { command = 'final command', response = 'Keyword revealed!', revealsKeyword = true }
    --     }
    -- },
}

-- Terminal starting help text
Config.TerminalHelp = [[
FRACTAL TERMINAL v2.1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Commands:
  help           - Show this help menu
  clear          - Clear terminal screen
  scan           - Scan for network activity
  probe          - Probe for encrypted signals
  connect        - Connect to remote servers
  intercept      - Intercept network traffic
  decrypt        - Decrypt encrypted files
  decode         - Decode captured packets
  auth           - Authentication operations
  launch         - Launch installed programs
  
Hint: Try exploring with different command flags (e.g. --network, --deep)
Type a command to begin...
]]

-- ====================================
-- SILK ROAD MARKETPLACE CONFIGURATION
-- ====================================
-- Configure products available on the Silk Road .onion marketplace
Config.SilkRoad = {
    -- Payment Settings
    payment = {
        -- Default payment method (always available)
        blackMoney = {
            enabled = true,
            itemName = 'black_money',  -- QBCore black money item
            label = 'Black Money'
        },
        
        -- Optional FBT Crypto payment (requires fractal-cryptominer)
        crypto = {
            enabled = false,  -- Set to true if you have fractal-cryptominer
            requiresUSBLedger = true,  -- Must have crypto USB ledger in inventory
            usbItemName = 'crypto_usb'  -- USB ledger item name
        }
    },
    
    -- Marketplace Categories
    categories = {
        {id = 'weapons', name = 'Weapons', icon = 'fa-crosshairs', count = 0},
        {id = 'drugs', name = 'Drugs', icon = 'fa-cannabis', count = 0},
        {id = 'electronics', name = 'Electronics', icon = 'fa-laptop', count = 0},
        {id = 'documents', name = 'Forgeries', icon = 'fa-id-card', count = 0},
        {id = 'services', name = 'Services', icon = 'fa-concierge-bell', count = 0},
        {id = 'other', name = 'Other', icon = 'fa-box', count = 0}
    },
    
    -- Products for Sale
    products = {
        -- Example Product 1: Weapon
        {
            id = 1,
            name = 'Unmarked Pistol',
            description = 'Clean firearm with serial numbers removed. Untraceable.',
            category = 'weapons',
            price = 5000,  -- Black money price
            cryptoPrice = 2.5,  -- FBT price (if crypto enabled)
            image = 'https://i.imgur.com/example1.jpg',  -- Product image (imgur)
            stockLimit = 10,  -- Max purchases per restock
            itemReward = 'weapon_pistol',  -- Item player receives
            itemAmount = 1
        },
        
        -- Example Product 2: Drug
        {
            id = 2,
            name = 'Premium White Powder',
            description = 'High purity product. Lab tested at 95%.',
            category = 'drugs',
            price = 2500,
            cryptoPrice = 1.2,
            image = 'https://i.imgur.com/example2.jpg',
            stockLimit = 50,
            itemReward = 'cokebaggy',
            itemAmount = 10
        },
        
        -- Example Product 3: Electronics
        {
            id = 3,
            name = 'Hacking Laptop',
            description = 'Pre-configured with penetration testing tools.',
            category = 'electronics',
            price = 15000,
            cryptoPrice = 7.5,
            image = 'https://i.imgur.com/example3.jpg',
            stockLimit = 5,
            itemReward = 'laptop',
            itemAmount = 1
        },
        
        -- Example Product 4: Document
        {
            id = 4,
            name = 'Fake ID Card',
            description = 'High-quality forgery with hologram. Multiple states available.',
            category = 'documents',
            price = 3000,
            cryptoPrice = 1.5,
            image = 'https://i.imgur.com/example4.jpg',
            stockLimit = 20,
            itemReward = 'id_card',
            itemAmount = 1
        },
        
        -- Example Product 5: Service
        {
            id = 5,
            name = 'Money Laundering Service',
            description = 'Clean your dirty money. 15% fee. Minimum $10,000.',
            category = 'services',
            price = 10000,
            cryptoPrice = 5.0,
            image = 'https://i.imgur.com/example5.jpg',
            stockLimit = -1,  -- Unlimited
            itemReward = 'marked_bills',
            itemAmount = 1
        },
        
        -- ADD YOUR OWN PRODUCTS BELOW:
        -- {
        --     id = 6,
        --     name = 'Your Product Name',
        --     description = 'Product description...',
        --     category = 'weapons/drugs/electronics/documents/services/other',
        --     price = 1000,  -- Black money price
        --     cryptoPrice = 0.5,  -- FBT price
        --     image = 'https://i.imgur.com/YOUR_IMAGE.jpg',
        --     stockLimit = 10,  -- -1 for unlimited
        --     itemReward = 'item_name',  -- QBCore item name
        --     itemAmount = 1  -- Quantity to give
        -- },
    }
}

-- USB Installable Apps (installed from USB drives)
Config.USBApps = {
    -- Hacking USB Apps
    ['network_scanner'] = {
        id = 'network_scanner',
        name = 'Network Scanner',
        icon = 'fas fa-network-wired',
        color = '#FF6B35',
        requiresVPN = true
    },
    ['exploit_kit'] = {
        id = 'exploit_kit',
        name = 'Exploit Kit',
        icon = 'fas fa-bug',
        color = '#DC3545',
        requiresVPN = true
    },
    
    -- Crypto USB Apps
    ['crypto_wallet'] = {
        id = 'crypto_wallet',
        name = 'Crypto Wallet',
        icon = 'fas fa-wallet',
        color = '#F7931A',
        requiresVPN = false
    },
    ['mining_monitor'] = {
        id = 'mining_monitor',
        name = 'Mining Monitor',
        icon = 'fas fa-server',
        color = '#00BCD4',
        requiresVPN = false
    },
    ['blockchain_explorer'] = {
        id = 'blockchain_explorer',
        name = 'Blockchain Explorer',
        icon = 'fas fa-cube',
        color = '#3B82F6',
        requiresVPN = false
    },
    
    -- Documents USB Apps
    ['file_explorer'] = {
        id = 'file_explorer',
        name = 'File Explorer',
        icon = 'fas fa-folder-open',
        color = '#FBBC04',
        requiresVPN = false
    },
    ['text_editor'] = {
        id = 'text_editor',
        name = 'Text Editor',
        icon = 'fas fa-file-alt',
        color = '#0078D4',
        requiresVPN = false
    },
    ['pdf_reader'] = {
        id = 'pdf_reader',
        name = 'PDF Reader',
        icon = 'fas fa-file-pdf',
        color = '#DC3545',
        requiresVPN = false
    },
    
    -- Entertainment USB Apps
    ['media_player'] = {
        id = 'media_player',
        name = 'Media Player',
        icon = 'fas fa-play-circle',
        color = '#9333EA',
        requiresVPN = false
    },
    ['games'] = {
        id = 'games',
        name = 'Games',
        icon = 'fas fa-gamepad',
        color = '#EF4444',
        requiresVPN = false
    },
    ['streaming'] = {
        id = 'streaming',
        name = 'Streaming',
        icon = 'fas fa-video',
        color = '#F59E0B',
        requiresVPN = false
    },
    
    -- Crypto Wash (requires usb_drive)
    ['crypto_wash'] = {
        id = 'crypto_wash',
        name = 'Crypto Wash',
        icon = 'fas fa-shield-halved',
        color = '#9C27B0',
        requiresVPN = false
    }
}

-- Wallpapers
Config.Wallpapers = {
    {id = 1, name = 'Mountain Peak', file = 'wallpaper1.jpg'},
    {id = 2, name = 'City Night', file = 'wallpaper2.jpg'},
    {id = 3, name = 'Ocean Waves', file = 'wallpaper3.jpg'},
    {id = 4, name = 'Forest Path', file = 'wallpaper4.jpg'},
    {id = 5, name = 'Abstract Art', file = 'wallpaper5.jpg'},
    {id = 6, name = 'Space Galaxy', file = 'wallpaper6.jpg'},
    {id = 7, name = 'Desert Sunset', file = 'wallpaper7.jpg'},
    {id = 8, name = 'Northern Lights', file = 'wallpaper8.jpg'}
}

-- System Info
Config.System = {
    osName = 'FractalOS',
    version = '1.0.0',
    manufacturer = 'FractalRP Industries',
    model = 'Laptop Pro X1'
}

-- UI Settings
Config.UI = {
    bootTime = 3000, -- ms
    shutdownTime = 2000, -- ms
    animationSpeed = 300, -- ms
    enableSounds = true,
    enableAnimations = true
}

-- Debug
Config.Debug = false

-- ====================================
-- BOSS MENU CONFIGURATION
-- ====================================

Config.BossMenu = {
    enabled = true,
    
    -- Society System Integration
    -- Options: 'qb-management', 'qb-banking', 'qb-bossmenu', 'custom'
    societySystem = 'qb-management',
    
    -- Multi-Language Support
    language = 'en', -- Default language: 'en', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ja'
    
    -- Performance Optimization
    performance = {
        cacheEmployees = true, -- Cache employee list for 30 seconds
        cacheTransactions = true, -- Cache transactions for 60 seconds
        maxEmployeesPerPage = 50, -- Pagination limit
        maxTransactions = 100, -- Max transactions to load
    },
    
    -- Customization Options
    customization = {
        -- UI Colors (Can be customized per job in server)
        primaryColor = '#9C27B0', -- Purple (Boss Menu theme)
        accentColor = '#7B1FA2',
        successColor = '#4CAF50',
        errorColor = '#F44336',
        warningColor = '#FF9800',
        
        -- Logo (Leave empty to use job icon)
        logoUrl = '', -- Custom logo URL (optional)
        
        -- Header Gradient
        headerGradient = {
            enabled = true,
            startColor = '#9C27B0',
            endColor = '#7B1FA2'
        }
    },
    
    -- Feature Toggles
    features = {
        hireFire = true, -- Enable hire/fire employees
        gradeManagement = true, -- Enable promote/demote
        salaryManagement = true, -- Enable salary/bonus management
        transactionHistory = true, -- Enable transaction logging
        motd = true, -- Enable Message of the Day
        businessJournal = true, -- Enable shared business journal
        vehicleFleet = false, -- Future: Vehicle fleet management
        performanceTracking = false, -- Future: Employee performance metrics
    },
    
    -- Permissions (Optional: Set custom permission requirements)
    permissions = {
        -- Set minimum grade level required for boss menu access (0 = default isboss check)
        minBossGrade = 0,
        
        -- Custom permission check function (return true to allow access)
        -- Example: customCheck = function(player) return player.PlayerData.metadata.admin end
        customCheck = nil,
    },
    
    -- Multi-Language Strings
    languages = {
        ['en'] = {
            -- Employee Management
            employees = 'Employees',
            hireEmployee = 'Hire Employee',
            fireEmployee = 'Fire Employee',
            promoteEmployee = 'Promote Employee',
            demoteEmployee = 'Demote Employee',
            giveBonus = 'Give Bonus',
            position = 'Position',
            payment = 'Payment',
            status = 'Status',
            online = 'Online',
            offline = 'Offline',
            noEmployees = 'No employees found',
            loadingEmployees = 'Loading employees...',
            
            -- Finance
            finance = 'Finance',
            societyBalance = 'Society Balance',
            deposit = 'Deposit',
            withdraw = 'Withdraw',
            amount = 'Amount',
            transactionHistory = 'Transaction History',
            noTransactions = 'No transactions found',
            loadingTransactions = 'Loading transactions...',
            
            -- Operations
            operations = 'Operations',
            motd = 'Message of the Day',
            motdPlaceholder = 'Set a message that employees will see when they clock in...',
            businessJournal = 'Business Journal',
            journalPlaceholder = 'Keep notes, updates, or important information here for your team...',
            save = 'Save',
            saved = 'Saved successfully',
            
            -- General
            accessDenied = 'Access Denied',
            notBoss = 'You must be a boss to access this menu.',
            confirm = 'Confirm',
            cancel = 'Cancel',
            success = 'Success',
            error = 'Error',
            invalidAmount = 'Invalid amount',
            insufficientFunds = 'Insufficient funds',
            employeeHired = 'Employee hired successfully',
            employeeFired = 'Employee fired',
            gradeUpdated = 'Employee grade updated',
            bonusGiven = 'Bonus given successfully',
        },
        
        ['es'] = {
            employees = 'Empleados',
            hireEmployee = 'Contratar Empleado',
            fireEmployee = 'Despedir Empleado',
            promoteEmployee = 'Ascender Empleado',
            demoteEmployee = 'Degradar Empleado',
            giveBonus = 'Dar Bono',
            position = 'Posición',
            payment = 'Pago',
            status = 'Estado',
            online = 'En Línea',
            offline = 'Fuera de Línea',
            noEmployees = 'No se encontraron empleados',
            loadingEmployees = 'Cargando empleados...',
            finance = 'Finanzas',
            societyBalance = 'Balance de Sociedad',
            deposit = 'Depositar',
            withdraw = 'Retirar',
            amount = 'Cantidad',
            transactionHistory = 'Historial de Transacciones',
            noTransactions = 'No se encontraron transacciones',
            loadingTransactions = 'Cargando transacciones...',
            operations = 'Operaciones',
            motd = 'Mensaje del Día',
            motdPlaceholder = 'Establece un mensaje que los empleados verán al iniciar sesión...',
            businessJournal = 'Diario de Negocios',
            journalPlaceholder = 'Mantén notas, actualizaciones o información importante aquí para tu equipo...',
            save = 'Guardar',
            saved = 'Guardado exitosamente',
            accessDenied = 'Acceso Denegado',
            notBoss = 'Debes ser un jefe para acceder a este menú.',
            confirm = 'Confirmar',
            cancel = 'Cancelar',
            success = 'Éxito',
            error = 'Error',
            invalidAmount = 'Cantidad inválida',
            insufficientFunds = 'Fondos insuficientes',
            employeeHired = 'Empleado contratado exitosamente',
            employeeFired = 'Empleado despedido',
            gradeUpdated = 'Grado de empleado actualizado',
            bonusGiven = 'Bono dado exitosamente',
        },
        
        -- Add more languages as needed...
    }
}

-- ====================================
-- CRYPTO WASH CONFIGURATION
-- ====================================

Config.CryptoWash = {
    enabled = true,
    
    -- Whitelisted Jobs (jobs that can use Crypto Wash)
    -- Add player-run business job names here (e.g., 'police', 'ambulance', 'realestate', etc.)
    whitelistedJobs = {
        'police',
        'ambulance',
        'realestate',
        'lawyer',
        'mechanic',
        'taxi',
        -- Add more jobs as needed
    },
    
    -- Minimum job grade required (0 = Supervisor and above)
    -- In QBCore: grade.level >= minGrade
    -- In ESX: grade >= minGrade
    minGrade = 2, -- Typically Supervisor is grade 2+, Boss is grade 4+
    
    -- Law Enforcement Jobs (can see active washes and get alerts)
    lawEnforcementJobs = {
        'police',
        'sheriff',
        'fib',
        -- Add more law enforcement jobs as needed
    },
    
    -- Exchange Settings
    -- These pull from fractal-cryptominer config
    useCryptoMinerConfig = true, -- If true, uses Config.CryptoExchange from fractal-cryptominer
    
    -- Payout Settings
    payoutType = 'bank', -- 'cash' or 'bank' - where clean money goes
    defaultSupervisorCut = 15, -- Default supervisor cut percentage (0-100)
    minSupervisorCut = 5, -- Minimum supervisor cut allowed
    maxSupervisorCut = 50, -- Maximum supervisor cut allowed
    
    -- Risk & Alert System
    riskSettings = {
        -- Base time per crypto amount (in milliseconds)
        -- Formula: baseTime + (cryptoAmount * timePerCrypto)
        baseTime = 30000, -- 30 seconds base time
        timePerCrypto = 5000, -- 5 seconds per crypto unit
        
        -- Alert chance per minute
        -- Formula: baseAlertChance + (cryptoAmount * alertMultiplier)
        baseAlertChance = 5, -- 5% base chance per minute
        alertMultiplier = 0.5, -- +0.5% per crypto unit
        
        -- Alert notification settings
        alertCooldown = 60000, -- 60 seconds between alerts (if multiple active)
        alertBlipRadius = 50.0, -- Radius for alert blip (in meters)
        alertBlipSprite = 1, -- Blip sprite ID
        alertBlipColor = 1, -- Blip color (red)
        alertBlipScale = 1.0,
        alertBlipLabel = 'Suspicious Business Activity',
        
        -- Alert expires after this time (in milliseconds)
        alertDuration = 300000, -- 5 minutes
    },
    
    -- USB Item Name (from fractal-cryptominer)
    usbItemName = 'usb_drive', -- Must match the USB item name from crypto miner (Config.Items.usb)
    
    -- UI Settings
    refreshInterval = 1000, -- Update progress every 1 second
    progressBarAnimation = true, -- Smooth progress bar animation
}

