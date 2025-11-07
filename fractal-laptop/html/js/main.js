/* ====================================
   LAPTOP OS - MAIN JAVASCRIPT
   ==================================== */

let laptopData = {
    settings: {},
    installedApps: [],
    vpnEnabled: false,
    defaultApps: [],
    usbApps: {},
    wallpapers: [],
    systemInfo: {}
};

let isBootComplete = false;

// ====================================
// NUI MESSAGE HANDLER
// ====================================

window.addEventListener('message', (event) => {
    const data = event.data;
    
    switch (data.action) {
        case 'openLaptop':
            openLaptop(data.data);
            break;
        case 'closeLaptop':
            closeLaptop();
            break;
        case 'updateData':
            updateLaptopData(data.data);
            break;
        case 'vpnToggleFailed':
            handleVPNToggleFailed();
            break;
        
        case 'updateNotes':
            handleUpdateNotes(data.notes);
            break;
        
        case 'refreshWallet':
            handleRefreshWallet();
            break;
        
        case 'bossMenuTransactionComplete':
            if (data.success) {
                showNotification('Success', data.message || 'Transaction completed', 'success');
                // Force refresh after successful transaction (cache cleared server-side)
                if (typeof loadBossMenu === 'function') {
                    setTimeout(function() {
                        loadBossMenu(true); // Force refresh
                    }, 500); // Small delay to ensure server cache is cleared
                }
            } else {
                showNotification('Error', data.message || 'Transaction failed', 'error');
            }
            break;
    }
});

// ====================================
// LAPTOP FUNCTIONS
// ====================================

function openLaptop(data) {
    laptopData = data;
    // Show container
    $('#laptop-container').removeClass('hidden');
    setTimeout(() => {
        $('#laptop-container').addClass('show');
    }, 50);
    
    // Show boot screen
    showBootScreen();
}

function closeLaptop() {
    $('#laptop-container').removeClass('show');
    setTimeout(() => {
        $('#laptop-container').addClass('hidden');
    }, 500);
    
    // Reset state
    isBootComplete = false;
    closeAllWindows();
}

function updateLaptopData(data) {
    laptopData = { ...laptopData, ...data };
    
    console.log('[Laptop-OS] Data updated, VPN status:', laptopData.vpnEnabled);
    
    // Update UI elements
    updateVPNIndicator();
    generateDesktopIcons(); // Regenerate icons to update USB apps dynamically
}

function handleVPNToggleFailed() {
    // VPN toggle failed, revert state
    laptopData.vpnEnabled = false;
    updateVPNIndicator();
    
    // If settings is open, update toggle
    if ($('#settings-vpn-toggle').length > 0) {
        $('#settings-vpn-toggle').prop('checked', false);
        loadSettingsTab('network');
    }
}

function handleUpdateNotes(notes) {
    // Update notes list in the Notes app if it's open
    if (typeof currentNotes !== 'undefined') {
        currentNotes = notes || [];
        if (typeof renderNotesList === 'function') {
            renderNotesList();
        }
    }
}

function handleRefreshWallet() {
    // Refresh crypto wallet if it's open
    if (typeof refreshCryptoWallet === 'function') {
        refreshCryptoWallet();
    }
}

// ====================================
// BOOT SCREEN
// ====================================

function showBootScreen() {
    $('#boot-screen').removeClass('hidden');
    
    // Simulate boot process
    setTimeout(() => {
        $('#boot-screen').addClass('hidden');
        initializeDesktop();
    }, 3000); // 3 second boot time
}

function initializeDesktop() {
    isBootComplete = true;
    
    // Set wallpaper
    setWallpaper(laptopData.settings.wallpaper || 1);
    
    // Apply dark mode if enabled
    if (laptopData.settings.darkMode) {
        $('body').addClass('dark-mode');
    } else {
        $('body').removeClass('dark-mode');
    }
    
    // Generate desktop icons
    generateDesktopIcons();
    
    // Update system indicators
    updateVPNIndicator();
    updateClock();
    
    // Set username
    $('#username').text(laptopData.settings.username || 'User');
    
    // Start clock
    setInterval(updateClock, 1000);
}

// ====================================
// WALLPAPER
// ====================================

