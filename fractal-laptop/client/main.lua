local QBCore = exports['qb-core']:GetCoreObject()
local isLaptopOpen = false
local currentLaptopData = {}

-- ====================================
-- LAPTOP USAGE
-- ====================================

RegisterNetEvent('fractal-laptop:client:useLaptop', function()
    if isLaptopOpen then
        Notify('Laptop is already open', 'error')
        return
    end
    
    -- Request laptop data from server
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getLaptopData', function(laptopData)
        if laptopData then
            currentLaptopData = laptopData
            OpenLaptop(laptopData)
        else
            Notify('Failed to load laptop data', 'error')
        end
    end)
end)

function OpenLaptop(data)
    isLaptopOpen = true
    
    -- Disable controls
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)
    
    -- Send data to NUI
    SendNUIMessage({
        action = 'openLaptop',
        data = {
            settings = data.settings,
            installedApps = data.installedApps,
            vpnEnabled = data.vpnEnabled,
            availableUSBApps = data.availableUSBApps or {},
            defaultApps = Config.DefaultApps,
            usbApps = Config.USBApps,
            wallpapers = Config.Wallpapers,
            systemInfo = Config.System
        }
    })
    
    -- Play boot sound
    if Config.UI.enableSounds then
        PlaySoundFrontend(-1, "TIMER_STOP", "HUD_MINI_GAME_SOUNDSET", 1)
    end
    
end

function CloseLaptop()
    isLaptopOpen = false
    
    -- Re-enable controls
    SetNuiFocus(false, false)
    
    -- Send close command to NUI
    SendNUIMessage({
        action = 'closeLaptop'
    })
    
    -- Play shutdown sound
    if Config.UI.enableSounds then
        PlaySoundFrontend(-1, "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", 1)
    end
    
end

-- ====================================
-- NUI CALLBACKS
-- ====================================

-- Close laptop
RegisterNUICallback('closeLaptop', function(data, cb)
    CloseLaptop()
    cb('ok')
end)

-- Save settings
RegisterNUICallback('saveSettings', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:saveSettings', data)
    cb('ok')
end)

-- Install app from USB
RegisterNUICallback('installAppFromUSB', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:installAppFromUSB', function(success, apps)
        cb({success = success, apps = apps})
    end, data.usbItem)
end)

-- Refresh VPN status (check inventory)
RegisterNUICallback('refreshVPN', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:refreshVPN')
    cb('ok')
end)

-- Open app
RegisterNUICallback('openApp', function(data, cb)
    cb('ok')
end)

-- Check if player has USB item
RegisterNUICallback('checkUSBItems', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getUSBItems', function(usbItems)
        cb({usbItems = usbItems})
    end)
end)

-- ====================================
-- NOTES APP CALLBACKS
-- ====================================

-- Get all notes
RegisterNUICallback('getNotes', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getNotes', function(notes)
        cb({notes = notes})
    end)
end)

-- Create note
RegisterNUICallback('createNote', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:createNote', data.title, data.content)
    cb('ok')
end)

-- Update note
RegisterNUICallback('updateNote', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:updateNote', data.noteId, data.title, data.content)
    cb('ok')
end)

-- Delete note
RegisterNUICallback('deleteNote', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:deleteNote', data.noteId)
    cb('ok')
end)

-- ====================================
-- CRYPTO WALLET CALLBACKS
-- ====================================

-- Get wallet info
RegisterNUICallback('getWalletInfo', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getWalletInfo', function(walletInfo)
        cb({wallet = walletInfo})
    end)
end)

-- Find wallet by address
RegisterNUICallback('findWallet', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:findWalletByAddress', function(result)
        cb(result)
    end, data.address)
end)

-- Send crypto
RegisterNUICallback('sendCrypto', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:sendCrypto', data.toAddress, data.amount, data.description)
    cb('ok')
end)

-- Deposit from USB to wallet
RegisterNUICallback('depositFromUSB', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:depositFromUSB', data.amount)
    cb('ok')
end)

-- Withdraw from wallet to USB
RegisterNUICallback('withdrawToUSB', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:withdrawToUSB', data.amount)
    cb('ok')
end)

-- Get transactions
RegisterNUICallback('getTransactions', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getTransactions', function(transactions)
        cb({transactions = transactions})
    end, data.limit or 50)
end)

-- Access TOR Service
RegisterNUICallback('accessTORService', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:accessTORService', data.service)
    cb('ok')
end)

-- Execute Terminal Command
RegisterNUICallback('executeTerminalCommand', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:executeTerminalCommand', function(response)
        cb(response)
    end, data.command, data.progress)
