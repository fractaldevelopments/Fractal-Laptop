/* ====================================
   DESKTOP INTERACTIONS
   ==================================== */

let selectedIcon = null;

// ====================================
// DESKTOP ICON EVENTS
// ====================================

$(document).on('click', '.desktop-icon', function(e) {
    e.stopPropagation();
    
    // Deselect all icons
    $('.desktop-icon').removeClass('selected');
    
    // Select this icon
    $(this).addClass('selected');
    selectedIcon = $(this).data('app-id');
});

// Double click to open app
$(document).on('dblclick', '.desktop-icon', function(e) {
    e.stopPropagation();
    e.preventDefault();
    const appId = $(this).data('app-id');
    console.log('[Laptop-OS] Double-clicked icon:', appId);
    openApp(appId);
});

// Click desktop to deselect
$('#desktop').click(function(e) {
    if (e.target === this) {
        $('.desktop-icon').removeClass('selected');
        selectedIcon = null;
    }
});

// ====================================
// OPEN APP
// ====================================

function openApp(appId) {
    console.log('[Laptop-OS] openApp called with:', appId);
    
    const app = findApp(appId);
    
    if (!app) {
        console.error('[Laptop-OS] App not found:', appId);
        console.log('[Laptop-OS] Available default apps:', laptopData.defaultApps);
        console.log('[Laptop-OS] Available USB apps:', laptopData.usbApps);
        showNotification('Error', `App "${appId}" not found.`, 'error');
        return;
    }
    
    console.log('[Laptop-OS] Found app:', app);
    
    // Check if requires VPN
    if (app.requiresVPN && !laptopData.vpnEnabled) {
        console.log('[Laptop-OS] App requires VPN but VPN is disabled');
        showNotification('VPN Required', 'This app requires a VPN connection.', 'error');
        return;
    }
    
    // Check if window already exists
    if ($(`#window-${appId}`).length > 0) {
        console.log('[Laptop-OS] Window already exists, focusing');
        focusWindow(appId);
        return;
    }
    
    // Notify server
    $.post('https://fractal-laptop/openApp', JSON.stringify({
        appId: appId
    }));
    
    console.log('[Laptop-OS] Creating window for:', app.name);
    
    // Create window
    createAppWindow(app);
    
    // Add to taskbar
    addTaskbarApp(app);
}

function findApp(appId) {
    // Search in default apps
    let app = laptopData.defaultApps.find(a => a.id === appId);
    
    // Search in available USB apps (dynamically based on USB ownership)
    if (!app && laptopData.availableUSBApps && laptopData.availableUSBApps.includes(appId)) {
        if (laptopData.usbApps && laptopData.usbApps[appId]) {
            app = laptopData.usbApps[appId];
        }
    }
    
    return app;
}

// ====================================
// DRAG AND DROP ICONS
// ====================================

let draggedIcon = null;
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
const DRAG_THRESHOLD = 5; // Pixels before drag starts

$(document).on('mousedown', '.desktop-icon', function(e) {
    if (e.which !== 1) return; // Only left click
    
    // Prepare for potential drag
    draggedIcon = $(this);
    isDragging = false;
    dragStartPos = { x: e.pageX, y: e.pageY };
    
    const offset = draggedIcon.offset();
    dragOffset = {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top
    };
});

$(document).on('mousemove', function(e) {
    if (!draggedIcon) return;
    
    // Only start dragging if mouse moved beyond threshold
    if (!isDragging) {
        const distance = Math.sqrt(
            Math.pow(e.pageX - dragStartPos.x, 2) + 
            Math.pow(e.pageY - dragStartPos.y, 2)
        );
        
        if (distance > DRAG_THRESHOLD) {
            isDragging = true;
            draggedIcon.css({
                'position': 'absolute',
                'z-index': 9999,
                'opacity': 0.8
            });
        } else {
            return; // Don't drag yet
        }
    }
    
    // Now actually drag
    draggedIcon.css({
        left: e.pageX - dragOffset.x,
        top: e.pageY - dragOffset.y
    });
});

$(document).on('mouseup', function(e) {
    if (!draggedIcon) return;
    
    // Only reset if we actually dragged
    if (isDragging) {
        draggedIcon.css({
            'position': 'relative',
            'left': '',
            'top': '',
            'opacity': 1,
            'z-index': ''
        });
    }
    
    draggedIcon = null;
    isDragging = false;
});

// ====================================
// KEYBOARD SHORTCUTS
// ====================================

$(document).keydown(function(e) {
    if (!isBootComplete) return;
    
    // Delete key - delete selected icon (if custom)
    if (e.key === 'Delete' && selectedIcon) {
        // TODO: Implement delete for custom shortcuts
    }
    
    // Enter key - open selected icon
    if (e.key === 'Enter' && selectedIcon) {
        openApp(selectedIcon);
    }
    
    // Arrow keys - navigate icons
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        navigateIcons(e.key);
        e.preventDefault();
    }
});

function navigateIcons(direction) {
    const $icons = $('.desktop-icon');
    const currentIndex = selectedIcon ? $icons.index($(`.desktop-icon[data-app-id="${selectedIcon}"]`)) : -1;
    
    let newIndex = currentIndex;
    const columns = Math.floor($('#desktop-icons').width() / 116); // Icon width + gap
    
    switch(direction) {
        case 'ArrowRight':
            newIndex = Math.min(currentIndex + 1, $icons.length - 1);
            break;
        case 'ArrowLeft':
            newIndex = Math.max(currentIndex - 1, 0);
            break;
        case 'ArrowDown':
            newIndex = Math.min(currentIndex + columns, $icons.length - 1);
            break;
        case 'ArrowUp':
            newIndex = Math.max(currentIndex - columns, 0);
            break;
    }
    
    if (newIndex !== currentIndex && newIndex >= 0) {
        $('.desktop-icon').removeClass('selected');
        const $newIcon = $icons.eq(newIndex);
        $newIcon.addClass('selected');
        selectedIcon = $newIcon.data('app-id');
    }
}

// ====================================
// NOTIFICATIONS
// ====================================

function showNotification(title, message, type = 'info') {
    const $notification = $(`
        <div class="notification notification-${type}">
            <div class="notification-header">
                <strong>${title}</strong>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-body">${message}</div>
        </div>
    `);
    
    $('body').append($notification);
    
    // Animate in
    setTimeout(() => {
        $notification.addClass('show');
    }, 10);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        dismissNotification($notification);
    }, 5000);
    
    // Close button
    $notification.find('.notification-close').click(() => {
        dismissNotification($notification);
    });
}

function dismissNotification($notification) {
    $notification.removeClass('show');
    setTimeout(() => {
        $notification.remove();
    }, 300);
}

// ====================================
// DESKTOP REFRESH
// ====================================

function refreshDesktop() {
    generateDesktopIcons();
    showNotification('Desktop Refreshed', 'Desktop icons have been updated.', 'success');
}

// Context menu refresh action
$(document).on('click', '[data-action="refresh"]', function() {
    refreshDesktop();
});

console.log('%c🖥️ Desktop Module Loaded', 'color: #4285F4; font-weight: bold;');

