/* ====================================
   TASKBAR & START MENU
   ==================================== */

let startMenuOpen = false;

// ====================================
// START BUTTON
// ====================================

$('#start-btn').click(function() {
    toggleStartMenu();
});

function toggleStartMenu() {
    startMenuOpen = !startMenuOpen;
    
    if (startMenuOpen) {
        $('#start-menu').removeClass('hidden');
        $('#start-btn').addClass('active');
        generateStartMenuApps();
    } else {
        $('#start-menu').addClass('hidden');
        $('#start-btn').removeClass('active');
    }
}

// Close start menu when clicking outside
$(document).click(function(e) {
    if (!$(e.target).closest('#start-menu, #start-btn').length && startMenuOpen) {
        toggleStartMenu();
    }
});

// ====================================
// START MENU APPS
// ====================================

function generateStartMenuApps() {
    const $container = $('#start-menu-apps');
    $container.empty();
    
    // Get all available apps
    const allApps = [...laptopData.defaultApps, ...getInstalledApps()];
    
    allApps.forEach(app => {
        const $app = $(`
            <div class="start-menu-app" data-app-id="${app.id}">
                <div class="start-menu-app-icon" style="background-color: ${app.color || '#4285F4'};">
                    <i class="${app.icon}"></i>
                </div>
                <div class="start-menu-app-label">${app.name}</div>
            </div>
        `);
        
        $container.append($app);
    });
}

// Click app in start menu
$(document).on('click', '.start-menu-app', function() {
    const appId = $(this).data('app-id');
    openApp(appId);
    toggleStartMenu();
});

// ====================================
// APP SEARCH
// ====================================

$('#app-search').on('input', function() {
    const query = $(this).val().toLowerCase();
    
    $('.start-menu-app').each(function() {
        const appName = $(this).find('.start-menu-app-label').text().toLowerCase();
        
        if (appName.includes(query)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
});

// ====================================
// TASKBAR APPS
// ====================================

function addTaskbarApp(app) {
    // Check if already in taskbar
    if ($(`#taskbar-app-${app.id}`).length > 0) {
        return;
    }
    
    const $taskbarApp = $(`
        <div class="taskbar-app" id="taskbar-app-${app.id}" data-app-id="${app.id}">
            <div class="taskbar-app-icon">
                <i class="${app.icon}"></i>
            </div>
            <div class="taskbar-app-label">${app.name}</div>
        </div>
    `);
    
    $('#taskbar-apps').append($taskbarApp);
}

function removeTaskbarApp(appId) {
    $(`#taskbar-app-${appId}`).remove();
}

function setTaskbarAppActive(appId) {
    $('.taskbar-app').removeClass('active');
    $(`#taskbar-app-${appId}`).addClass('active');
}

// Click taskbar app
$(document).on('click', '.taskbar-app', function() {
    const appId = $(this).data('app-id');
    
    // If window exists, toggle minimize
    const $window = $(`#window-${appId}`);
    if ($window.length > 0) {
        if ($window.hasClass('minimized')) {
            restoreWindow(appId);
        } else if ($window.hasClass('active')) {
            minimizeWindow(appId);
        } else {
            focusWindow(appId);
        }
    }
});

// ====================================
// SYSTEM TRAY
// ====================================

// VPN Toggle
$('#vpn-indicator').click(function() {
    console.log('[Laptop-OS] VPN indicator clicked, refreshing status...');
    
    // Refresh VPN status from inventory
    $.post('https://fractal-laptop/refreshVPN', JSON.stringify({}));
    
    // Note: Server will send updateLaptopData event which will update everything
});

// USB Indicator removed - apps now automatically appear/disappear based on USB ownership

// Clock click - show calendar (future feature)
$('#clock').click(function() {
    // TODO: Show calendar/notifications popup
    showNotification('Calendar', 'Calendar feature coming soon!', 'info');
});

// ====================================
// TASKBAR NOTIFICATIONS
// ====================================

function showTaskbarNotification(appId) {
    const $app = $(`#taskbar-app-${appId}`);
    $app.addClass('notification');
    
    setTimeout(() => {
        $app.removeClass('notification');
    }, 500);
}

console.log('%c📊 Taskbar Module Loaded', 'color: #34A853; font-weight: bold;');