end)

-- Get Unlocked .onion Sites
RegisterNUICallback('getUnlockedOnionSites', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getUnlockedOnionSites', function(sites)
        cb({success = true, sites = sites})
    end)
end)

-- Unlock .onion Site with Keyword
RegisterNUICallback('unlockOnionSite', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:unlockOnionSite', function(response)
        cb(response)
    end, data.keyword)
end)

-- Visit .onion Site
RegisterNUICallback('visitOnionSite', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:visitOnionSite', data.siteId)
    cb('ok')
end)

-- Get Silk Road Marketplace Data
RegisterNUICallback('getSilkRoadData', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getSilkRoadData', function(response)
        cb(response)
    end)
end)

-- Purchase Silk Road Product
RegisterNUICallback('purchaseSilkRoadProduct', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:purchaseSilkRoadProduct', function(response)
        cb(response)
    end, data.productId, data.paymentMethod)
end)

-- Get Forum Posts
RegisterNUICallback('getForumPosts', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getForumPosts', function(response)
        cb(response)
    end)
end)

-- Get Forum Post (with comments)
RegisterNUICallback('getForumPost', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getForumPost', function(response)
        cb(response)
    end, data.postId)
end)

-- Create Forum Post
RegisterNUICallback('createForumPost', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:createForumPost', function(response)
        cb(response)
    end, data.category, data.title, data.content)
end)

-- Add Forum Comment
RegisterNUICallback('addForumComment', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:addForumComment', function(response)
        cb(response)
    end, data.postId, data.content)
end)

-- ====================================
-- BOSS MENU CALLBACKS
-- ====================================

-- Get Boss Menu Data
RegisterNUICallback('getMiningMonitorData', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getMiningMonitorData', function(monitorData)
        cb(monitorData)
    end)
end)

-- ====================================
-- CRYPTO WASH CALLBACKS
-- ====================================

-- Check access and start wash
RegisterNUICallback('startCryptoWash', function(data, cb)
    if data.usbSlot and data.cryptoAmount then
        -- Starting wash
        TriggerServerEvent('fractal-laptop:server:startCryptoWash', {
            usbSlot = data.usbSlot,
            cryptoAmount = data.cryptoAmount,
            supervisorCut = data.supervisorCut
        })
        cb({success = true})
    else
        -- Just checking access
        QBCore.Functions.TriggerCallback('fractal-laptop:server:startCryptoWash', function(result)
            cb(result)
        end)
    end
end)

-- Get USB drives with crypto
RegisterNUICallback('getCryptoWashUSBs', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getCryptoWashUSBs', function(result)
        cb(result)
    end)
end)

-- Get wash progress
RegisterNUICallback('getCryptoWashProgress', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getCryptoWashProgress', function(result)
        cb(result)
    end, data.washId)
end)

-- Get my active washes
RegisterNUICallback('getMyActiveWashes', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getMyActiveWashes', function(result)
        cb(result)
    end)
end)

-- Get wash history
RegisterNUICallback('getWashHistory', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getWashHistory', function(result)
        cb(result)
    end)
end)

