/* ====================================
   WINDOW MANAGER
   ==================================== */

let activeWindow = null;
let zIndexCounter = 1000;
let windows = {};

// ====================================
// CREATE WINDOW
// ====================================

function createAppWindow(app) {
    const windowId = `window-${app.id}`;
    
    // Default window position and size
    const defaultWidth = 800;
    const defaultHeight = 600;
    const desktopWidth = $('.desktop').width();
    const desktopHeight = $('.desktop').height() - 60; // Minus taskbar
    
    const left = (desktopWidth - defaultWidth) / 2;
    const top = (desktopHeight - defaultHeight) / 2;
    
    // Create window element
    const $window = $(`
        <div class="window window-enter size-large active" id="${windowId}" data-app-id="${app.id}">
            <div class="window-header">
                <div class="window-title">
                    <div class="window-icon">
                        <i class="${app.icon}"></i>
                    </div>
                    <div class="window-label">${app.name}</div>
                </div>
                <div class="window-controls">
                    <div class="window-control-btn minimize">
                        <i class="fas fa-minus"></i>
                    </div>
                    <div class="window-control-btn maximize">
                        <i class="fas fa-square"></i>
                    </div>
                    <div class="window-control-btn close">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            </div>
            <div class="window-content" id="${windowId}-content">
                ${getAppContent(app)}
            </div>
        </div>
    `);
    
    // Set position and size
    $window.css({
        left: left + 'px',
        top: top + 'px',
        width: defaultWidth + 'px',
        height: defaultHeight + 'px',
        zIndex: ++zIndexCounter
    });
    
    // Add to container
    $('#windows-container').append($window);
    
    // Store window data
    windows[app.id] = {
        element: $window,
        app: app,
        minimized: false,
        maximized: false,
        position: { left, top },
        size: { width: defaultWidth, height: defaultHeight }
    };
    
    // Set as active
    focusWindow(app.id);
    
    // Initialize drag and resize
    initializeWindowDrag($window);
    initializeWindowResize($window);
    
    // App-specific initialization
    initializeApp(app.id);
}

// ====================================
// INITIALIZE APP-SPECIFIC FEATURES
// ====================================

function initializeApp(appId) {
    // Call app-specific initialization functions
    switch(appId) {
        case 'notes':
            // Load notes from database
            if (typeof loadNotes === 'function') {
                setTimeout(() => loadNotes(), 100);
            }
            break;
        case 'crypto_wallet':
            // Load wallet info
            if (typeof loadCryptoWallet === 'function') {
                setTimeout(() => loadCryptoWallet(), 100);
            }
            break;
        case 'mining_monitor':
            // Load mining monitor data
            if (typeof loadMiningMonitor === 'function') {
                setTimeout(() => loadMiningMonitor(), 100);
            }
            break;
        case 'crypto_wash':
            // Load crypto wash
            if (typeof loadCryptoWash === 'function') {
                setTimeout(() => loadCryptoWash(), 100);
            }
            break;
        case 'browser':
            // Initialize browser
            if (typeof loadBrowser === 'function') {
                setTimeout(() => loadBrowser(), 100);
            }
            break;
        case 'calculator':
            // Initialize calculator
            if (typeof initializeCalculator === 'function') {
                setTimeout(() => initializeCalculator(), 100);
            }
            break;
        case 'terminal':
            // Initialize terminal
            if (typeof initializeTerminal === 'function') {
                setTimeout(() => initializeTerminal(), 100);
            }
            break;
        case 'tor_browser':
            // Load unlocked .onion sites
            if (typeof loadUnlockedOnionSites === 'function') {
                setTimeout(() => loadUnlockedOnionSites(), 100);
            }
            break;
        default:
            // Clean up crypto wash if closing another app
            if (typeof cleanupCryptoWash === 'function' && appId !== 'crypto_wash') {
                cleanupCryptoWash();
            }
            break;
        // Add more app initializations here as needed
    }
}

// ====================================
// GET APP CONTENT
// ====================================