function setWallpaper(wallpaperId) {
    const wallpaper = laptopData.wallpapers.find(w => w.id === wallpaperId);
    
    if (wallpaper) {
        $('#wallpaper').css({
            'background-image': `url('img/wallpapers/${wallpaper.file}')`,
            'background-size': 'cover',
            'background-position': 'center'
        });
    } else {
        // Default gradient
        $('#wallpaper').addClass('default');
    }
}

// ====================================
// DESKTOP ICONS
// ====================================

function generateDesktopIcons() {
    const $container = $('#desktop-icons');
    $container.empty();
    
    // Get all available apps (default apps + USB apps player has access to)
    const allApps = [...laptopData.defaultApps, ...getAvailableUSBApps()];
    
    allApps.forEach(app => {
        const $icon = $(`
            <div class="desktop-icon" data-app-id="${app.id}">
                <div class="desktop-icon-image" data-color="${app.color ? app.color.replace('#', '') : 'blue'}">
                    <i class="${app.icon}"></i>
                </div>
                <div class="desktop-icon-label">${app.name}</div>
            </div>
        `);
        
        // Add locked class if requires VPN and VPN is disabled
        if (app.requiresVPN && !laptopData.vpnEnabled) {
            $icon.addClass('locked');
        }
        
        $container.append($icon);
    });
}

function getAvailableUSBApps() {
    // Only show USB apps if player has the required USB item in inventory
    if (!laptopData.availableUSBApps || laptopData.availableUSBApps.length === 0) {
        return [];
    }
    
    const apps = [];
    for (const appId of laptopData.availableUSBApps) {
        if (laptopData.usbApps && laptopData.usbApps[appId]) {
            apps.push(laptopData.usbApps[appId]);
        }
    }
    
    return apps;
}

// Legacy function for backwards compatibility
function getInstalledApps() {
    return getAvailableUSBApps();
}

// ====================================
// SYSTEM INDICATORS
// ====================================

function updateVPNIndicator() {
    const $indicator = $('#vpn-indicator');
    
    if (laptopData.vpnEnabled) {
        $indicator.addClass('active');
        $indicator.attr('title', 'VPN: Connected');
    } else {
        $indicator.removeClass('active');
        $indicator.attr('title', 'VPN: Disabled');
    }
}

// USB Indicator removed - apps now automatically appear/disappear based on USB ownership

function updateClock() {
    const now = new Date();
    
    // Time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    $('#time').text(`${hours}:${minutes}`);
    
    // Date
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    $('#date').text(`${day}, ${month} ${date}`);
}

// ====================================
// EVENT LISTENERS
// ====================================

$(document).ready(() => {
    // Close laptop (ESC key)
    $(document).keyup((e) => {
        if (e.key === 'Escape' && isBootComplete) {
            $.post('https://fractal-laptop/closeLaptop');
        }
    });
    
    // Power button
    $('#power-btn, #start-power-btn').click(() => {
        $.post('https://fractal-laptop/closeLaptop');
    });
    
    // Prevent right-click default menu
    $('#desktop').contextmenu((e) => {
        e.preventDefault();
        showContextMenu(e.pageX, e.pageY);
    });
    
    // Hide context menu on click
    $(document).click(() => {
        $('#context-menu').addClass('hidden');
    });
});

// ====================================
// CONTEXT MENU
// ====================================

function showContextMenu(x, y) {
    const $menu = $('#context-menu');
    $menu.removeClass('hidden');
    $menu.css({
        left: x + 'px',
        top: y + 'px'
    });
}

// Context menu actions
$('#context-menu .context-menu-item').click(function() {
    const action = $(this).data('action');
    
    switch (action) {
        case 'refresh':
            generateDesktopIcons();
            break;
        case 'personalize':
            openSettingsApp('personalization');
            break;
        case 'display':
            openSettingsApp('display');
            break;
    }
    
    $('#context-menu').addClass('hidden');
});

// ====================================
// HELPER FUNCTIONS
// ====================================

function closeAllWindows() {
    $('.window').remove();
    $('#taskbar-apps').empty();
}

function openSettingsApp(tab) {
    // TODO: Implement settings app
    console.log('Opening settings:', tab);
}

// Debug
console.log('%c💻 Laptop OS Initialized', 'color: #0078D4; font-size: 16px; font-weight: bold;');