-- Browser callbacks
RegisterNUICallback('getBrowserStats', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBrowserStats', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('getBrowserBanking', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBrowserBanking', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('getBrowserNews', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBrowserNews', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('getBrowserMarketplace', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBrowserMarketplace', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('getBrowserJobs', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBrowserJobs', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('getBrowserCrypto', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBrowserCrypto', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('searchPlayers', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:searchPlayers', function(result)
        cb(result)
    end, data)
end)

-- Crypto Wash Client Events
RegisterNetEvent('fractal-laptop:client:cryptoWashStarted', function(washData)
    SendNUIMessage({
        action = 'cryptoWashStarted',
        washId = washData.washId,
        cryptoAmount = washData.cryptoAmount,
        cryptoSymbol = washData.cryptoSymbol,
        endTime = washData.endTime
    })
end)

RegisterNetEvent('fractal-laptop:client:cryptoWashCompleted', function(washId)
    SendNUIMessage({
        action = 'cryptoWashCompleted',
        washId = washId
    })
end)

RegisterNetEvent('fractal-laptop:client:cryptoWashAlert', function(alertData)
    -- Show alert to law enforcement
    local Player = QBCore.Functions.GetPlayerData()
    if Player and Player.job then
        -- Check if law enforcement (default jobs)
        local leJobs = {'police', 'sheriff', 'fib'}
        local isLE = false
        for _, leJob in ipairs(leJobs) do
            if Player.job.name == leJob then
                isLE = true
                break
            end
        end
        
        if isLE then
            -- Create blip at location (50m radius, red color)
            local blip = AddBlipForRadius(alertData.location.x, alertData.location.y, alertData.location.z, 50.0)
            SetBlipHighDetail(blip, true)
            SetBlipColour(blip, 1) -- Red
            SetBlipAlpha(blip, 200)
            
            -- Remove blip after 5 minutes
            SetTimeout(300000, function()
                RemoveBlip(blip)
            end)
            
            -- Notification
            QBCore.Functions.Notify('Suspicious crypto activity detected!', 'error', 10000)
            
            SendNUIMessage({
                action = 'cryptoWashAlert',
                location = alertData.location,
                cryptoAmount = alertData.cryptoAmount,
                cryptoSymbol = alertData.cryptoSymbol
            })
        end
    end
end)

RegisterNUICallback('getBossMenuData', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getBossMenuData', function(bossData)
        cb(bossData)
    end)
end)

-- Hire Employee
RegisterNUICallback('hireEmployee', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:hireEmployee', data.targetCitizenid)
    cb('ok')
end)

-- Fire Employee
RegisterNUICallback('fireEmployee', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:fireEmployee', data.targetCitizenid)
    cb('ok')
end)

-- Update Employee Grade
RegisterNUICallback('updateEmployeeGrade', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:updateEmployeeGrade', data.targetCitizenid, data.newGrade)
    cb('ok')
end)

-- Deposit Society Money
RegisterNUICallback('depositSocietyMoney', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:depositSocietyMoney', tonumber(data.amount))
    cb('ok')
end)

-- Withdraw Society Money
RegisterNUICallback('withdrawSocietyMoney', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:withdrawSocietyMoney', tonumber(data.amount))
    cb('ok')
end)

-- Boss Menu Transaction Complete (Refresh data)
RegisterNetEvent('fractal-laptop:client:bossMenuTransactionComplete', function(success, message)
    SendNUIMessage({
        action = 'bossMenuTransactionComplete',
        success = success,
        message = message
    })
end)

-- Give Employee Bonus
RegisterNUICallback('giveEmployeeBonus', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:giveEmployeeBonus', data.targetCitizenid, data.amount)
    cb('ok')
end)

-- Save MOTD
RegisterNUICallback('saveMOTD', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:saveMOTD', data.motd)
    cb('ok')
end)

-- Save Journal
RegisterNUICallback('saveJournal', function(data, cb)
    TriggerServerEvent('fractal-laptop:server:saveJournal', data.journal)
    cb('ok')
end)

-- Get Online Players (for hiring)
RegisterNUICallback('getOnlinePlayers', function(data, cb)
    QBCore.Functions.TriggerCallback('fractal-laptop:server:getOnlinePlayers', function(players)
        cb(players)
    end)
end)

-- ====================================
-- EVENTS
-- ====================================

-- Receive updated laptop data from server
RegisterNetEvent('fractal-laptop:client:updateLaptopData', function(data)
    currentLaptopData = data
    
    if isLaptopOpen then
        SendNUIMessage({
            action = 'updateData',
            data = data
        })
    end
end)

-- VPN toggle failed (missing item)
RegisterNetEvent('fractal-laptop:client:vpnToggleFailed', function()
    if isLaptopOpen then
        SendNUIMessage({
            action = 'vpnToggleFailed'
        })
    end
end)

-- Update notes list
RegisterNetEvent('fractal-laptop:client:updateNotes', function(notes)
    if isLaptopOpen then
        SendNUIMessage({
            action = 'updateNotes',
            notes = notes
        })
    end
end)

-- Refresh crypto wallet
RegisterNetEvent('fractal-laptop:client:refreshWallet', function()
    if isLaptopOpen then
        SendNUIMessage({
            action = 'refreshWallet'
        })
    end
end)

-- ====================================
-- UTILITY FUNCTIONS
-- ====================================

function Notify(message, type)
    if Config.Framework == 'qb-core' then
        QBCore.Functions.Notify(message, type)
    elseif Config.Framework == 'esx' then
        ESX.ShowNotification(message)
    end
end

-- ====================================
-- CLEANUP
-- ====================================

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        if isLaptopOpen then
            CloseLaptop()
        end
    end
end)

-- Debug command (disabled in production)
if false then
    RegisterCommand('laptop', function()
        TriggerEvent('fractal-laptop:client:useLaptop')
    end, false)
end