function getAppContent(app) {
    switch(app.id) {
        case 'browser':
            return getBrowserContent();
        case 'settings':
            return getSettingsContent();
        case 'file_manager':
            return getFileManagerContent();
        case 'notes':
            return getNotesContent();
        case 'calculator':
            return getCalculatorContent();
        case 'boss_menu':
            if (typeof loadBossMenu === 'function') {
                setTimeout(function() {
                    loadBossMenu(false); // Use cached data if available
                }, 100); // Load data after window opens
            }
            return getBossMenuContent();
        case 'tor_browser':
            return getTORBrowserContent();
        case 'terminal':
            return getTerminalContent();
        
        // USB Apps - Generic content for now
        case 'crypto_wallet':
            return getCryptoWalletContent();
        case 'mining_monitor':
            return getMiningMonitorContent();
        case 'crypto_wash':
            return getCryptoWashContent();
        case 'text_editor':
            return getTextEditorContent();
        case 'media_player':
            return getMediaPlayerContent();
            
        default:
            // Generic placeholder for other USB apps
            return `
                <div style="padding: 40px; text-align: center;">
                    <div style="width: 96px; height: 96px; margin: 0 auto 24px; background: ${app.color}; border-radius: 24px; display: flex; align-items: center; justify-content: center;">
                        <i class="${app.icon}" style="font-size: 48px; color: white;"></i>
                    </div>
                    <h2 style="color: var(--text-primary); margin-bottom: 12px;">${app.name}</h2>
                    <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 24px;">This app was installed from a USB drive and is ready to use.</p>
                    <div style="background: var(--glass-bg); border-radius: var(--radius-md); padding: 20px; max-width: 500px; margin: 0 auto;">
                        <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6;">
                            App functionality is currently under development. This placeholder confirms the app was successfully installed and can be opened.
                        </p>
                    </div>
                    ${app.requiresVPN ? '<p style="margin-top: 20px; color: var(--warning);"><i class="fas fa-shield-alt"></i> Requires VPN Connection</p>' : ''}
                </div>
            `;
    }
}

// USB App Content Functions
function getTerminalContent() {
    return `
        <div style="background: #1E1E1E; color: #00FF00; font-family: 'Courier New', monospace; height: 100%; padding: 20px;">
            <div style="margin-bottom: 10px;">InfernoOS Terminal v1.0</div>
            <div style="margin-bottom: 20px; color: #888;">Type 'help' for available commands</div>
            <div style="color: #00FF00;">$ <span style="border-right: 2px solid #00FF00; animation: blink 1s infinite;">_</span></div>
        </div>
    `;
}

function getCryptoWalletContent() {
    return `
        <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <i class="fas fa-wallet" style="font-size: 48px; color: #F7931A;"></i>
                <h2 style="margin-top: 16px; color: var(--text-primary);">Crypto Wallet</h2>
            </div>
            <div style="background: var(--glass-bg); border-radius: var(--radius-md); padding: 24px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-secondary);">Balance</span>
                    <strong style="font-size: 24px; color: var(--text-primary);">FBT 0.00</strong>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button class="btn" style="background: var(--success);">Receive</button>
                <button class="btn" style="background: var(--primary);">Send</button>
            </div>
        </div>
    `;
}

function getTextEditorContent() {
    return `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="padding: 12px; background: var(--glass-bg); border-bottom: 1px solid var(--glass-border); display: flex; gap: 8px;">
                <button class="btn-icon"><i class="fas fa-file"></i></button>
                <button class="btn-icon"><i class="fas fa-folder-open"></i></button>
                <button class="btn-icon"><i class="fas fa-save"></i></button>
            </div>
            <textarea style="flex: 1; border: none; padding: 20px; font-family: 'Courier New', monospace; font-size: 14px; resize: none; background: white; color: #1F2937;" placeholder="Start typing..."></textarea>
        </div>
    `;
}

function getMediaPlayerContent() {
    return `
        <div style="padding: 40px; text-align: center;">
            <i class="fas fa-play-circle" style="font-size: 120px; color: #9333EA; margin-bottom: 24px;"></i>
            <h2 style="color: var(--text-primary); margin-bottom: 16px;">Media Player</h2>
            <p style="color: var(--text-secondary); margin-bottom: 30px;">No media files loaded</p>
            <div style="display: flex; justify-content: center; gap: 16px;">
                <button class="btn-icon" style="width: 48px; height: 48px;"><i class="fas fa-backward"></i></button>
                <button class="btn-icon" style="width: 48px; height: 48px;"><i class="fas fa-play"></i></button>
                <button class="btn-icon" style="width: 48px; height: 48px;"><i class="fas fa-forward"></i></button>
            </div>
        </div>
    `;
}

// ====================================
// WINDOW CONTROLS
// ====================================

// Minimize
$(document).on('click', '.window-control-btn.minimize', function() {
    const $window = $(this).closest('.window');
    const appId = $window.data('app-id');
    minimizeWindow(appId);
});

// Maximize/Restore
$(document).on('click', '.window-control-btn.maximize', function() {
    const $window = $(this).closest('.window');
    const appId = $window.data('app-id');
    
    if (windows[appId].maximized) {
        restoreWindow(appId);
    } else {
        maximizeWindow(appId);
    }
});

// Close
$(document).on('click', '.window-control-btn.close', function() {
    const $window = $(this).closest('.window');
    const appId = $window.data('app-id');
    closeWindow(appId);
});

function minimizeWindow(appId) {
    const window = windows[appId];
    if (!window) return;
    
    window.element.addClass('minimized');
    window.minimized = true;
    setTaskbarAppActive(null);
}

function maximizeWindow(appId) {
    const window = windows[appId];
    if (!window) return;
    
    if (!window.maximized) {
        // Store current position and size
        window.position = {
            left: parseInt(window.element.css('left')),
            top: parseInt(window.element.css('top'))
        };
        window.size = {
            width: parseInt(window.element.css('width')),
            height: parseInt(window.element.css('height'))
        };
        
        window.element.addClass('maximized');
        window.maximized = true;
        window.element.find('.maximize i').removeClass('fa-square').addClass('fa-window-restore');
    }
}

function restoreWindow(appId) {
    const window = windows[appId];
    if (!window) return;
    
    if (window.minimized) {
        window.element.removeClass('minimized');
        window.minimized = false;
        focusWindow(appId);
    } else if (window.maximized) {
        window.element.removeClass('maximized');
        window.maximized = false;
        
        // Restore position and size
        window.element.css({
            left: window.position.left + 'px',
            top: window.position.top + 'px',
            width: window.size.width + 'px',
            height: window.size.height + 'px'
        });
        
        window.element.find('.maximize i').removeClass('fa-window-restore').addClass('fa-square');
    }
}

function closeWindow(appId) {
    const window = windows[appId];
    if (!window) return;
    
    // Clean up app-specific resources
    if (appId === 'crypto_wash' && typeof cleanupCryptoWash === 'function') {
        cleanupCryptoWash();
    }
    
    // Animate out
    window.element.addClass('window-exit');
    
    setTimeout(() => {
        window.element.remove();
        delete windows[appId];
        removeTaskbarApp(appId);
        
        // Focus another window if exists
        const remainingWindows = Object.keys(windows);
        if (remainingWindows.length > 0) {
            focusWindow(remainingWindows[remainingWindows.length - 1]);
        }
    }, 300);
}

function focusWindow(appId) {
    // Remove active from all windows
    $('.window').removeClass('active');
    
    // Set this window active
    const window = windows[appId];
    if (window) {
        window.element.addClass('active');
        window.element.css('zIndex', ++zIndexCounter);
        activeWindow = appId;
        setTaskbarAppActive(appId);
    }
}

// Click window to focus
$(document).on('mousedown', '.window', function() {
    const appId = $(this).data('app-id');
    focusWindow(appId);
});

// ====================================
// WINDOW DRAGGING
// ====================================

function initializeWindowDrag($window) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    $window.find('.window-header').on('mousedown', function(e) {
        if ($(e.target).closest('.window-controls').length > 0) return;
        
        const window = windows[$window.data('app-id')];
        if (window && window.maximized) return; // Can't drag maximized window
        
        isDragging = true;
        
        // Calculate offset from where we clicked on the window
        const windowRect = $window[0].getBoundingClientRect();
        
        dragOffset = {
            x: e.clientX - windowRect.left,
            y: e.clientY - windowRect.top
        };
        
        $window.css('transition', 'none');
        
        e.preventDefault();
    });
    
    $(document).on('mousemove', function(e) {
        if (!isDragging) return;
        
        const desktopRect = $('.desktop')[0].getBoundingClientRect();
        
        // Calculate new position relative to desktop
        let left = e.clientX - desktopRect.left - dragOffset.x;
        let top = e.clientY - desktopRect.top - dragOffset.y;
        
        // Keep window within desktop bounds
        const desktopWidth = desktopRect.width;
        const desktopHeight = desktopRect.height - 60; // Minus taskbar
        const windowWidth = $window.width();
        const windowHeight = $window.height();
        
        left = Math.max(0, Math.min(left, desktopWidth - windowWidth));
        top = Math.max(0, Math.min(top, desktopHeight - windowHeight));
        
        $window.css({
            left: left + 'px',
            top: top + 'px'
        });
    });
    
    $(document).on('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            $window.css('transition', '');
        }
    });
}

// ====================================
// WINDOW RESIZING
// ====================================

function initializeWindowResize($window) {
    // TODO: Add resize handles and logic
    // For now, windows can only be maximized/restored
}

console.log('%c🪟 Window Manager Loaded', 'color: #FBBC04; font-weight: bold;');

