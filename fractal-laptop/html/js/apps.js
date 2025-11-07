/* ====================================
   APPS CONTENT & FUNCTIONALITY
   ==================================== */

// ====================================
// BROWSER APP
// ====================================

function getBrowserContent() {
    return `
        <div class="app-browser">
            <div class="browser-toolbar">
                <div class="browser-nav">
                    <button class="btn-icon" id="browser-back" disabled>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="btn-icon" id="browser-forward" disabled>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="btn-icon" id="browser-refresh">
                        <i class="fas fa-sync"></i>
                    </button>
                </div>
                <div class="browser-addressbar">
                    <i class="fas fa-lock"></i>
                    <input type="text" id="browser-url" placeholder="Enter URL or search..." value="fractal://home">
                    <button class="btn-icon" id="browser-go">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="browser-actions">
                    <button class="btn-icon" title="Bookmarks">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="btn-icon" title="Menu">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            <div class="browser-content" id="browser-page">
                <div class="browser-homepage">
                    <h1>FractalOS Browser</h1>
                    <p>Browse the web securely ${laptopData.vpnEnabled ? 'with VPN protection' : '(VPN disabled)'}</p>
                    
                    <div class="browser-quick-links">
                        <h3>Quick Links</h3>
                        <div class="quick-links-grid">
                            <div class="quick-link" data-url="fractal://news">
                                <i class="fas fa-newspaper"></i>
                                <span>News</span>
                            </div>
                            <div class="quick-link" data-url="fractal://banking">
                                <i class="fas fa-university"></i>
                                <span>Banking</span>
                            </div>
                            <div class="quick-link" data-url="fractal://marketplace">
                                <i class="fas fa-shopping-cart"></i>
                                <span>Marketplace</span>
                            </div>
                            <div class="quick-link" data-url="fractal://jobs">
                                <i class="fas fa-briefcase"></i>
                                <span>Job Board</span>
                            </div>
                            <div class="quick-link ${!laptopData.vpnEnabled ? 'locked' : ''}" data-url="fractal://darkweb">
                                <i class="fas fa-mask"></i>
                                <span>Dark Web</span>
                            </div>
                            <div class="quick-link ${!laptopData.vpnEnabled ? 'locked' : ''}" data-url="fractal://crypto">
                                <i class="fas fa-bitcoin"></i>
                                <span>Crypto Exchange</span>
                            </div>
                            <div class="quick-link" data-url="fractal://directory">
                                <i class="fas fa-users"></i>
                                <span>Player Directory</span>
                            </div>
                            <div class="quick-link" data-url="fractal://map">
                                <i class="fas fa-map"></i>
                                <span>City Map</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Browser navigation
$(document).on('click', '.quick-link', function() {
    if ($(this).hasClass('locked')) {
        showNotification('VPN Required', 'This site requires a VPN connection.', 'error');
        return;
    }
    
    const url = $(this).data('url');
    navigateBrowser(url);
});

// Initialize browser when app loads
function loadBrowser() {
    initializeBrowser();
    loadBrowserPage('fractal://home');
    
    // Load data for homepage
    loadBrowserHomepageData();
    
    // Set up page-specific handlers
    setupBrowserPageHandlers();
}

function loadBrowserHomepageData() {
    // Load online player count and server time
    $.post('https://fractal-laptop/getBrowserStats', JSON.stringify({}), function(data) {
        if (data.success) {
            $('#browser-online-count').text(data.onlinePlayers || 0);
            updateServerTime();
            setInterval(updateServerTime, 1000);
        }
    });
}

function updateServerTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    $('#browser-server-time').text(timeStr);
}

function setupBrowserPageHandlers() {
    // Banking page - load balance when navigated to
    $(document).off('browser-navigate').on('browser-navigate', function(e, url) {
        if (url === 'fractal://banking') {
            setTimeout(() => loadBrowserBankingData(), 100);
        } else if (url === 'fractal://news') {
            setTimeout(() => loadBrowserNewsData(), 100);
        } else if (url === 'fractal://marketplace') {
            setTimeout(() => loadBrowserMarketplaceData(), 100);
        } else if (url === 'fractal://jobs') {
            setTimeout(() => loadBrowserJobsData(), 100);
        } else if (url === 'fractal://crypto') {
            setTimeout(() => loadBrowserCryptoData(), 100);
        }
    });
    
    // Directory search
    $(document).on('click', '#directory-search-btn', function() {
        const query = $('#directory-search').val();
        if (query) {
            searchPlayers(query);
        }
    });
    
    // Marketplace search
    $(document).on('click', '#marketplace-search-btn', function() {
        const query = $('#marketplace-search').val();
        loadBrowserMarketplaceData(query);
    });
    
    // Marketplace category filter
    $(document).on('click', '.category-btn', function() {
        $('.category-btn').removeClass('active');
        $(this).addClass('active');
        const category = $(this).data('category');
        loadBrowserMarketplaceData(null, category);
    });
    
    // Jobs filter
    $(document).on('change', '#jobs-filter-type', function() {
        const filter = $(this).val();
        loadBrowserJobsData(filter);
    });
}

function loadBrowserBankingData() {
    $.post('https://fractal-laptop/getBrowserBanking', JSON.stringify({}), function(data) {
        if (data.success) {
            $('#browser-bank-balance').text('$' + (data.bank + data.cash).toFixed(2));
            $('#browser-bank-amount').text('$' + data.bank.toFixed(2));
            $('#browser-cash-amount').text('$' + data.cash.toFixed(2));
            
            if (data.transactions && data.transactions.length > 0) {
                let html = '';
                data.transactions.forEach(tx => {
                    html += `
                        <div class="transaction-item">
                            <div class="transaction-info">
                                <span class="transaction-type ${tx.type}">${tx.type}</span>
                                <span class="transaction-desc">${tx.description || 'Transaction'}</span>
                            </div>
                            <div class="transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">
                                ${tx.amount >= 0 ? '+' : ''}$${Math.abs(tx.amount).toFixed(2)}
                            </div>
                            <div class="transaction-date">${tx.date || ''}</div>
                        </div>
                    `;
                });
                $('#browser-transactions').html(html);
            }
        }
    });
}

function loadBrowserNewsData() {
    $.post('https://fractal-laptop/getBrowserNews', JSON.stringify({}), function(data) {
        if (data.success && data.news && data.news.length > 0) {
            let html = '';
            data.news.forEach(article => {
                html += `
                    <div class="news-article">
                        <div class="news-header">
                            <h3>${article.title}</h3>
                            <span class="news-date">${article.date || ''}</span>
                        </div>
                        <div class="news-content">
                            <p>${article.content || ''}</p>
                        </div>
                    </div>
                `;
            });
            $('#browser-news-list').html(html);
        } else {
            $('#browser-news-list').html(`
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>No news articles available</p>
                </div>
            `);
        }
    });
}

function loadBrowserMarketplaceData(searchQuery = null, category = 'all') {
    $.post('https://fractal-laptop/getBrowserMarketplace', JSON.stringify({
        search: searchQuery,
        category: category
    }), function(data) {
        if (data.success && data.items && data.items.length > 0) {
            let html = '';
            data.items.forEach(item => {
                html += `
                    <div class="marketplace-item">
                        <div class="item-icon">
                            <i class="${item.icon || 'fas fa-box'}"></i>
                        </div>
                        <div class="item-info">
                            <h4>${item.label || item.name}</h4>
                            <p>${item.description || ''}</p>
                        </div>
                        <div class="item-price">
                            $${(item.price || 0).toFixed(2)}
                        </div>
                    </div>
                `;
            });
            $('#marketplace-items-list').html(html);
        } else {
            $('#marketplace-items-list').html(`
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No items found</p>
                </div>
            `);
        }
    });
}

function loadBrowserJobsData(filter = 'all') {
    $.post('https://fractal-laptop/getBrowserJobs', JSON.stringify({
        filter: filter
    }), function(data) {
        if (data.success && data.jobs && data.jobs.length > 0) {
            let html = '';
            data.jobs.forEach(job => {
                html += `
                    <div class="job-card">
                        <div class="job-header">
                            <h3>${job.name || job.label}</h3>
                            <span class="job-type">${job.type || 'Civilian'}</span>
                        </div>
                        <div class="job-description">
                            <p>${job.description || 'No description available'}</p>
                        </div>
                        <div class="job-requirements">
                            <span><i class="fas fa-user"></i> Grade: ${job.minGrade || 0}+</span>
                            <span><i class="fas fa-dollar-sign"></i> Salary: $${(job.salary || 0).toFixed(2)}/hr</span>
                        </div>
                        <button class="btn-apply-job" data-job="${job.name}">Apply</button>
                    </div>
                `;
            });
            $('#browser-jobs-list').html(html);
        } else {
            $('#browser-jobs-list').html(`
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <p>No jobs available</p>
                </div>
            `);
        }
    });
}

function loadBrowserCryptoData() {
    $.post('https://fractal-laptop/getBrowserCrypto', JSON.stringify({}), function(data) {
        if (data.success) {
            const price = data.price || 0;
            const change = data.change || 0;
            
            $('#browser-crypto-price').text('$' + price.toFixed(2));
            
            const changeElement = $('#browser-crypto-change');
            if (change >= 0) {
                changeElement.html(`<i class="fas fa-arrow-up"></i> +${change.toFixed(2)}%`);
                changeElement.css('color', '#10B981');
            } else {
                changeElement.html(`<i class="fas fa-arrow-down"></i> ${change.toFixed(2)}%`);
                changeElement.css('color', '#EF4444');
            }
            
            // Render chart if Chart.js is available
            if (typeof Chart !== 'undefined' && data.history) {
                renderCryptoChart(data.history);
            }
        }
    });
}

function renderCryptoChart(history) {
    const ctx = document.getElementById('browser-crypto-chart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map((_, i) => `T-${history.length - i}`),
            datasets: [{
                label: 'FBT Price',
                data: history,
                borderColor: '#F7931A',
                backgroundColor: 'rgba(247, 147, 26, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function searchPlayers(query) {
    $.post('https://fractal-laptop/searchPlayers', JSON.stringify({
        query: query
    }), function(data) {
        if (data.success && data.players && data.players.length > 0) {
            let html = '';
            data.players.forEach(player => {
                html += `
                    <div class="player-card">
                        <div class="player-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="player-info">
                            <h4>${player.name || 'Unknown'}</h4>
                            <p>Citizen ID: ${player.citizenid || 'N/A'}</p>
                            <p>Job: ${player.job || 'Unemployed'}</p>
                        </div>
                        <div class="player-status">
                            <span class="status-badge ${player.online ? 'online' : 'offline'}">
                                ${player.online ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                `;
            });
            $('#browser-directory-results').html(html);
        } else {
            $('#browser-directory-results').html(`
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No players found</p>
                </div>
            `);
        }
    });
}

// Browser history
let browserHistory = [];
let browserHistoryIndex = -1;

function navigateBrowser(url) {
    // Check VPN requirements (crypto exchange doesn't need VPN anymore)
    const vpnRequired = [].includes(url); // No browser pages require VPN
    if (vpnRequired && !laptopData.vpnEnabled) {
        showNotification('VPN Required', 'This site requires a VPN connection.', 'error');
        return;
    }
    
    // Add to history
    if (browserHistoryIndex < browserHistory.length - 1) {
        browserHistory = browserHistory.slice(0, browserHistoryIndex + 1);
    }
    browserHistory.push(url);
    browserHistoryIndex = browserHistory.length - 1;
    
    // Update URL bar
    $('#browser-url').val(url);
    
    // Update navigation buttons
    updateBrowserNavigation();
    
    // Load page content
    loadBrowserPage(url);
    
    // Trigger navigation event for page handlers
    $(document).trigger('browser-navigate', [url]);
}

function updateBrowserNavigation() {
    $('#browser-back').prop('disabled', browserHistoryIndex <= 0);
    $('#browser-forward').prop('disabled', browserHistoryIndex >= browserHistory.length - 1);
}

function loadBrowserPage(url) {
    let content = '';
    
    switch(url) {
        case 'fractal://home':
            content = getBrowserHomepage();
            break;
        case 'fractal://news':
            content = getBrowserNewsPage();
            break;
        case 'fractal://banking':
            content = getBrowserBankingPage();
            break;
        case 'fractal://marketplace':
            content = getBrowserMarketplacePage();
            break;
        case 'fractal://jobs':
            content = getBrowserJobsPage();
            break;
        case 'fractal://crypto':
            content = getBrowserCryptoPage();
            break;
        case 'fractal://directory':
            content = getBrowserDirectoryPage();
            break;
        default:
            content = `
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #F59E0B; margin-bottom: 20px;"></i>
                    <h2>Page Not Found</h2>
                    <p style="color: var(--text-secondary);">The page "${url}" could not be found.</p>
                    <button class="btn-primary" onclick="navigateBrowser('fractal://home')" style="margin-top: 20px;">Go Home</button>
                </div>
            `;
    }
    
    $('#browser-page').html(content);
}

// Browser navigation controls
$(document).on('click', '#browser-back', function() {
    if (browserHistoryIndex > 0) {
        browserHistoryIndex--;
        const url = browserHistory[browserHistoryIndex];
        $('#browser-url').val(url);
        loadBrowserPage(url);
        updateBrowserNavigation();
    }
});

$(document).on('click', '#browser-forward', function() {
    if (browserHistoryIndex < browserHistory.length - 1) {
        browserHistoryIndex++;
        const url = browserHistory[browserHistoryIndex];
        $('#browser-url').val(url);
        loadBrowserPage(url);
        updateBrowserNavigation();
    }
});

$(document).on('click', '#browser-refresh', function() {
    const currentUrl = $('#browser-url').val();
    loadBrowserPage(currentUrl);
});

$(document).on('click', '#browser-go', function() {
    const url = $('#browser-url').val();
    navigateBrowser(url);
});

$(document).on('keypress', '#browser-url', function(e) {
    if (e.which === 13) {
        const url = $('#browser-url').val();
        navigateBrowser(url);
    }
});

// Initialize browser on load
function initializeBrowser() {
    browserHistory = ['fractal://home'];
    browserHistoryIndex = 0;
    updateBrowserNavigation();
}

// ====================================
// BROWSER PAGE CONTENT FUNCTIONS
// ====================================

function getBrowserHomepage() {
    return `
        <div class="browser-page-home">
            <div class="browser-hero">
                <h1>Welcome to FractalOS Browser</h1>
                <p>Your gateway to the digital world</p>
            </div>
            
            <div class="browser-stats-grid">
                <div class="browser-stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-info">
                        <span class="stat-label">Online Players</span>
                        <span class="stat-value" id="browser-online-count">-</span>
                    </div>
                </div>
                <div class="browser-stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-info">
                        <span class="stat-label">Server Time</span>
                        <span class="stat-value" id="browser-server-time">-</span>
                    </div>
                </div>
                <div class="browser-stat-card">
                    <i class="fas fa-shield-alt"></i>
                    <div class="stat-info">
                        <span class="stat-label">VPN Status</span>
                        <span class="stat-value">${laptopData.vpnEnabled ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            </div>
            
            <div class="browser-quick-links">
                <h3>Quick Links</h3>
                <div class="quick-links-grid">
                    <div class="quick-link" data-url="fractal://news">
                        <i class="fas fa-newspaper"></i>
                        <span>News</span>
                    </div>
                    <div class="quick-link" data-url="fractal://banking">
                        <i class="fas fa-university"></i>
                        <span>Banking</span>
                    </div>
                    <div class="quick-link" data-url="fractal://marketplace">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Marketplace</span>
                    </div>
                    <div class="quick-link" data-url="fractal://jobs">
                        <i class="fas fa-briefcase"></i>
                        <span>Job Board</span>
                    </div>
                    <div class="quick-link" data-url="fractal://crypto">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Crypto Exchange</span>
                    </div>
                    <div class="quick-link" data-url="fractal://directory">
                        <i class="fas fa-users"></i>
                        <span>Player Directory</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBrowserNewsPage() {
    return `
        <div class="browser-page-news">
            <div class="browser-page-header">
                <h1><i class="fas fa-newspaper"></i> Server News</h1>
                <p>Stay updated with the latest server announcements</p>
            </div>
            
            <div class="news-container" id="browser-news-list">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading news...</p>
                </div>
            </div>
        </div>
    `;
}

function getBrowserBankingPage() {
    return `
        <div class="browser-page-banking">
            <div class="browser-page-header">
                <h1><i class="fas fa-university"></i> FractalRP Banking</h1>
                <p>Manage your finances securely</p>
            </div>
            
            <div class="banking-container">
                <div class="banking-balance-card">
                    <div class="balance-header">
                        <span>Total Balance</span>
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="balance-amount" id="browser-bank-balance">$0.00</div>
                    <div class="balance-breakdown">
                        <div class="balance-item">
                            <span>Bank:</span>
                            <span id="browser-bank-amount">$0.00</span>
                        </div>
                        <div class="balance-item">
                            <span>Cash:</span>
                            <span id="browser-cash-amount">$0.00</span>
                        </div>
                    </div>
                </div>
                
                <div class="banking-section">
                    <h3>Recent Transactions</h3>
                    <div class="transactions-list" id="browser-transactions">
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <p>No recent transactions</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBrowserMarketplacePage() {
    return `
        <div class="browser-page-marketplace">
            <div class="browser-page-header">
                <h1><i class="fas fa-shopping-cart"></i> Marketplace</h1>
                <p>Browse items and shops</p>
            </div>
            
            <div class="marketplace-container">
                <div class="marketplace-search">
                    <input type="text" id="marketplace-search" placeholder="Search items..." />
                    <button class="btn-primary" id="marketplace-search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                
                <div class="marketplace-categories">
                    <button class="category-btn active" data-category="all">All Items</button>
                    <button class="category-btn" data-category="weapons">Weapons</button>
                    <button class="category-btn" data-category="vehicles">Vehicles</button>
                    <button class="category-btn" data-category="tools">Tools</button>
                    <button class="category-btn" data-category="food">Food & Drinks</button>
                </div>
                
                <div class="marketplace-items" id="marketplace-items-list">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading marketplace...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBrowserJobsPage() {
    return `
        <div class="browser-page-jobs">
            <div class="browser-page-header">
                <h1><i class="fas fa-briefcase"></i> Job Board</h1>
                <p>Find your next opportunity</p>
            </div>
            
            <div class="jobs-container">
                <div class="jobs-filters">
                    <select id="jobs-filter-type">
                        <option value="all">All Jobs</option>
                        <option value="law">Law Enforcement</option>
                        <option value="medical">Medical</option>
                        <option value="civilian">Civilian</option>
                        <option value="criminal">Criminal</option>
                    </select>
                </div>
                
                <div class="jobs-list" id="browser-jobs-list">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading jobs...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBrowserDarkWebPage() {
    if (!laptopData.vpnEnabled) {
        return `
            <div class="browser-page-error">
                <i class="fas fa-shield-alt" style="font-size: 64px; color: #EF4444; margin-bottom: 20px;"></i>
                <h2>VPN Required</h2>
                <p>You must be connected to a VPN to access the Dark Web.</p>
            </div>
        `;
    }
    
    return `
        <div class="browser-page-darkweb">
            <div class="browser-page-header darkweb-header">
                <h1><i class="fas fa-mask"></i> Dark Web</h1>
                <p class="warning-text">⚠️ Accessing restricted content. Your connection is encrypted.</p>
            </div>
            
            <div class="darkweb-container">
                <div class="darkweb-services">
                    <div class="darkweb-service-card">
                        <i class="fas fa-user-secret"></i>
                        <h3>Hitman Services</h3>
                        <p>Professional elimination services</p>
                        <button class="btn-darkweb">View Services</button>
                    </div>
                    <div class="darkweb-service-card">
                        <i class="fas fa-key"></i>
                        <h3>Vehicle Cloning</h3>
                        <p>Duplicate vehicles with clean VINs</p>
                        <button class="btn-darkweb">Learn More</button>
                    </div>
                    <div class="darkweb-service-card">
                        <i class="fas fa-mask"></i>
                        <h3>Identity Theft</h3>
                        <p>New identities and documents</p>
                        <button class="btn-darkweb">Browse</button>
                    </div>
                    <div class="darkweb-service-card">
                        <i class="fas fa-skull"></i>
                        <h3>Black Market</h3>
                        <p>Illegal goods and services</p>
                        <button class="btn-darkweb">Enter Market</button>
                    </div>
                </div>
                
                <div class="darkweb-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>All transactions are anonymous. Use at your own risk.</p>
                </div>
            </div>
        </div>
    `;
}

function getBrowserCryptoPage() {
    return `
        <div class="browser-page-crypto">
            <div class="browser-page-header">
                <h1><i class="fas fa-exchange-alt"></i> Crypto Exchange</h1>
                <p>Trade cryptocurrencies securely</p>
            </div>
            
            <div class="crypto-container">
                <div class="crypto-price-card">
                    <div class="crypto-header">
                        <span>FractalBits (FBT)</span>
                        <span class="crypto-symbol">FBT</span>
                    </div>
                    <div class="crypto-price" id="browser-crypto-price">$0.00</div>
                    <div class="crypto-change" id="browser-crypto-change">
                        <i class="fas fa-arrow-up"></i> +0.00%
                    </div>
                </div>
                
                <div class="crypto-chart">
                    <canvas id="browser-crypto-chart"></canvas>
                </div>
                
                <div class="crypto-info-banner" style="margin-top: 20px; padding: 16px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-md); text-align: center;">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                        <i class="fas fa-info-circle"></i> Real-time cryptocurrency price tracker. Monitor FBT value and market trends.
                    </p>
                </div>
            </div>
        </div>
    `;
}

function getBrowserDirectoryPage() {
    return `
        <div class="browser-page-directory">
            <div class="browser-page-header">
                <h1><i class="fas fa-users"></i> Player Directory</h1>
                <p>Search and find players</p>
            </div>
            
            <div class="directory-container">
                <div class="directory-search">
                    <input type="text" id="directory-search" placeholder="Search by name or citizen ID..." />
                    <button class="btn-primary" id="directory-search-btn">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
                
                <div class="directory-results" id="browser-directory-results">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Search for a player to view their profile</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ====================================
// TERMINAL APP
// ====================================

function getTerminalContent() {
    return `
        <div class="terminal-container" style="height: 100%; background: #0a0a0a; color: #00ff00; font-family: 'Courier New', monospace; display: flex; flex-direction: column; padding: 0;">
            <div class="terminal-header" style="background: #1a1a1a; padding: 12px 20px; border-bottom: 2px solid #00ff00; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-terminal" style="color: #00ff00;"></i>
                    <span style="font-weight: bold;">FRACTAL TERMINAL</span>
                </div>
                <div style="font-size: 12px; opacity: 0.7;">v2.1.0</div>
            </div>
            
            <div class="terminal-output" id="terminal-output" style="flex: 1; overflow-y: auto; padding: 20px; font-size: 14px; line-height: 1.6;">
                <div class="terminal-line">${escapeHtml(laptopData.terminalHelp || 'Type "help" for available commands')}</div>
                <div class="terminal-line" style="margin-top: 12px;"><span style="color: #00ff00;">root@fractal:~$</span> <span class="terminal-cursor">_</span></div>
            </div>
            
            <div class="terminal-input-container" style="background: #1a1a1a; border-top: 2px solid #00ff00; padding: 12px 20px; display: flex; align-items: center; gap: 10px;">
                <span style="color: #00ff00; font-weight: bold;">root@fractal:~$</span>
                <input type="text" id="terminal-input" autocomplete="off" style="flex: 1; background: transparent; border: none; color: #00ff00; font-family: 'Courier New', monospace; font-size: 14px; outline: none;" placeholder="Enter command..." autofocus />
            </div>
        </div>
    `;
}

// Terminal command history
let terminalHistory = [];
let terminalHistoryIndex = -1;
let terminalCommandProgress = {}; // Track progress through command chains

// Initialize terminal
function initializeTerminal() {
    // Clear any existing handlers
    $(document).off('keydown', '#terminal-input');
    $(document).off('keyup', '#terminal-input');
    
    // Focus terminal input
    $('#terminal-input').focus();
    
    // Handle enter key
    $(document).on('keydown', '#terminal-input', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = $(this).val().trim();
            if (command) {
                executeTerminalCommand(command);
                $(this).val('');
                terminalHistory.push(command);
                terminalHistoryIndex = terminalHistory.length;
            }
        }
        // Arrow up/down for history
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (terminalHistoryIndex > 0) {
                terminalHistoryIndex--;
                $(this).val(terminalHistory[terminalHistoryIndex]);
            }
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (terminalHistoryIndex < terminalHistory.length - 1) {
                terminalHistoryIndex++;
                $(this).val(terminalHistory[terminalHistoryIndex]);
            } else {
                terminalHistoryIndex = terminalHistory.length;
                $(this).val('');
            }
        }
    });
    
    // Auto-scroll to bottom
    $(document).on('DOMNodeInserted', '#terminal-output', function() {
        $(this).scrollTop($(this)[0].scrollHeight);
    });
}

// Execute terminal command
function executeTerminalCommand(command) {
    // Add command to output
    addTerminalLine(`<span style="color: #00ff00;">root@fractal:~$</span> ${escapeHtml(command)}`, false);
    
    // Built-in commands
    if (command === 'help') {
        addTerminalLine(laptopData.terminalHelp || Config.TerminalHelp, true);
        return;
    }
    
    if (command === 'clear') {
        $('#terminal-output').html('');
        addTerminalLine('<span style="color: #00ff00;">root@fractal:~$</span> <span class="terminal-cursor">_</span>', false);
        return;
    }
    
    // Send to server to check against .onion site commands
    $.post('https://fractal-laptop/executeTerminalCommand', JSON.stringify({
        command: command,
        progress: terminalCommandProgress
    }), function(response) {
        if (response.success) {
            addTerminalLine(response.output, true);
            
            // Special: Direct TOR Browser open command
            if (response.openTorBrowser === true) {
                console.log('[Terminal] Opening TOR Browser via direct command');
                setTimeout(() => {
                    const torApp = {
                        id: 'tor_browser',
                        name: 'TOR Browser',
                        icon: 'fas fa-user-secret',
                        color: '#7C3AED',
                        requiresVPN: true
                    };
                    
                    if (!windows['tor_browser']) {
                        createAppWindow(torApp);
                    } else {
                        focusWindow('tor_browser');
                    }
                }, 500);
                return;
            }
            
            // Update progress if command was recognized
            if (response.siteId) {
                terminalCommandProgress[response.siteId] = response.commandIndex;
                
                // ALWAYS open TOR Browser when ANY keyword is revealed (for ALL .onion sites)
                if (response.keywordRevealed === true) {
                    console.log('[Terminal] Keyword revealed for site ID:', response.siteId);
                    showNotification('Keyword Discovered!', `Opening TOR Browser...`, 'success');
                    
                    // Wait a moment then FORCE open/focus TOR Browser
                    setTimeout(() => {
                        const torApp = {
                            id: 'tor_browser',
                            name: 'TOR Browser',
                            icon: 'fas fa-user-secret',
                            color: '#7C3AED',
                            requiresVPN: true  // VPN required for TOR Browser
                        };
                        
                        // Always attempt to open TOR Browser (creates new window or focuses existing)
                        if (!windows['tor_browser']) {
                            console.log('[Terminal] Creating new TOR Browser window');
                            createAppWindow(torApp);
                        } else {
                            console.log('[Terminal] Focusing existing TOR Browser window');
                            focusWindow('tor_browser');
                            // Also refresh the unlocked sites list
                            if (typeof loadUnlockedOnionSites === 'function') {
                                loadUnlockedOnionSites();
                            }
                        }
                    }, 800);
                }
            }
        } else {
            addTerminalLine(`bash: ${escapeHtml(command)}: command not found\nType 'help' for available commands`, true);
        }
    });
}

// Add line to terminal output
function addTerminalLine(text, isResponse) {
    const $output = $('#terminal-output');
    
    // Remove cursor from last line
    $('.terminal-cursor').remove();
    
    // Add new line
    const lineClass = isResponse ? 'terminal-response' : 'terminal-command';
    $output.append(`<div class="terminal-line ${lineClass}" style="margin-bottom: ${isResponse ? '12px' : '4px'};">${text}</div>`);
    
    // Add cursor to new line
    if (!isResponse) {
        $output.append(`<div class="terminal-line"><span style="color: #00ff00;">root@fractal:~$</span> <span class="terminal-cursor">_</span></div>`);
    }
    
    // Auto-scroll
    $output.scrollTop($output[0].scrollHeight);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================================
// TOR BROWSER APP
// ====================================

function getTORBrowserContent() {
    if (!laptopData.vpnEnabled) {
        return `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; padding: 40px;">
                <div style="text-align: center;">
                    <i class="fas fa-shield-alt" style="font-size: 64px; color: #EF4444; margin-bottom: 20px;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 12px;">VPN Required</h2>
                    <p style="color: var(--text-secondary); max-width: 400px;">You must be connected to a VPN to access the TOR Browser.</p>
                    <p style="color: var(--text-secondary); margin-top: 8px; font-size: 14px;">Enable VPN in Settings to use this app.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="tor-browser-container" style="height: 100%; display: flex; flex-direction: column;">
            <div class="tor-browser-header" style="background: linear-gradient(135deg, #7C3AED, #5B21B6); padding: 20px; color: white;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-user-secret" style="font-size: 32px;"></i>
                    <div>
                        <h2 style="margin: 0; font-size: 24px;">TOR Browser</h2>
                        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">🔒 Anonymous Browsing via VPN</p>
                    </div>
                </div>
            </div>
            
            <div class="tor-browser-content" style="flex: 1; padding: 24px; background: var(--background); overflow-y: auto;">
                <div class="tor-connection-status" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-shield-alt" style="font-size: 24px; color: #10B981;"></i>
                        <div>
                            <h3 style="margin: 0; color: var(--text-primary); font-size: 16px;">Connection Secured</h3>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 13px;">Your connection is encrypted and anonymized</p>
                        </div>
                    </div>
                </div>
                
                <div class="tor-warning-banner" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; gap: 12px;">
                        <i class="fas fa-exclamation-triangle" style="color: #EF4444; font-size: 20px;"></i>
                        <div>
                            <h4 style="margin: 0 0 8px 0; color: #EF4444; font-size: 14px;">Warning: Restricted Content</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 13px;">Accessing TOR hidden services may be illegal in your jurisdiction. All activity is monitored and logged.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Unlock Hidden Services Section -->
                <div class="tor-unlock-section" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <i class="fas fa-key" style="font-size: 24px; color: #F59E0B;"></i>
                        <div>
                            <h3 style="margin: 0; color: var(--text-primary); font-size: 18px;">Unlock Hidden Services</h3>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 13px;">Use keywords obtained from Terminal to access .onion sites</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="tor-keyword-input" placeholder="Enter access keyword..." style="flex: 1; padding: 12px 16px; border: 1px solid var(--glass-border); border-radius: var(--radius-md); background: #1a1a1a; color: #00ff00; font-family: 'Courier New', monospace; font-size: 14px; outline: none;" />
                        <button id="btn-unlock-onion" style="padding: 12px 24px; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap;">
                            <i class="fas fa-unlock"></i> Unlock Site
                        </button>
                    </div>
                </div>
                
                <!-- Unlocked .onion Sites -->
                <div id="unlocked-onion-sites-container" style="margin-bottom: 24px;">
                    <!-- Will be populated with unlocked sites discovered via Terminal -->
                </div>
                
                <div class="tor-footer" style="margin-top: 24px; padding: 16px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-md);">
                    <p style="margin: 0; color: var(--text-secondary); font-size: 12px; text-align: center;">
                        <i class="fas fa-info-circle"></i> All TOR traffic is routed through multiple encrypted nodes. Your real IP address is hidden.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// TOR Browser - Load unlocked sites when opened
function loadUnlockedOnionSites() {
    $.post('https://fractal-laptop/getUnlockedOnionSites', JSON.stringify({}), function(response) {
        if (response.success && response.sites && response.sites.length > 0) {
            let sitesHTML = '<h3 style="color: var(--text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;"><i class="fas fa-lock-open" style="color: #10B981; margin-right: 8px;"></i>Unlocked Hidden Services</h3>';
            sitesHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">';
            
            response.sites.forEach(site => {
                sitesHTML += `
                    <div class="unlocked-onion-site" data-site-id="${site.id}" style="background: linear-gradient(135deg, ${site.color}22, ${site.color}11); border: 2px solid ${site.color}; border-radius: var(--radius-md); padding: 20px; cursor: pointer; transition: all 0.3s;">
                        <div style="width: 48px; height: 48px; background: ${site.color}; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                            <i class="fas ${site.icon}" style="font-size: 24px; color: white;"></i>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 16px; font-weight: 600;">${site.name}</h4>
                        <p style="margin: 0 0 12px 0; color: var(--text-secondary); font-size: 12px; font-family: 'Courier New', monospace;">${site.url}</p>
                        <p style="margin: 0 0 16px 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5;">${site.description}</p>
                        <button class="btn-visit-onion" data-site-id="${site.id}" style="width: 100%; padding: 10px; background: ${site.color}; color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; font-weight: 600;">
                            <i class="fas fa-external-link-alt"></i> Visit Site
                        </button>
                    </div>
                `;
            });
            
            sitesHTML += '</div>';
            $('#unlocked-onion-sites-container').html(sitesHTML);
        } else {
            $('#unlocked-onion-sites-container').html(`
                <div style="text-align: center; padding: 40px 20px; background: var(--glass-bg); border: 1px dashed var(--glass-border); border-radius: var(--radius-md); margin-bottom: 24px;">
                    <i class="fas fa-lock" style="font-size: 48px; color: var(--text-secondary); opacity: 0.5; margin-bottom: 16px;"></i>
                    <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">No Sites Unlocked</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 13px;">Use Terminal to discover keywords and unlock .onion sites</p>
                </div>
            `);
        }
    });
}

// Unlock .onion site with keyword
$(document).on('click', '#btn-unlock-onion', function() {
    const keyword = $('#tor-keyword-input').val().trim();
    
    if (!keyword) {
        showNotification('Error', 'Please enter a keyword', 'error');
        return;
    }
    
    $.post('https://fractal-laptop/unlockOnionSite', JSON.stringify({
        keyword: keyword
    }), function(response) {
        if (response.success) {
            showNotification('Site Unlocked!', `Access granted to ${response.siteName}`, 'success');
            $('#tor-keyword-input').val('');
            // Reload unlocked sites
            setTimeout(() => loadUnlockedOnionSites(), 500);
        } else {
            showNotification('Invalid Keyword', response.error || 'Keyword not recognized', 'error');
        }
    });
});

// Visit unlocked .onion site
$(document).on('click', '.btn-visit-onion', function() {
    const siteId = parseInt($(this).data('site-id'));
    
    // Site ID 1 = Silk Road marketplace
    if (siteId === 1) {
        openSilkRoadMarketplace();
    } 
    // Site ID 2 = BlackHat Forums
    else if (siteId === 2) {
        openBlackHatForums();
    }
    // Future sites
    else {
        showNotification('Coming Soon', 'This .onion site functionality will be added soon!', 'info');
    }
    
    // Notify server
    $.post('https://fractal-laptop/visitOnionSite', JSON.stringify({
        siteId: siteId
    }));
});

// Open Silk Road Marketplace
function openSilkRoadMarketplace() {
    // Get marketplace data from server
    $.post('https://fractal-laptop/getSilkRoadData', JSON.stringify({}), function(response) {
        if (response.success) {
            showSilkRoadUI(response.data);
        } else {
            showNotification('Error', response.error || 'Failed to load marketplace', 'error');
        }
    });
}

function showSilkRoadUI(data) {
    const products = data.products || [];
    const categories = data.categories || [];
    const paymentMethods = data.paymentMethods || {};
    const playerBalance = data.playerBalance || {blackMoney: 0, crypto: 0};
    
    // Calculate category counts
    const categoryCounts = {};
    products.forEach(p => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    
    // Build categories sidebar
    let categoriesHTML = '<div style="background: #2a2a2a; padding: 12px; border-bottom: 1px solid #444;"><h3 style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">Shop by Category</h3></div>';
    categoriesHTML += '<div style="padding: 8px;">';
    categoriesHTML += `<button class="silk-category-btn active" data-category="all" style="width: 100%; text-align: left; padding: 10px 12px; background: transparent; border: none; color: #ccc; cursor: pointer; font-size: 13px; transition: all 0.3s; border-radius: 4px; margin-bottom: 4px;"><i class="fas fa-th" style="margin-right: 8px; width: 16px;"></i>All Products <span style="float: right; opacity: 0.7;">(${products.length})</span></button>`;
    
    categories.forEach(cat => {
        const count = categoryCounts[cat.id] || 0;
        categoriesHTML += `
            <button class="silk-category-btn" data-category="${cat.id}" style="width: 100%; text-align: left; padding: 10px 12px; background: transparent; border: none; color: #ccc; cursor: pointer; font-size: 13px; transition: all 0.3s; border-radius: 4px; margin-bottom: 4px;">
                <i class="fas ${cat.icon}" style="margin-right: 8px; width: 16px;"></i>${cat.name} <span style="float: right; opacity: 0.7;">(${count})</span>
            </button>
        `;
    });
    categoriesHTML += '</div>';
    
    // Build products grid
    let productsHTML = '';
    products.forEach(product => {
        const isOutOfStock = product.currentStock !== undefined && product.currentStock <= 0;
        productsHTML += `
            <div class="silk-product-card" data-category="${product.category}" data-product-id="${product.id}" style="background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; transition: all 0.3s; ${isOutOfStock ? 'opacity: 0.6;' : ''}">
                ${product.image ? `
                    <div class="product-image" style="width: 100%; height: 180px; background: url('${product.image}') center/cover; position: relative;">
                        ${isOutOfStock ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(239,68,68,0.9); color: white; padding: 8px 16px; border-radius: 4px; font-weight: 600;">OUT OF STOCK</div>' : ''}
                    </div>
                ` : `
                    <div style="width: 100%; height: 180px; background: linear-gradient(135deg, #333, #555); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-box" style="font-size: 48px; color: rgba(255,255,255,0.2);"></i>
                    </div>
                `}
                
                <div style="padding: 16px;">
                    <h4 style="margin: 0 0 8px 0; color: #333; font-size: 15px; font-weight: 600; line-height: 1.3;">${product.name}</h4>
                    <p style="margin: 0 0 12px 0; color: #666; font-size: 13px; line-height: 1.5; min-height: 40px;">${product.description}</p>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            ${paymentMethods.blackMoney ? `<div style="color: #333; font-size: 16px; font-weight: 700;">$${product.price.toLocaleString()}</div>` : ''}
                            ${paymentMethods.crypto ? `<div style="color: #F7931A; font-size: 13px; margin-top: 4px;">${product.cryptoPrice} FBT</div>` : ''}
                        </div>
                        ${product.stockLimit > 0 && product.currentStock !== undefined ? `<div style="font-size: 12px; color: #666;">Stock: ${product.currentStock}/${product.stockLimit}</div>` : ''}
                    </div>
                    
                    <button class="btn-buy-silk-product" data-product-id="${product.id}" ${isOutOfStock ? 'disabled' : ''} style="width: 100%; padding: 10px; background: ${isOutOfStock ? '#ccc' : '#10B981'}; color: white; border: none; border-radius: 6px; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'}; font-size: 14px; font-weight: 600; transition: all 0.3s;">
                        <i class="fas ${isOutOfStock ? 'fa-ban' : 'fa-shopping-cart'}"></i> ${isOutOfStock ? 'Out of Stock' : 'Purchase'}
                    </button>
                </div>
            </div>
        `;
    });
    
    const modalHTML = `
        <div id="silk-road-modal">
            <div class="silk-road-container">
                <!-- Header -->
                <div class="silk-road-header">
                    <div style="max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="fas fa-shopping-bag" style="font-size: 32px; color: #10B981;"></i>
                                <div>
                                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Silk Road</h1>
                                    <p style="margin: 0; font-size: 13px;">anonymous market</p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 24px;">
                            <div style="font-size: 13px;">
                                ${paymentMethods.blackMoney ? `<div>Balance: <span style="font-weight: 600;">$${playerBalance.blackMoney.toLocaleString()}</span></div>` : ''}
                                ${paymentMethods.crypto ? `<div>FBT: <span style="color: #F7931A; font-weight: 600;">${playerBalance.crypto.toFixed(4)}</span></div>` : ''}
                            </div>
                            <button id="close-silk-road" style="width: 36px; height: 36px; border: 1px solid; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                <i class="fas fa-times" style="font-size: 18px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div style="max-width: 1400px; margin: 24px auto; display: flex; gap: 24px; padding: 0 40px;">
                    <!-- Sidebar Categories -->
                    <div class="silk-sidebar">
                        ${categoriesHTML}
                    </div>
                    
                    <!-- Products Grid -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="margin-bottom: 20px; display: flex; gap: 12px;">
                            <input type="text" id="silk-search" placeholder="Search products..." style="flex: 1; padding: 12px 16px; border: 1px solid; border-radius: 6px; font-size: 14px; outline: none;" />
                            <button id="btn-silk-search" style="padding: 12px 24px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-search"></i> Search
                            </button>
                        </div>
                        
                        <div id="silk-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                            ${productsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHTML);
    
    // Close modal
    $('#close-silk-road').on('click', function() {
        $('#silk-road-modal').remove();
    });
    
    // Category filtering
    $(document).on('click', '.silk-category-btn', function() {
        const category = $(this).data('category');
        
        $('.silk-category-btn').removeClass('active').css('background', 'transparent');
        $(this).addClass('active').css('background', '#333');
        
        if (category === 'all') {
            $('.silk-product-card').show();
        } else {
            $('.silk-product-card').hide();
            $(`.silk-product-card[data-category="${category}"]`).show();
        }
    });
    
    // Search functionality
    $('#btn-silk-search, #silk-search').on('keypress click', function(e) {
        if (e.type === 'click' || e.key === 'Enter') {
            const query = $('#silk-search').val().toLowerCase();
            
            $('.silk-product-card').each(function() {
                const productName = $(this).find('h4').text().toLowerCase();
                const productDesc = $(this).find('p').text().toLowerCase();
                
                if (productName.includes(query) || productDesc.includes(query) || query === '') {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }
    });
    
    // Purchase product
    $(document).on('click', '.btn-buy-silk-product', function() {
        if ($(this).attr('disabled')) return;
        
        const productId = parseInt($(this).data('product-id'));
        showSilkRoadPurchaseModal(productId, products.find(p => p.id === productId), paymentMethods);
    });
}

// Show purchase modal for Silk Road
function showSilkRoadPurchaseModal(productId, product, paymentMethods) {
    if (!product) {
        showNotification('Error', 'Product not found', 'error');
        return;
    }
    
    let paymentOptions = '';
    
    if (paymentMethods.blackMoney) {
        paymentOptions += `
            <label style="display: block; padding: 16px; background: #f9f9f9; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s; margin-bottom: 12px;">
                <input type="radio" name="payment-method" value="blackmoney" checked style="margin-right: 10px;">
                <span style="font-weight: 600; color: #333;">Black Money</span>
                <span style="float: right; color: #10B981; font-weight: 700;">$${product.price.toLocaleString()}</span>
            </label>
        `;
    }
    
    if (paymentMethods.crypto) {
        paymentOptions += `
            <label style="display: block; padding: 16px; background: #f9f9f9; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s;">
                <input type="radio" name="payment-method" value="crypto" style="margin-right: 10px;">
                <span style="font-weight: 600; color: #333;">FBT Crypto</span>
                <span style="float: right; color: #F7931A; font-weight: 700;">${product.cryptoPrice} FBT</span>
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    <i class="fas fa-info-circle"></i> Requires Crypto USB Ledger in inventory
                </div>
            </label>
        `;
    }
    
    const purchaseModalHTML = `
        <div id="silk-purchase-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: #fff; border-radius: 12px; max-width: 500px; width: 100%; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <div style="padding: 24px; border-bottom: 1px solid #ddd;">
                    <h2 style="margin: 0; color: #333; font-size: 22px; font-weight: 700;">Confirm Purchase</h2>
                </div>
                
                <div style="padding: 24px;">
                    <div style="margin-bottom: 20px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
                        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: 600;">${product.name}</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;">${product.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: 600;">Select Payment Method:</h4>
                        ${paymentOptions}
                    </div>
                    
                    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #EF4444; font-size: 12px;">
                            <i class="fas fa-exclamation-triangle"></i> <strong>Warning:</strong> All purchases are final. Items will be delivered to your inventory.
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button id="cancel-silk-purchase" style="flex: 1; padding: 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; color: #666; cursor: pointer; font-size: 14px; font-weight: 600;">
                            Cancel
                        </button>
                        <button id="confirm-silk-purchase" data-product-id="${productId}" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
                            <i class="fas fa-check"></i> Confirm Purchase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(purchaseModalHTML);
    
    // Close modal
    $('#cancel-silk-purchase').on('click', function() {
        $('#silk-purchase-modal').remove();
    });
    
    // Confirm purchase
    $('#confirm-silk-purchase').on('click', function() {
        const productId = parseInt($(this).data('product-id'));
        const paymentMethod = $('input[name="payment-method"]:checked').val();
        
        if (!paymentMethod) {
            showNotification('Error', 'Please select a payment method', 'error');
            return;
        }
        
        // Disable button to prevent double-purchase
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Processing...');
        
        $.post('https://fractal-laptop/purchaseSilkRoadProduct', JSON.stringify({
            productId: productId,
            paymentMethod: paymentMethod
        }), function(response) {
            $('#silk-purchase-modal').remove();
            
            if (response.success) {
                showNotification('Purchase Complete', response.message || 'Item delivered to your inventory!', 'success');
                // Reload marketplace to update stock
                setTimeout(() => {
                    $('#silk-road-modal').remove();
                    openSilkRoadMarketplace();
                }, 1000);
            } else {
                showNotification('Purchase Failed', response.error || 'Transaction declined', 'error');
            }
        });
    });
}

// ====================================
// BLACKHAT FORUMS (.ONION SITE)
// ====================================

// Open BlackHat Forums
function openBlackHatForums() {
    $.post('https://fractal-laptop/getForumPosts', JSON.stringify({}), function(response) {
        if (response.success) {
            showBlackHatForumsUI(response.posts || []);
        } else {
            showNotification('Error', 'Failed to load forums', 'error');
        }
    });
}

function showBlackHatForumsUI(posts) {
    const categories = [
        {id: 'general', name: 'General', icon: 'fa-comments', color: '#7C3AED'},
        {id: 'exploits', name: 'Exploits', icon: 'fa-bug', color: '#EF4444'},
        {id: 'tutorials', name: 'Tutorials', icon: 'fa-graduation-cap', color: '#10B981'},
        {id: 'tools', name: 'Tools', icon: 'fa-wrench', color: '#F59E0B'},
        {id: 'marketplace', name: 'Marketplace', icon: 'fa-store', color: '#EC4899'}
    ];
    
    let postsHTML = '';
    posts.forEach(post => {
        const timeAgo = getTimeAgo(post.created_at);
        postsHTML += `
            <div class="forum-post-card" data-post-id="${post.id}" style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s;">
                <div style="display: flex; gap: 16px;">
                    <!-- Upvote Section -->
                    <div style="display: flex; flex-direction: column; align-items: center; min-width: 40px;">
                        <i class="fas fa-chevron-up" style="color: #666; font-size: 18px; margin-bottom: 6px;"></i>
                        <span style="color: #F59E0B; font-weight: 700; font-size: 14px;">${post.upvotes}</span>
                        <i class="fas fa-chevron-down" style="color: #666; font-size: 18px; margin-top: 6px;"></i>
                    </div>
                    
                    <!-- Post Content -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                            <span class="forum-category-badge" style="background: #333; color: #F59E0B; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${post.category}</span>
                            <span style="color: #666; font-size: 12px;">Posted by <span style="color: #7C3AED; font-weight: 600;">${post.author_alias}</span></span>
                            <span style="color: #666; font-size: 12px;">•</span>
                            <span style="color: #666; font-size: 12px;">${timeAgo}</span>
                        </div>
                        
                        <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 16px; font-weight: 600; line-height: 1.4;">${escapeHtml(post.title)}</h3>
                        <p style="margin: 0 0 12px 0; color: #aaa; font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(post.content)}</p>
                        
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <button class="btn-view-post" data-post-id="${post.id}" style="color: #666; font-size: 13px; background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: all 0.3s;">
                                <i class="fas fa-comment"></i> ${post.comment_count || 0} Comments
                            </button>
                            <button style="color: #666; font-size: 13px; background: none; border: none; cursor: pointer; padding: 4px 8px;">
                                <i class="fas fa-share"></i> Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (posts.length === 0) {
        postsHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #1a1a1a; border: 1px dashed #333; border-radius: 8px;">
                <i class="fas fa-comments" style="font-size: 48px; color: #333; margin-bottom: 16px;"></i>
                <h4 style="margin: 0 0 8px 0; color: #aaa;">No Posts Yet</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">Be the first to create a post!</p>
            </div>
        `;
    }
    
    const modalHTML = `
        <div id="blackhat-forum-modal">
            <div class="blackhat-container">
                <!-- Header -->
                <div class="blackhat-header">
                    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <i class="fas fa-user-secret" style="font-size: 32px; color: #7C3AED;"></i>
                            <div>
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">BlackHat Forums</h1>
                                <p style="margin: 0; font-size: 12px;">blackhat456xyz.onion</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <button id="btn-create-forum-post" style="padding: 10px 20px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                                <i class="fas fa-plus"></i> Create Post
                            </button>
                            <button id="close-blackhat-forum" style="width: 36px; height: 36px; border: 1px solid #333; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666;">
                                <i class="fas fa-times" style="font-size: 18px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div style="max-width: 1200px; margin: 24px auto; padding: 0 40px;">
                    <!-- Category Filter -->
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                            <span style="color: #aaa; font-size: 13px; font-weight: 600; margin-right: 8px;">FILTER:</span>
                            <button class="forum-category-filter active" data-category="all" style="padding: 8px 16px; background: #7C3AED; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                                All Posts
                            </button>
                            ${categories.map(cat => `
                                <button class="forum-category-filter" data-category="${cat.id}" style="padding: 8px 16px; background: #2a2a2a; color: #aaa; border: 1px solid #333; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                    <i class="fas ${cat.icon}"></i> ${cat.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Posts Feed -->
                    <div id="forum-posts-container">
                        ${postsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHTML);
    
    // Close modal
    $('#close-blackhat-forum').on('click', function() {
        $('#blackhat-forum-modal').remove();
    });
    
    // Create post button
    $('#btn-create-forum-post').on('click', function() {
        showCreateForumPostModal();
    });
    
    // Category filter
    $(document).on('click', '.forum-category-filter', function() {
        const category = $(this).data('category');
        $('.forum-category-filter').removeClass('active').css({'background': '#2a2a2a', 'color': '#aaa', 'border': '1px solid #333'});
        $(this).addClass('active').css({'background': '#7C3AED', 'color': 'white', 'border': 'none'});
        
        if (category === 'all') {
            $('.forum-post-card').show();
        } else {
            $('.forum-post-card').hide();
            $(`.forum-post-card:has(.forum-category-badge:contains("${category}"))`).show();
        }
    });
    
    // View post
    $(document).on('click', '.btn-view-post, .forum-post-card', function(e) {
        if (!$(e.target).closest('.btn-view-post, .forum-post-card').length) return;
        const postId = parseInt($(this).data('post-id')) || parseInt($(this).closest('.forum-post-card').data('post-id'));
        viewForumPost(postId);
    });
}

// Create Forum Post Modal
function showCreateForumPostModal() {
    const categories = ['general', 'exploits', 'tutorials', 'tools', 'marketplace'];
    
    const modalHTML = `
        <div id="create-forum-post-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="padding: 24px; border-bottom: 1px solid #333;">
                    <h2 style="margin: 0; color: #fff; font-size: 20px; font-weight: 700;">Create New Post</h2>
                </div>
                
                <div style="padding: 24px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #aaa; font-size: 13px; font-weight: 600; margin-bottom: 8px;">CATEGORY</label>
                        <select id="forum-post-category" style="width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; font-size: 14px;">
                            ${categories.map(cat => `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #aaa; font-size: 13px; font-weight: 600; margin-bottom: 8px;">TITLE</label>
                        <input type="text" id="forum-post-title" placeholder="What's your post about?" maxlength="255" style="width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; font-size: 14px;" />
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; color: #aaa; font-size: 13px; font-weight: 600; margin-bottom: 8px;">CONTENT</label>
                        <textarea id="forum-post-content" placeholder="Share your thoughts, exploits, or questions..." rows="8" style="width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; font-size: 14px; resize: vertical; font-family: inherit;"></textarea>
                    </div>
                    
                    <div style="background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.3); border-radius: 6px; padding: 12px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #7C3AED; font-size: 12px;">
                            <i class="fas fa-user-secret"></i> Your post will be published anonymously with a random hacker alias.
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button id="cancel-forum-post" style="flex: 1; padding: 12px; background: #2a2a2a; border: 1px solid #333; border-radius: 6px; color: #aaa; cursor: pointer; font-size: 14px; font-weight: 600;">
                            Cancel
                        </button>
                        <button id="submit-forum-post" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 700;">
                            <i class="fas fa-paper-plane"></i> Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHTML);
    
    $('#cancel-forum-post').on('click', function() {
        $('#create-forum-post-modal').remove();
    });
    
    $('#submit-forum-post').on('click', function() {
        const category = $('#forum-post-category').val();
        const title = $('#forum-post-title').val().trim();
        const content = $('#forum-post-content').val().trim();
        
        if (!title || !content) {
            showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Posting...');
        
        $.post('https://fractal-laptop/createForumPost', JSON.stringify({
            category: category,
            title: title,
            content: content
        }), function(response) {
            if (response.success) {
                $('#create-forum-post-modal').remove();
                showNotification('Posted!', 'Your post has been published', 'success');
                // Reload forum
                $('#blackhat-forum-modal').remove();
                openBlackHatForums();
            } else {
                showNotification('Error', response.error || 'Failed to create post', 'error');
                $('#submit-forum-post').prop('disabled', false).html('<i class="fas fa-paper-plane"></i> Post');
            }
        });
    });
}

// View Forum Post (with comments)
function viewForumPost(postId) {
    $.post('https://fractal-laptop/getForumPost', JSON.stringify({postId: postId}), function(response) {
        if (response.success && response.post) {
            showForumPostView(response.post, response.comments || []);
        } else {
            showNotification('Error', 'Failed to load post', 'error');
        }
    });
}

function showForumPostView(post, comments) {
    const timeAgo = getTimeAgo(post.created_at);
    
    let commentsHTML = '';
    comments.forEach(comment => {
        const commentTime = getTimeAgo(comment.created_at);
        commentsHTML += `
            <div class="forum-comment" style="background: #1a1a1a; border-left: 3px solid #7C3AED; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="color: #7C3AED; font-weight: 600; font-size: 14px;">${comment.author_alias}</span>
                    <span style="color: #666; font-size: 12px;">•</span>
                    <span style="color: #666; font-size: 12px;">${commentTime}</span>
                </div>
                <p style="margin: 0; color: #ccc; font-size: 14px; line-height: 1.6;">${escapeHtml(comment.content)}</p>
                <div style="margin-top: 8px; display: flex; gap: 12px; align-items: center;">
                    <span style="color: #F59E0B; font-size: 12px; font-weight: 600;"><i class="fas fa-arrow-up"></i> ${comment.upvotes}</span>
                </div>
            </div>
        `;
    });
    
    if (comments.length === 0) {
        commentsHTML = `
            <div style="text-align: center; padding: 40px 20px; background: #1a1a1a; border: 1px dashed #333; border-radius: 6px;">
                <i class="fas fa-comment" style="font-size: 36px; color: #333; margin-bottom: 12px;"></i>
                <p style="margin: 0; color: #666; font-size: 14px;">No comments yet. Be the first to comment!</p>
            </div>
        `;
    }
    
    const modalHTML = `
        <div id="forum-post-view-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 10002; overflow-y: auto;">
            <div style="min-height: 100vh; background: #0a0a0a; padding: 40px 20px;">
                <div style="max-width: 900px; margin: 0 auto;">
                    <!-- Back Button -->
                    <button id="back-to-forum" style="padding: 10px 20px; background: #2a2a2a; border: 1px solid #333; border-radius: 6px; color: #aaa; cursor: pointer; font-size: 14px; margin-bottom: 24px;">
                        <i class="fas fa-arrow-left"></i> Back to Forums
                    </button>
                    
                    <!-- Post Content -->
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <span style="background: #333; color: #F59E0B; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${post.category}</span>
                            <span style="color: #666; font-size: 13px;">Posted by <span style="color: #7C3AED; font-weight: 600;">${post.author_alias}</span></span>
                            <span style="color: #666; font-size: 13px;">•</span>
                            <span style="color: #666; font-size: 13px;">${timeAgo}</span>
                        </div>
                        
                        <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 24px; font-weight: 700; line-height: 1.3;">${escapeHtml(post.title)}</h2>
                        <p style="margin: 0 0 16px 0; color: #ccc; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(post.content)}</p>
                        
                        <div style="display: flex; gap: 16px; align-items: center; padding-top: 16px; border-top: 1px solid #333;">
                            <span style="color: #F59E0B; font-size: 14px; font-weight: 700;"><i class="fas fa-arrow-up"></i> ${post.upvotes} Upvotes</span>
                            <span style="color: #666; font-size: 14px;"><i class="fas fa-comment"></i> ${comments.length} Comments</span>
                        </div>
                    </div>
                    
                    <!-- Add Comment Section -->
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; color: #fff; font-size: 16px; font-weight: 600;">Add a Comment</h3>
                        <textarea id="comment-content" placeholder="Share your thoughts..." rows="4" style="width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; font-size: 14px; resize: vertical; font-family: inherit; margin-bottom: 12px;"></textarea>
                        <button id="submit-comment" data-post-id="${post.id}" style="padding: 10px 24px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                            <i class="fas fa-paper-plane"></i> Post Comment
                        </button>
                    </div>
                    
                    <!-- Comments -->
                    <div>
                        <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 18px; font-weight: 600;">Comments (${comments.length})</h3>
                        <div id="comments-container">
                            ${commentsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHTML);
    
    $('#back-to-forum').on('click', function() {
        $('#forum-post-view-modal').remove();
    });
    
    $('#submit-comment').on('click', function() {
        const postId = parseInt($(this).data('post-id'));
        const content = $('#comment-content').val().trim();
        
        if (!content) {
            showNotification('Error', 'Comment cannot be empty', 'error');
            return;
        }
        
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Posting...');
        
        $.post('https://fractal-laptop/addForumComment', JSON.stringify({
            postId: postId,
            content: content
        }), function(response) {
            if (response.success) {
                showNotification('Posted!', 'Your comment has been added', 'success');
                // Reload post view
                $('#forum-post-view-modal').remove();
                viewForumPost(postId);
            } else {
                showNotification('Error', response.error || 'Failed to post comment', 'error');
                $('#submit-comment').prop('disabled', false).html('<i class="fas fa-paper-plane"></i> Post Comment');
            }
        });
    });
}

// Helper: Time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now - past) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return Math.floor(seconds / 604800) + 'w ago';
}

// TOR Browser - All services are now .onion sites unlocked via Terminal
// No placeholder services - everything is discoverable content

// ====================================
// SETTINGS APP
// ====================================

function showConfirmDialog({
    title = 'Confirm Action',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm = null,
    onCancel = null
} = {}) {
    $('#generic-confirm-modal').remove();

    const modal = $(
        `<div class="modal-overlay" id="generic-confirm-modal">
            <div class="modal-content confirm-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" type="button">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary modal-cancel" type="button">${cancelText}</button>
                    <button class="btn-primary modal-confirm" type="button">${confirmText}</button>
                </div>
            </div>
        </div>`
    );

    $('body').append(modal);

    modal.find('.modal-confirm').on('click', function() {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
        modal.remove();
    });

    modal.find('.modal-cancel, .modal-close').on('click', function() {
        if (typeof onCancel === 'function') {
            onCancel();
        }
        modal.remove();
    });

    modal.on('click', function(event) {
        if (event.target === this) {
            if (typeof onCancel === 'function') {
                onCancel();
            }
            modal.remove();
        }
    });
}

function getSettingsContent() {
    return `
        <div class="app-settings">
            <div class="settings-sidebar">
                <div class="settings-nav-item active" data-tab="personalization">
                    <i class="fas fa-palette"></i>
                    <span>Personalization</span>
                </div>
                <div class="settings-nav-item" data-tab="system">
                    <i class="fas fa-cog"></i>
                    <span>System</span>
                </div>
                <div class="settings-nav-item" data-tab="network">
                    <i class="fas fa-network-wired"></i>
                    <span>Network & VPN</span>
                </div>
                <div class="settings-nav-item" data-tab="apps">
                    <i class="fas fa-th"></i>
                    <span>Apps</span>
                </div>
                <div class="settings-nav-item" data-tab="about">
                    <i class="fas fa-info-circle"></i>
                    <span>About</span>
                </div>
            </div>
            <div class="settings-content" id="settings-panel">
                ${getPersonalizationPanel()}
            </div>
        </div>
    `;
}

function getPersonalizationPanel() {
    return `
        <div class="settings-panel">
            <h2>Personalization</h2>
            <p>Customize your desktop appearance</p>
            
            <div class="settings-section">
                <h3>Theme</h3>
                <div class="theme-toggle-container">
                    <div class="theme-option">
                        <div class="theme-icon">
                            <i class="fas fa-sun"></i>
                        </div>
                        <span>Light Mode</span>
                    </div>
                    <label class="theme-toggle">
                        <input type="checkbox" id="dark-mode-toggle" ${laptopData.settings.darkMode ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="theme-option">
                        <div class="theme-icon">
                            <i class="fas fa-moon"></i>
                        </div>
                        <span>Dark Mode</span>
                    </div>
                </div>
                <p style="color: var(--text-secondary); margin-top: 12px; font-size: 14px;">
                    Switch between light and dark theme for a comfortable viewing experience
                </p>
            </div>
            
            <div class="settings-section">
                <h3>Wallpaper</h3>
                <div class="wallpaper-grid">
                    ${laptopData.wallpapers.map(wallpaper => `
                        <div class="wallpaper-option ${laptopData.settings.wallpaper === wallpaper.id ? 'active' : ''}" data-wallpaper-id="${wallpaper.id}">
                            <div class="wallpaper-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                            <span>${wallpaper.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Username</h3>
                <input type="text" id="settings-username" value="${laptopData.settings.username || 'User'}" class="settings-input">
                <button class="btn" id="save-username">Save Username</button>
            </div>
        </div>
    `;
}

// Settings navigation
$(document).on('click', '.settings-nav-item', function() {
    $('.settings-nav-item').removeClass('active');
    $(this).addClass('active');
    
    const tab = $(this).data('tab');
    loadSettingsTab(tab);
});

function loadSettingsTab(tab) {
    let content = '';
    
    switch(tab) {
        case 'personalization':
            content = getPersonalizationPanel();
            break;
        case 'system':
            content = getSystemPanel();
            break;
        case 'network':
            content = getNetworkPanel();
            break;
        case 'apps':
            content = getAppsPanel();
            break;
        case 'about':
            content = getAboutPanel();
            break;
    }
    
    $('#settings-panel').html(content);
}

function getSystemPanel() {
    return `
        <div class="settings-panel">
            <h2>System</h2>
            <div class="system-info">
                <div class="info-row">
                    <span>OS Name:</span>
                    <strong>${laptopData.systemInfo.osName}</strong>
                </div>
                <div class="info-row">
                    <span>Version:</span>
                    <strong>${laptopData.systemInfo.version}</strong>
                </div>
                <div class="info-row">
                    <span>Manufacturer:</span>
                    <strong>${laptopData.systemInfo.manufacturer}</strong>
                </div>
                <div class="info-row">
                    <span>Model:</span>
                    <strong>${laptopData.systemInfo.model}</strong>
                </div>
            </div>
        </div>
    `;
}

function getNetworkPanel() {
    return `
        <div class="settings-panel">
            <h2>Network & VPN</h2>
            
            <div class="settings-section">
                <h3>VPN Access</h3>
                <div class="vpn-auto-detect">
                    <div class="vpn-info">
                        <i class="fas fa-shield-${laptopData.vpnEnabled ? 'check' : 'alt'} vpn-icon ${laptopData.vpnEnabled ? 'active' : ''}"></i>
                        <div class="vpn-text">
                            <strong>${laptopData.vpnEnabled ? 'VPN Access Active' : 'VPN Access Inactive'}</strong>
                            <p>${laptopData.vpnEnabled ? 'VPN Access Card detected - Secure apps unlocked' : 'Insert VPN Access Card in your inventory to unlock secure apps'}</p>
                        </div>
                    </div>
                    <button class="btn-refresh-vpn" id="btn-refresh-vpn">
                        <i class="fas fa-sync-alt"></i> Refresh Status
                    </button>
                </div>
                <div class="vpn-status-box ${laptopData.vpnEnabled ? 'connected' : 'disconnected'}">
                    <i class="fas ${laptopData.vpnEnabled ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    <span>${laptopData.vpnEnabled ? 'Secure network access enabled' : 'Secure network access disabled'}</span>
                </div>
            </div>
        </div>
    `;
}

function getAppsPanel() {
    const allApps = [...laptopData.defaultApps, ...getInstalledApps()];
    
    return `
        <div class="settings-panel">
            <h2>Installed Apps</h2>
            <div class="apps-list">
                ${allApps.map(app => `
                    <div class="app-list-item">
                        <div class="app-list-icon" style="background: ${app.color};">
                            <i class="${app.icon}"></i>
                        </div>
                        <div class="app-list-info">
                            <strong>${app.name}</strong>
                            <p>${app.requiresVPN ? 'Requires VPN' : 'Standard App'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getAboutPanel() {
    return `
        <div class="settings-panel">
            <h2>About ${laptopData.systemInfo.osName}</h2>
            <div class="about-logo">
                <i class="fas fa-laptop"></i>
            </div>
            <div class="about-info">
                <h3>${laptopData.systemInfo.osName} ${laptopData.systemInfo.version}</h3>
                <p>© 2025 ${laptopData.systemInfo.manufacturer}</p>
                <p>${laptopData.systemInfo.model}</p>
            </div>
        </div>
    `;
}

// Wallpaper selection
$(document).on('click', '.wallpaper-option', function() {
    const wallpaperId = $(this).data('wallpaper-id');
    
    $('.wallpaper-option').removeClass('active');
    $(this).addClass('active');
    
    // Update wallpaper
    setWallpaper(wallpaperId);
    laptopData.settings.wallpaper = wallpaperId;
    
    // Save to server
    $.post('https://fractal-laptop/saveSettings', JSON.stringify({
        wallpaper: wallpaperId
    }));
    
    showNotification('Wallpaper Changed', 'Your wallpaper has been updated.', 'success');
});

// Save username
$(document).on('click', '#save-username', function() {
    const newUsername = $('#settings-username').val();
    
    laptopData.settings.username = newUsername;
    $('#username').text(newUsername);
    
    $.post('https://fractal-laptop/saveSettings', JSON.stringify({
        username: newUsername
    }));
    
    showNotification('Username Saved', 'Your username has been updated.', 'success');
});

// Dark mode toggle
$(document).on('change', '#dark-mode-toggle', function() {
    const isDarkMode = $(this).is(':checked');
    
    // Apply dark mode immediately
    if (isDarkMode) {
        $('body').addClass('dark-mode');
    } else {
        $('body').removeClass('dark-mode');
    }
    
    // Save preference
    laptopData.settings.darkMode = isDarkMode;
    
    $.post('https://fractal-laptop/saveSettings', JSON.stringify({
        darkMode: isDarkMode
    }));
    
    showNotification(
        isDarkMode ? 'Dark Mode Enabled' : 'Light Mode Enabled',
        `Switched to ${isDarkMode ? 'dark' : 'light'} theme`,
        'success'
    );
});

// VPN toggle in settings
// Refresh VPN status button
$(document).on('click', '#btn-refresh-vpn', function() {
    console.log('[Laptop-OS] Refreshing VPN status...');
    
    // Add spin animation to icon
    const icon = $(this).find('i');
    icon.addClass('fa-spin');
    
        $.post('https://fractal-laptop/refreshVPN', JSON.stringify({}), function() {
        // Remove spin after short delay
        setTimeout(() => {
            icon.removeClass('fa-spin');
        }, 1000);
    });
});

// ====================================
// FILE MANAGER APP
// ====================================

function getFileManagerContent() {
    return `
        <div class="app-file-manager">
            <div class="file-toolbar">
                <button class="btn-icon"><i class="fas fa-arrow-left"></i></button>
                <button class="btn-icon"><i class="fas fa-arrow-right"></i></button>
                <button class="btn-icon"><i class="fas fa-arrow-up"></i></button>
                <div class="file-path">
                    <i class="fas fa-home"></i>
                    <span>/ Documents</span>
                </div>
            </div>
            <div class="file-content">
                <div class="file-grid">
                    <div class="file-item folder">
                        <i class="fas fa-folder"></i>
                        <span>Downloads</span>
                    </div>
                    <div class="file-item folder">
                        <i class="fas fa-folder"></i>
                        <span>Pictures</span>
                    </div>
                    <div class="file-item file">
                        <i class="fas fa-file-alt"></i>
                        <span>Document.txt</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ====================================
// NOTES APP
// ====================================

function getNotesContent() {
    return `
        <div class="app-notes">
            <div class="notes-container">
                <div class="notes-sidebar">
                    <div class="notes-sidebar-header">
                        <h3>My Notes</h3>
                        <button class="btn-new-note" id="btn-new-note">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="notes-list" id="notes-list">
                        <div class="notes-empty">
                            <i class="fas fa-sticky-note"></i>
                            <p>No notes yet</p>
                            <small>Click + to create one</small>
                        </div>
                    </div>
                </div>
                <div class="notes-editor">
                    <div class="notes-editor-header">
                        <input type="text" class="note-title-input" id="note-title-input" placeholder="Note Title" />
                        <div class="notes-actions">
                            <button class="btn-save-note" id="btn-save-note" disabled>
                                <i class="fas fa-save"></i> Save
                            </button>
                            <button class="btn-delete-note" id="btn-delete-note" disabled>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <textarea class="note-content-input" id="note-content-input" placeholder="Start typing your note..."></textarea>
                    <div class="note-info" id="note-info"></div>
                </div>
            </div>
        </div>
    `;
}

// Notes App State
let currentNotes = [];
let currentNote = null;
let notesEdited = false;

// Load all notes from server
// Note: This is called automatically by windowManager when Notes app is opened
function loadNotes() {
    $.post('https://fractal-laptop/getNotes', JSON.stringify({}), function(response) {
        currentNotes = response.notes || [];
        renderNotesList();
    });
}

// Render notes list in sidebar
function renderNotesList() {
    const notesList = $('#notes-list');
    
    if (currentNotes.length === 0) {
        notesList.html(`
            <div class="notes-empty">
                <i class="fas fa-sticky-note"></i>
                <p>No notes yet</p>
                <small>Click + to create one</small>
            </div>
        `);
        return;
    }
    
    let html = '';
    currentNotes.forEach(note => {
        const date = new Date(note.created_at);
        const dateStr = date.toLocaleDateString();
        const preview = note.content ? note.content.substring(0, 100) : 'No content';
        
        html += `
            <div class="note-item ${currentNote && currentNote.id === note.id ? 'active' : ''}" data-note-id="${note.id}">
                <div class="note-item-title">${note.title || 'Untitled'}</div>
                <div class="note-item-preview">${preview}</div>
                <div class="note-item-date">${dateStr}</div>
            </div>
        `;
    });
    
    notesList.html(html);
}

// New note button
$(document).on('click', '#btn-new-note', function() {
    currentNote = {
        id: null,
        title: '',
        content: '',
        created_at: new Date().toISOString()
    };
    
    $('#note-title-input').val('').prop('disabled', false);
    $('#note-content-input').val('').prop('disabled', false);
    $('#btn-save-note').prop('disabled', false);
    $('#btn-delete-note').prop('disabled', true);
    $('#note-info').text('New note - not saved yet');
    
    notesEdited = false;
    renderNotesList();
});

// Click on note in list
$(document).on('click', '.note-item', function() {
    const noteId = $(this).data('note-id');
    const note = currentNotes.find(n => n.id === noteId);
    
    if (note) {
        currentNote = note;
        $('#note-title-input').val(note.title).prop('disabled', false);
        $('#note-content-input').val(note.content).prop('disabled', false);
        $('#btn-save-note').prop('disabled', false);
        $('#btn-delete-note').prop('disabled', false);
        
        const date = new Date(note.updated_at || note.created_at);
        $('#note-info').text(`Last modified: ${date.toLocaleString()}`);
        
        notesEdited = false;
        renderNotesList();
    }
});

// Detect changes in note
$(document).on('input', '#note-title-input, #note-content-input', function() {
    notesEdited = true;
    $('#note-info').text('Unsaved changes');
});

// Save note button
$(document).on('click', '#btn-save-note', function() {
    const title = $('#note-title-input').val().trim();
    const content = $('#note-content-input').val().trim();
    
    if (!title) {
        showNotification('Error', 'Please enter a note title', 'error');
        return;
    }
    
    if (currentNote && currentNote.id) {
        // Update existing note
        $.post('https://fractal-laptop/updateNote', JSON.stringify({
            noteId: currentNote.id,
            title: title,
            content: content
        }));
    } else {
        // Create new note
        $.post('https://fractal-laptop/createNote', JSON.stringify({
            title: title,
            content: content
        }));
    }
    
    notesEdited = false;
});

// Delete note button
$(document).on('click', '#btn-delete-note', function() {
    if (!currentNote || !currentNote.id) return;
    
    showConfirmDialog({
        title: 'Delete Note',
        message: 'Are you sure you want to delete this note? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: function() {
            $.post('https://fractal-laptop/deleteNote', JSON.stringify({
                noteId: currentNote.id
            }));
            
            // Clear editor
            currentNote = null;
            $('#note-title-input').val('').prop('disabled', true);
            $('#note-content-input').val('').prop('disabled', true);
            $('#btn-save-note').prop('disabled', true);
            $('#btn-delete-note').prop('disabled', true);
            $('#note-info').text('');
        }
    });
});

// ====================================
// CRYPTO WALLET APP
// ====================================

function getCryptoWalletContent() {
    return `
        <div class="app-crypto-wallet">
            <div class="crypto-wallet-container">
                <!-- Wallet Info Card -->
                <div class="wallet-info-card">
                    <div class="wallet-header">
                        <div class="wallet-icon">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <h2>Crypto Wallet</h2>
                    </div>
                    
                    <div class="wallet-address-section">
                        <label>Your Wallet Address</label>
                        <div style="display: flex; align-items: center; gap: 10px; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0; border: 2px solid #ddd;">
                            <div id="wallet-address-text" style="flex: 1; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #333; word-break: break-all;"></div>
                            <button class="btn-copy" id="btn-copy-address" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                                Copy Address
                            </button>
                        </div>
                        <small id="wallet-created-date" style="color: #666;"></small>
                    </div>
                    
                    <div class="wallet-balance-section">
                        <div class="balance-card balance-total">
                            <span class="balance-label">Total Balance</span>
                            <span class="balance-amount" id="balance-total">FBT 0.0000</span>
                        </div>
                        <div class="balance-card balance-wallet">
                            <span class="balance-label">Wallet</span>
                            <span class="balance-amount" id="balance-wallet">FBT 0.0000</span>
                        </div>
                        <div class="balance-card balance-usb">
                            <span class="balance-label">USB Drive</span>
                            <span class="balance-amount" id="balance-usb">FBT 0.0000</span>
                        </div>
                    </div>
                </div>
                
                <!-- USB Management Section -->
                <div class="usb-management-card" id="usb-management" style="display: none;">
                    <div class="usb-header">
                        <i class="fas fa-hdd"></i>
                        <h3>USB Drive Detected</h3>
                    </div>
                    <div class="usb-actions">
                        <div class="usb-action-group">
                            <label>Deposit from USB to Wallet</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="input-deposit-amount" class="crypto-input" placeholder="Amount" step="0.0001" min="0" style="flex: 1;" />
                                <button type="button" class="btn-usb-action btn-deposit" id="btn-max-deposit">
                                    MAX
                                </button>
                                <button type="button" class="btn-usb-action btn-deposit" id="btn-deposit-usb">
                                    <i class="fas fa-arrow-down"></i> Deposit
                                </button>
                            </div>
                        </div>
                        <div class="usb-action-group">
                            <label>Withdraw from Wallet to USB</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="input-withdraw-amount" class="crypto-input" placeholder="Amount" step="0.0001" min="0" style="flex: 1;" />
                                <button type="button" class="btn-usb-action btn-withdraw" id="btn-max-withdraw">
                                    MAX
                                </button>
                                <button type="button" class="btn-usb-action btn-withdraw" id="btn-withdraw-usb">
                                    <i class="fas fa-arrow-up"></i> Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions Tabs -->
                <div class="crypto-tabs">
                    <button class="crypto-tab active" data-tab="send">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                    <button class="crypto-tab" data-tab="receive">
                        <i class="fas fa-download"></i> Receive
                    </button>
                    <button class="crypto-tab" data-tab="history">
                        <i class="fas fa-history"></i> History
                    </button>
                </div>
                
                <!-- Tab Contents -->
                <div class="crypto-tab-content">
                    <!-- Send Tab -->
                    <div class="tab-pane active" id="tab-send">
                        <form class="crypto-form" id="form-send-crypto">
                            <div class="form-group">
                                <label>Recipient Wallet Address</label>
                                <input type="text" id="input-to-address" class="crypto-input" placeholder="0x..." required />
                                <button type="button" class="btn-verify" id="btn-verify-address">
                                    <i class="fas fa-check-circle"></i> Verify
                                </button>
                                <div id="verify-result"></div>
                            </div>
                            
                            <div class="form-group">
                                <label>Amount (FBT)</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" id="input-send-amount" class="crypto-input" placeholder="0.0000" step="0.0001" min="0" required style="flex: 1;" />
                                    <button type="button" class="btn-max-send" id="btn-max-send">
                                        MAX
                                    </button>
                                </div>
                                <div class="input-help">
                                    Available: <span id="available-wallet">FBT 0.0000</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Description (Optional)</label>
                                <input type="text" id="input-send-description" class="crypto-input" placeholder="Payment for..." />
                            </div>
                            
                            <button type="submit" class="btn-crypto-action btn-send">
                                <i class="fas fa-paper-plane"></i> Send Crypto
                            </button>
                        </form>
                    </div>
                    
                    <!-- Receive Tab -->
                    <div class="tab-pane" id="tab-receive">
                        <div class="receive-info">
                            <div class="receive-section">
                                <h3><i class="fas fa-qrcode"></i> Your Wallet Address</h3>
                                <p>Share this address with others to receive crypto:</p>
                                <div class="address-display">
                                    <div id="receive-address" style="font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all; padding: 15px; background: #f5f5f5; border-radius: 8px; border: 2px solid #ddd; color: #333;"></div>
                                    <button class="btn-copy-address" id="btn-copy-receive-address" style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                        <i class="fas fa-copy"></i> Copy Address
                                    </button>
                                </div>
                            </div>
                            <div class="receive-section">
                                <h3><i class="fas fa-info-circle"></i> How to Receive Crypto</h3>
                                <ol style="color: #666; line-height: 1.8;">
                                    <li>Share your wallet address with the sender</li>
                                    <li>They send crypto to your address using their laptop</li>
                                    <li>You'll receive a notification when the transaction completes</li>
                                    <li>Check your wallet balance or transaction history</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    
                    <!-- History Tab -->
                    <div class="tab-pane" id="tab-history">
                        <div class="transactions-list" id="transactions-list">
                            <div class="transactions-loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Loading transactions...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Crypto Wallet State
let currentWallet = null;
let currentTransactions = [];

// Load crypto wallet data
function loadCryptoWallet() {
    console.log('[Crypto Wallet] Loading wallet info...');
    $.post('https://fractal-laptop/getWalletInfo', JSON.stringify({}), function(response) {
        console.log('[Crypto Wallet] Response received:', response);
        if (response && response.wallet) {
            currentWallet = response.wallet;
            console.log('[Crypto Wallet] Wallet data:', currentWallet);
            renderWalletInfo();
        } else {
            console.error('[Crypto Wallet] No wallet data received!');
        }
    });
}

// Render wallet information
function renderWalletInfo() {
    if (!currentWallet) {
        console.error('[Crypto Wallet] No wallet data to render!');
        return;
    }
    
    console.log('[Crypto Wallet] Rendering wallet info...');
    console.log('[Crypto Wallet] Address:', currentWallet.address);
    console.log('[Crypto Wallet] Balance:', currentWallet.balance);
    
    // Set wallet address
    $('#wallet-address-text').text(currentWallet.address);
    $('#wallet-created-date').text(`Created: ${new Date(currentWallet.created).toLocaleDateString()}`);
    
    // Update balances
    const balance = currentWallet.balance;
    const usbBalance = currentWallet.usbBalance || 0;
    const totalWithUSB = balance.wallet + usbBalance;
    
    $('#balance-total').text(`FBT ${totalWithUSB.toFixed(4)}`);
    $('#balance-wallet').text(`FBT ${balance.wallet.toFixed(4)}`);
    $('#balance-usb').text(`FBT ${usbBalance.toFixed(4)}`);
    $('#available-wallet').text(`FBT ${balance.wallet.toFixed(4)}`);
    
    // Show/hide USB management section
    if (currentWallet.hasUSB) {
        $('#usb-management').show();
    } else {
        $('#usb-management').hide();
    }
    
    // Set receive address
    $('#receive-address').text(currentWallet.address);
    
    console.log('[Crypto Wallet] Wallet info rendered successfully!');
    console.log('  - USB Balance:', usbBalance);
    console.log('  - Has USB:', currentWallet.hasUSB);
}

// Copy wallet address
$(document).on('click', '#btn-copy-address, #btn-copy-receive-address', function() {
    const address = currentWallet ? currentWallet.address : '';
    if (!address) return;
    
    const tempInput = document.createElement('input');
    tempInput.value = address;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    showNotification('Success', 'Wallet address copied to clipboard', 'success');
});

// MAX Deposit button
$(document).on('click', '#btn-max-deposit', function() {
    if (!currentWallet) return;
    const maxAmount = Math.floor((currentWallet.usbBalance || 0) * 10000) / 10000;
    $('#input-deposit-amount').val(maxAmount.toFixed(4));
});

// Deposit from USB
$(document).on('click', '#btn-deposit-usb', function() {
    if (!currentWallet) return;
    
    const amount = parseFloat($('#input-deposit-amount').val());
    
    if (!amount || amount <= 0) {
        showNotification('Error', 'Please enter a valid amount', 'error');
        return;
    }
    
    const usbBalance = currentWallet.usbBalance || 0;
    if (amount > usbBalance) {
        showNotification('Error', 'Insufficient USB balance', 'error');
        return;
    }
    
    $.post('https://fractal-laptop/depositFromUSB', JSON.stringify({ amount: amount }), function() {
        // Clear input and refresh wallet after deposit
        $('#input-deposit-amount').val('');
        // Wait a moment for server to update, then refresh
        setTimeout(function() {
            loadCryptoWallet();
        }, 500);
    });
});

// MAX Withdraw button
$(document).on('click', '#btn-max-withdraw', function() {
    if (!currentWallet) return;
    const maxAmount = Math.floor((currentWallet.balance.wallet || 0) * 10000) / 10000;
    $('#input-withdraw-amount').val(maxAmount.toFixed(4));
});

// Withdraw to USB
$(document).on('click', '#btn-withdraw-usb', function() {
    if (!currentWallet) return;
    
    const amount = parseFloat($('#input-withdraw-amount').val());
    
    if (!amount || amount <= 0) {
        showNotification('Error', 'Please enter a valid amount', 'error');
        return;
    }
    
    const walletBalance = currentWallet.balance.wallet || 0;
    if (amount > walletBalance) {
        showNotification('Error', 'Insufficient wallet balance', 'error');
        return;
    }
    
    $.post('https://fractal-laptop/withdrawToUSB', JSON.stringify({ amount: amount }), function() {
        // Clear input and refresh wallet after withdrawal
        $('#input-withdraw-amount').val('');
        // Wait a moment for server to update, then refresh
        setTimeout(function() {
            loadCryptoWallet();
        }, 500);
    });
});

// Tab switching
$(document).on('click', '.crypto-tab', function() {
    const tab = $(this).data('tab');
    
    // Update active tab
    $('.crypto-tab').removeClass('active');
    $(this).addClass('active');
    
    // Update active content
    $('.tab-pane').removeClass('active');
    $(`#tab-${tab}`).addClass('active');
    
    // Load transactions if history tab
    if (tab === 'history') {
        loadTransactions();
    }
});

// Verify wallet address
$(document).on('click', '#btn-verify-address', function() {
    const address = $('#input-to-address').val().trim();
    
    if (!address) {
        $('#verify-result').html('<div class="verify-error"><i class="fas fa-times-circle"></i> Please enter a wallet address</div>');
        return;
    }
    
    $.post('https://fractal-laptop/findWallet', JSON.stringify({address: address}), function(response) {
        if (response.found) {
            $('#verify-result').html('<div class="verify-success"><i class="fas fa-check-circle"></i> Valid wallet address</div>');
        } else {
            $('#verify-result').html('<div class="verify-error"><i class="fas fa-times-circle"></i> Wallet address not found</div>');
        }
    });
});

// MAX Send button
$(document).on('click', '#btn-max-send', function() {
    if (!currentWallet) return;
    const maxAmount = Math.floor((currentWallet.balance.wallet || 0) * 10000) / 10000;
    $('#input-send-amount').val(maxAmount.toFixed(4));
});

// Send crypto form
$(document).on('submit', '#form-send-crypto', function(e) {
    e.preventDefault();
    
    const toAddress = $('#input-to-address').val().trim();
    const amount = parseFloat($('#input-send-amount').val());
    const description = $('#input-send-description').val().trim();
    
    if (!toAddress || !amount || amount <= 0) {
        showNotification('Error', 'Please fill in all required fields', 'error');
        return;
    }
    
    if (amount > currentWallet.balance.wallet) {
        showNotification('Error', 'Insufficient wallet balance', 'error');
        return;
    }
    
    $.post('https://fractal-laptop/sendCrypto', JSON.stringify({
        toAddress: toAddress,
        amount: amount,
        description: description
    }), function() {
        // Reset form and refresh wallet after sending
        $('#form-send-crypto')[0].reset();
        $('#verify-result').html('');
        // Wait a moment for server to update, then refresh
        setTimeout(function() {
            loadCryptoWallet();
        }, 500);
    });
});

// Withdraw feature removed - players must use riskier methods to withdraw from miners

// Load transactions
function loadTransactions() {
    $('#transactions-list').html(`
        <div class="transactions-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading transactions...</p>
        </div>
    `);
    
    $.post('https://fractal-laptop/getTransactions', JSON.stringify({limit: 50}), function(response) {
        currentTransactions = response.transactions || [];
        renderTransactions();
    });
}

// Render transactions
function renderTransactions() {
    if (currentTransactions.length === 0) {
        $('#transactions-list').html(`
            <div class="transactions-empty">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    currentTransactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const isReceived = tx.to_citizenid === (currentWallet && currentWallet.address);
        const icon = isReceived ? 'fa-arrow-down' : 'fa-arrow-up';
        const typeClass = isReceived ? 'tx-received' : 'tx-sent';
        const sign = isReceived ? '+' : '-';
        
        html += `
            <div class="transaction-item ${typeClass}">
                <div class="tx-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="tx-details">
                    <div class="tx-type">${tx.transaction_type}</div>
                    <div class="tx-description">${tx.description || 'No description'}</div>
                    <div class="tx-date">${date.toLocaleString()}</div>
                </div>
                <div class="tx-amount">
                    ${sign}FBT ${parseFloat(tx.amount).toFixed(4)}
                </div>
            </div>
        `;
    });
    
    $('#transactions-list').html(html);
}

// Refresh wallet (called from server after transactions)
function refreshCryptoWallet() {
    if (typeof loadCryptoWallet === 'function') {
        loadCryptoWallet();
    }
    // Reload transactions if on history tab
    if ($('#tab-history').hasClass('active')) {
        loadTransactions();
    }
}

// ====================================
// CALCULATOR APP
// ====================================

// Calculator state
let calculatorState = {
    display: '0',
    previousValue: null,
    operation: null,
    waitingForNewValue: false
};

function getCalculatorContent() {
    return `
        <div class="app-calculator">
            <div class="calc-display" id="calc-display">0</div>
            <div class="calc-buttons">
                <button class="calc-btn operator" data-action="clear">C</button>
                <button class="calc-btn operator" data-action="clear-entry">CE</button>
                <button class="calc-btn operator" data-action="backspace">⌫</button>
                <button class="calc-btn operator" data-action="divide">÷</button>
                
                <button class="calc-btn" data-number="7">7</button>
                <button class="calc-btn" data-number="8">8</button>
                <button class="calc-btn" data-number="9">9</button>
                <button class="calc-btn operator" data-action="multiply">×</button>
                
                <button class="calc-btn" data-number="4">4</button>
                <button class="calc-btn" data-number="5">5</button>
                <button class="calc-btn" data-number="6">6</button>
                <button class="calc-btn operator" data-action="subtract">−</button>
                
                <button class="calc-btn" data-number="1">1</button>
                <button class="calc-btn" data-number="2">2</button>
                <button class="calc-btn" data-number="3">3</button>
                <button class="calc-btn operator" data-action="add">+</button>
                
                <button class="calc-btn operator" data-action="negate">±</button>
                <button class="calc-btn" data-number="0">0</button>
                <button class="calc-btn" data-action="decimal">.</button>
                <button class="calc-btn equals" data-action="equals">=</button>
            </div>
        </div>
    `;
}

// Initialize calculator
function initializeCalculator() {
    calculatorState = {
        display: '0',
        previousValue: null,
        operation: null,
        waitingForNewValue: false
    };
    updateCalculatorDisplay();
    setupCalculatorHandlers();
}

function setupCalculatorHandlers() {
    // Number buttons
    $(document).off('click', '.calc-btn[data-number]').on('click', '.calc-btn[data-number]', function() {
        const number = $(this).data('number');
        inputNumber(number);
    });
    
    // Decimal point
    $(document).off('click', '.calc-btn[data-action="decimal"]').on('click', '.calc-btn[data-action="decimal"]', function() {
        inputDecimal();
    });
    
    // Operators
    $(document).off('click', '.calc-btn[data-action="add"]').on('click', '.calc-btn[data-action="add"]', function() {
        setOperation('add');
    });
    
    $(document).off('click', '.calc-btn[data-action="subtract"]').on('click', '.calc-btn[data-action="subtract"]', function() {
        setOperation('subtract');
    });
    
    $(document).off('click', '.calc-btn[data-action="multiply"]').on('click', '.calc-btn[data-action="multiply"]', function() {
        setOperation('multiply');
    });
    
    $(document).off('click', '.calc-btn[data-action="divide"]').on('click', '.calc-btn[data-action="divide"]', function() {
        setOperation('divide');
    });
    
    // Equals
    $(document).off('click', '.calc-btn[data-action="equals"]').on('click', '.calc-btn[data-action="equals"]', function() {
        calculate();
    });
    
    // Clear
    $(document).off('click', '.calc-btn[data-action="clear"]').on('click', '.calc-btn[data-action="clear"]', function() {
        clear();
    });
    
    // Clear Entry
    $(document).off('click', '.calc-btn[data-action="clear-entry"]').on('click', '.calc-btn[data-action="clear-entry"]', function() {
        clearEntry();
    });
    
    // Backspace
    $(document).off('click', '.calc-btn[data-action="backspace"]').on('click', '.calc-btn[data-action="backspace"]', function() {
        backspace();
    });
    
    // Negate
    $(document).off('click', '.calc-btn[data-action="negate"]').on('click', '.calc-btn[data-action="negate"]', function() {
        negate();
    });
    
    // Keyboard support - check if calculator is visible before handling
    $(document).off('keydown.calculator').on('keydown.calculator', function(e) {
        if ($('.app-calculator').is(':visible')) {
            handleKeyboardInput(e);
        }
    });
}

function inputNumber(number) {
    if (calculatorState.waitingForNewValue) {
        calculatorState.display = String(number);
        calculatorState.waitingForNewValue = false;
    } else {
        calculatorState.display = calculatorState.display === '0' ? String(number) : calculatorState.display + number;
    }
    updateCalculatorDisplay();
}

function inputDecimal() {
    if (calculatorState.waitingForNewValue) {
        calculatorState.display = '0.';
        calculatorState.waitingForNewValue = false;
    } else if (calculatorState.display.indexOf('.') === -1) {
        calculatorState.display += '.';
    }
    updateCalculatorDisplay();
}

function setOperation(op) {
    const inputValue = parseFloat(calculatorState.display);
    
    if (calculatorState.previousValue === null) {
        calculatorState.previousValue = inputValue;
    } else if (calculatorState.operation) {
        const result = performCalculation();
        calculatorState.display = String(result);
        calculatorState.previousValue = result;
        updateCalculatorDisplay();
    }
    
    calculatorState.waitingForNewValue = true;
    calculatorState.operation = op;
}

function calculate() {
    const inputValue = parseFloat(calculatorState.display);
    
    if (calculatorState.previousValue === null || calculatorState.operation === null) {
        return;
    }
    
    const result = performCalculation();
    calculatorState.display = String(result);
    calculatorState.previousValue = null;
    calculatorState.operation = null;
    calculatorState.waitingForNewValue = true;
    updateCalculatorDisplay();
}

function performCalculation() {
    const prev = calculatorState.previousValue;
    const current = parseFloat(calculatorState.display);
    
    if (isNaN(prev) || isNaN(current)) {
        return 0;
    }
    
    switch (calculatorState.operation) {
        case 'add':
            return prev + current;
        case 'subtract':
            return prev - current;
        case 'multiply':
            return prev * current;
        case 'divide':
            if (current === 0) {
                return 0; // Prevent division by zero
            }
            return prev / current;
        default:
            return current;
    }
}

function clear() {
    calculatorState.display = '0';
    calculatorState.previousValue = null;
    calculatorState.operation = null;
    calculatorState.waitingForNewValue = false;
    updateCalculatorDisplay();
}

function clearEntry() {
    calculatorState.display = '0';
    calculatorState.waitingForNewValue = false;
    updateCalculatorDisplay();
}

function backspace() {
    if (calculatorState.display.length > 1) {
        calculatorState.display = calculatorState.display.slice(0, -1);
    } else {
        calculatorState.display = '0';
    }
    updateCalculatorDisplay();
}

function negate() {
    const value = parseFloat(calculatorState.display);
    calculatorState.display = String(-value);
    updateCalculatorDisplay();
}

function updateCalculatorDisplay() {
    let displayValue = calculatorState.display;
    
    // Format large numbers
    if (displayValue.length > 12) {
        const num = parseFloat(displayValue);
        if (!isNaN(num)) {
            displayValue = num.toExponential(6);
        }
    }
    
    // Format decimal numbers to avoid unnecessary zeros
    if (displayValue.indexOf('.') !== -1) {
        displayValue = parseFloat(displayValue).toString();
        if (displayValue.indexOf('.') === -1 && calculatorState.display.indexOf('.') !== -1) {
            displayValue += '.';
        }
    }
    
    $('#calc-display').text(displayValue);
}

function handleKeyboardInput(e) {
    const key = e.key;
    
    // Numbers
    if (key >= '0' && key <= '9') {
        e.preventDefault();
        inputNumber(parseInt(key));
    }
    // Decimal point
    else if (key === '.' || key === ',') {
        e.preventDefault();
        inputDecimal();
    }
    // Operators
    else if (key === '+') {
        e.preventDefault();
        setOperation('add');
    }
    else if (key === '-') {
        e.preventDefault();
        setOperation('subtract');
    }
    else if (key === '*') {
        e.preventDefault();
        setOperation('multiply');
    }
    else if (key === '/') {
        e.preventDefault();
        setOperation('divide');
    }
    // Equals
    else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
    }
    // Clear
    else if (key === 'Escape' || key === 'c' || key === 'C') {
        e.preventDefault();
        clear();
    }
    // Backspace
    else if (key === 'Backspace') {
        e.preventDefault();
        backspace();
    }
}

// ====================================
// BOSS MENU APP
// ====================================

// Boss Menu State
let bossMenuData = null;
let bossMenuCurrentTab = 'employees';

function getBossMenuContent() {
    return `
        <div class="app-boss-menu">
            <div class="boss-menu-header">
                <div class="boss-menu-title">
                    <i class="fas fa-briefcase"></i>
                    <h2 id="boss-menu-job-title">Boss Menu</h2>
                </div>
                <div class="boss-menu-balance">
                    <span class="balance-label">Society Balance:</span>
                    <span class="balance-amount" id="boss-menu-balance">$0</span>
                </div>
            </div>
            
            <div class="boss-menu-tabs">
                <button class="boss-tab-btn active" data-tab="employees">
                    <i class="fas fa-users"></i> Employees
                </button>
                <button class="boss-tab-btn" data-tab="finance">
                    <i class="fas fa-dollar-sign"></i> Finance
                </button>
                <button class="boss-tab-btn" data-tab="operations">
                    <i class="fas fa-cog"></i> Operations
                </button>
            </div>
            
            <div class="boss-menu-content">
                <div id="boss-tab-employees" class="boss-tab-content active">
                    ${getBossEmployeesTab()}
                </div>
                <div id="boss-tab-finance" class="boss-tab-content">
                    ${getBossFinanceTab()}
                </div>
                <div id="boss-tab-operations" class="boss-tab-content">
                    ${getBossOperationsTab()}
                </div>
            </div>
        </div>
    `;
}

function getBossEmployeesTab() {
    return `
        <div class="boss-employees-tab">
            <div class="boss-tab-header">
                <h3>Employee Management</h3>
                <button class="btn-primary" id="btn-hire-employee">
                    <i class="fas fa-user-plus"></i> Hire Employee
                </button>
            </div>
            
            <div class="employees-list" id="employees-list">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Loading employees...
                </div>
            </div>
        </div>
    `;
}

function getBossFinanceTab() {
    return `
        <div class="boss-finance-tab">
            <div class="finance-actions">
                <div class="finance-action-card">
                    <h4>Deposit</h4>
                    <input type="number" id="finance-deposit-amount" placeholder="Amount" min="1">
                    <button class="btn-success" id="btn-deposit">Deposit</button>
                </div>
                <div class="finance-action-card">
                    <h4>Withdraw</h4>
                    <input type="number" id="finance-withdraw-amount" placeholder="Amount" min="1">
                    <button class="btn-danger" id="btn-withdraw">Withdraw</button>
                </div>
            </div>
            
            <div class="finance-transactions">
                <h3>Transaction History</h3>
                <div class="transactions-list" id="transactions-list">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i> Loading transactions...
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBossOperationsTab() {
    return `
        <div class="boss-operations-tab">
            <div class="operations-section">
                <h3>Message of the Day (MOTD)</h3>
                <textarea id="boss-motd-input" placeholder="Set a message that employees will see when they clock in..."></textarea>
                <button class="btn-primary" id="btn-save-motd">Save MOTD</button>
            </div>
            
            <div class="operations-section">
                <h3>Business Journal</h3>
                <textarea id="boss-journal-input" placeholder="Keep notes, updates, or important information here for your team..."></textarea>
                <button class="btn-primary" id="btn-save-journal">Save Journal</button>
            </div>
        </div>
    `;
}

// Load Boss Menu Data
// Debounce timer for loadBossMenu to prevent excessive calls
let bossMenuLoadTimer = null;
let isBossMenuLoading = false;

function loadBossMenu(forceRefresh = false) {
    // Prevent multiple simultaneous calls
    if (isBossMenuLoading && !forceRefresh) {
        return;
    }
    
    // Debounce: Wait 200ms before making request (if not forced)
    if (!forceRefresh && bossMenuLoadTimer) {
        clearTimeout(bossMenuLoadTimer);
    }
    
    bossMenuLoadTimer = setTimeout(function() {
        isBossMenuLoading = true;
        
        $.post('https://fractal-laptop/getBossMenuData', JSON.stringify({}), function(response) {
            isBossMenuLoading = false;
            
            if (response.error === 'not_boss') {
                $('#boss-menu-content').html(`
                    <div class="boss-menu-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Access Denied</h3>
                        <p>You must be a boss to access this menu.</p>
                    </div>
                `);
                return;
            }
            
            bossMenuData = response;
            renderBossMenu();
        });
    }, forceRefresh ? 0 : 200);
}

// Render Boss Menu
function renderBossMenu() {
    if (!bossMenuData) return;
    
    // Update header
    $('#boss-menu-job-title').text(bossMenuData.job.label + ' Management');
    $('#boss-menu-balance').text('$' + bossMenuData.job.balance.toLocaleString());
    
    // Render employees
    renderEmployeesList();
    
    // Render transactions
    renderTransactionsList();
    
    // Load MOTD and Journal
    $('#boss-motd-input').val(bossMenuData.motd || '');
    $('#boss-journal-input').val(bossMenuData.journal || '');
}

// Render Employees List
function renderEmployeesList() {
    const employeesList = $('#employees-list');
    
    if (!bossMenuData.employees || bossMenuData.employees.length === 0) {
        employeesList.html(`
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No employees</p>
            </div>
        `);
        return;
    }
    
    let html = '<div class="employees-table">';
    html += '<div class="employees-table-header">';
    html += '<div>Name</div><div>Position</div><div>Payment</div><div>Status</div><div>Actions</div>';
    html += '</div>';
    
    bossMenuData.employees.forEach(emp => {
        const statusBadge = emp.isOnline ? 
            '<span class="status-badge online"><i class="fas fa-circle"></i> Online</span>' : 
            '<span class="status-badge offline"><i class="fas fa-circle"></i> Offline</span>';
        
        html += `
            <div class="employees-table-row">
                <div>${emp.name}</div>
                <div>${emp.gradeName}</div>
                <div>$${emp.payment}/hr</div>
                <div>${statusBadge}</div>
                <div class="employee-actions">
                    <select class="grade-select" data-citizenid="${emp.citizenid}" data-name="${emp.name}" data-current-grade="${emp.grade}">
                        ${bossMenuData.grades.map(g => `
                            <option value="${g.level}" ${g.level === emp.grade ? 'selected' : ''}>
                                ${g.name} ($${g.payment}/hr)
                            </option>
                        `).join('')}
                    </select>
                    <button class="btn-bonus" data-citizenid="${emp.citizenid}" data-name="${emp.name}" title="Give Bonus">
                        <i class="fas fa-gift"></i>
                    </button>
                    ${!emp.isboss ? `<button class="btn-fire" data-citizenid="${emp.citizenid}" data-name="${emp.name}" title="Fire Employee">
                        <i class="fas fa-user-times"></i>
                    </button>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    employeesList.html(html);
}

// Render Transactions List  
function renderTransactionsList() {
    const transactionsList = $('#transactions-list');
    
    if (!bossMenuData.transactions || bossMenuData.transactions.length === 0) {
        transactionsList.html(`
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transaction history</p>
            </div>
        `);
        return;
    }
    
    let html = '<div class="transactions-table">';
    html += '<div class="transactions-table-header">';
    html += '<div>Date</div><div>Type</div><div>Amount</div><div>Description</div>';
    html += '</div>';
    
    bossMenuData.transactions.forEach(txn => {
        const amount = parseFloat(txn.amount || 0);
        const amountClass = amount >= 0 ? 'positive' : 'negative';
        const amountSign = amount >= 0 ? '+' : '';
        const date = new Date(txn.created_at).toLocaleString();
        
        html += `
            <div class="transactions-table-row">
                <div>${date}</div>
                <div>${txn.transaction_type || 'N/A'}</div>
                <div class="${amountClass}">${amountSign}$${Math.abs(amount).toLocaleString()}</div>
                <div>${txn.description || 'N/A'}</div>
            </div>
        `;
    });
    
    html += '</div>';
    transactionsList.html(html);
}

// Boss Menu Tab Switching
$(document).on('click', '.boss-tab-btn', function() {
    const tab = $(this).data('tab');
    
    $('.boss-tab-btn').removeClass('active');
    $(this).addClass('active');
    
    $('.boss-tab-content').removeClass('active');
    $(`#boss-tab-${tab}`).addClass('active');
    
    bossMenuCurrentTab = tab;
});

// Boss Menu Event Handlers
$(document).on('click', '#btn-hire-employee', function() {
    showHireEmployeeModal();
});

$(document).on('change', '.grade-select', function() {
    const selectEl = $(this);
    const citizenid = selectEl.data('citizenid');
    const employeeName = selectEl.data('name') || 'this employee';
    const currentGrade = selectEl.data('current-grade');
    const newGrade = selectEl.val();
    const gradeLabel = selectEl.find('option:selected').text();
    
    if (newGrade == currentGrade) {
        return;
    }
    
    showConfirmDialog({
        title: 'Change Position',
        message: `Change ${employeeName}'s position to ${gradeLabel}?`,
        confirmText: 'Change',
        onConfirm: function() {
            $.post('https://fractal-laptop/updateEmployeeGrade', JSON.stringify({
                targetCitizenid: citizenid,
                newGrade: newGrade
            }), function() {
                selectEl.data('current-grade', newGrade);
                loadBossMenu(true); // Force refresh after grade change
            });
        },
        onCancel: function() {
            selectEl.val(currentGrade);
        }
    });
});

$(document).on('click', '.btn-fire', function() {
    const citizenid = $(this).data('citizenid');
    const employeeName = $(this).data('name') || 'this employee';
    
    showConfirmDialog({
        title: 'Fire Employee',
        message: `Are you sure you want to fire ${employeeName}?`,
        confirmText: 'Fire',
        onConfirm: function() {
            $.post('https://fractal-laptop/fireEmployee', JSON.stringify({
                targetCitizenid: citizenid
            }), function() {
                loadBossMenu(true); // Force refresh after firing employee
            });
        }
    });
});

$(document).on('click', '.btn-bonus', function() {
    const citizenid = $(this).data('citizenid');
    const amount = prompt('Enter bonus amount:');
    
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        $.post('https://fractal-laptop/giveEmployeeBonus', JSON.stringify({
            targetCitizenid: citizenid,
            amount: parseFloat(amount)
        }), function(response) {
            loadBossMenu(true); // Force refresh after bonus
        });
    }
});

$(document).on('click', '#btn-deposit', function() {
    const amount = parseFloat($('#finance-deposit-amount').val());
    
    if (!amount || amount <= 0) {
        showNotification('Error', 'Please enter a valid amount', 'error');
        return;
    }
    
    showConfirmDialog({
        title: 'Confirm Deposit',
        message: `Deposit $${amount.toLocaleString()} to society account?`,
        confirmText: 'Deposit',
        onConfirm: function() {
            $.post('https://fractal-laptop/depositSocietyMoney', JSON.stringify({
                amount: amount
            }), function() {
                $('#finance-deposit-amount').val('');
                // Wait for server event to trigger refresh
            });
        }
    });
});

$(document).on('click', '#btn-withdraw', function() {
    const amount = parseFloat($('#finance-withdraw-amount').val());
    
    if (!amount || amount <= 0) {
        showNotification('Error', 'Please enter a valid amount', 'error');
        return;
    }
    
    showConfirmDialog({
        title: 'Confirm Withdrawal',
        message: `Withdraw $${amount.toLocaleString()} from society account?`,
        confirmText: 'Withdraw',
        onConfirm: function() {
            $.post('https://fractal-laptop/withdrawSocietyMoney', JSON.stringify({
                amount: amount
            }), function() {
                $('#finance-withdraw-amount').val('');
                // Wait for server event to trigger refresh
            });
        }
    });
});

$(document).on('click', '#btn-save-motd', function() {
    const motd = $('#boss-motd-input').val();
    
    $.post('https://fractal-laptop/saveMOTD', JSON.stringify({
        motd: motd
    }), function(response) {
        showNotification('Success', 'MOTD saved successfully', 'success');
    });
});

$(document).on('click', '#btn-save-journal', function() {
    const journal = $('#boss-journal-input').val();
    
    $.post('https://fractal-laptop/saveJournal', JSON.stringify({
        journal: journal
    }), function(response) {
        showNotification('Success', 'Journal saved successfully', 'success');
    });
});

// Hire Employee Modal
function showHireEmployeeModal() {
    $.post('https://fractal-laptop/getOnlinePlayers', JSON.stringify({}), function(response) {
        if (!response || response.length === 0) {
            showNotification('Info', 'No unemployed players online', 'info');
            return;
        }
        
        let modalHtml = '<div class="modal-overlay" id="hire-employee-modal">';
        modalHtml += '<div class="modal-content">';
        modalHtml += '<div class="modal-header"><h3>Hire Employee</h3><button class="modal-close">&times;</button></div>';
        modalHtml += '<div class="modal-body">';
        modalHtml += '<div class="players-list">';
        
        response.forEach(player => {
            modalHtml += `<div class="player-item" data-citizenid="${player.citizenid}">`;
            modalHtml += `<div class="player-name">${player.name}</div>`;
            modalHtml += `<button class="btn-primary btn-hire">Hire</button>`;
            modalHtml += `</div>`;
        });
        
        modalHtml += '</div></div></div></div>';
        
        $('body').append(modalHtml);
    });
}

$(document).on('click', '.btn-hire', function() {
    const citizenid = $(this).closest('.player-item').data('citizenid');
    
    $.post('https://fractal-laptop/hireEmployee', JSON.stringify({
        targetCitizenid: citizenid
    }), function(response) {
        $('#hire-employee-modal').remove();
        loadBossMenu(true); // Force refresh after hiring
    });
});

$(document).on('click', '.modal-close, .modal-overlay', function(e) {
    if (e.target === this) {
        $(this).closest('.modal-overlay').remove();
    }
});

// ====================================
// MINING MONITOR APP
// ====================================

let miningMonitorData = null;
let miningMonitorUpdateInterval = null;
let miningChart = null;
let currentCryptoSymbol = 'FBT'; // Default symbol

function getMiningMonitorContent() {
    return `
        <div class="app-mining-monitor">
            <div class="mining-monitor-header">
                <div class="monitor-title">
                    <i class="fas fa-server"></i>
                    <h2>Crypto Mining Monitor</h2>
                </div>
                <div class="monitor-refresh">
                    <button class="btn-icon" id="btn-refresh-miners" title="Refresh Data">
                        <i class="fas fa-sync"></i>
                    </button>
                </div>
            </div>
            
            <div class="mining-stats-grid" id="mining-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Total Miners</div>
                        <div class="stat-value" id="stat-total-miners">0</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Active Mining</div>
                        <div class="stat-value" id="stat-active-miners">0</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Total Crypto</div>
                        <div class="stat-value" id="stat-total-crypto">0</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <i class="fas fa-tachometer-alt"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">Total Hashrate</div>
                        <div class="stat-value" id="stat-total-hashrate">0 H/s</div>
                    </div>
                </div>
            </div>
            
            <div class="mining-charts-section">
                <div class="chart-container">
                    <h3>Mining Status Distribution</h3>
                    <canvas id="mining-status-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Hashrate Distribution</h3>
                    <canvas id="hashrate-distribution-chart"></canvas>
                </div>
            </div>
            
            <div class="miners-list-section">
                <div class="section-header">
                    <h3>Active Miners</h3>
                    <div class="filter-controls">
                        <select id="filter-miner-status" class="filter-select">
                            <option value="all">All Status</option>
                            <option value="mining">Mining</option>
                            <option value="idle">Idle</option>
                        </select>
                    </div>
                </div>
                <div class="miners-list" id="miners-list">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i> Loading miners...
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadMiningMonitor() {
    console.log('[Mining Monitor] Loading mining monitor data...');
    
    // Request mining data from server
    $.post('https://fractal-laptop/getMiningMonitorData', JSON.stringify({}), function(data) {
        console.log('[Mining Monitor] Received data:', data);
        
        if (!data) {
            console.error('[Mining Monitor] No data received');
            $('#miners-list').html(`
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No data received from server</p>
                </div>
            `);
            return;
        }
        
        if (data.error) {
            console.error('[Mining Monitor] Error:', data.error);
            $('#miners-list').html(`
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${data.error}</p>
                </div>
            `);
            // Still render stats with zeros
            if (data.stats) {
                renderMiningMonitor(data);
            }
            return;
        }
        
        miningMonitorData = data;
        currentCryptoSymbol = data.cryptoSymbol || 'FBT'; // Update global symbol
        renderMiningMonitor(data);
        
        // Set up auto-refresh every 10 seconds
        if (miningMonitorUpdateInterval) {
            clearInterval(miningMonitorUpdateInterval);
        }
        miningMonitorUpdateInterval = setInterval(function() {
            refreshMiningMonitor();
        }, 10000);
    }).fail(function(xhr, status, error) {
        console.error('[Mining Monitor] Request failed:', status, error);
        $('#miners-list').html(`
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load data: ${error}</p>
            </div>
        `);
    });
    
    // Refresh button
    $(document).off('click', '#btn-refresh-miners').on('click', '#btn-refresh-miners', function() {
        refreshMiningMonitor();
    });
    
    // Filter change
    $(document).off('change', '#filter-miner-status').on('change', '#filter-miner-status', function() {
        renderMinersList(miningMonitorData);
    });
}

function refreshMiningMonitor() {
    $.post('https://fractal-laptop/getMiningMonitorData', JSON.stringify({}), function(data) {
        if (!data.error) {
            miningMonitorData = data;
            currentCryptoSymbol = data.cryptoSymbol || 'FBT'; // Update global symbol
            renderMiningMonitor(data);
        }
    });
}

function renderMiningMonitor(data) {
    console.log('[Mining Monitor] Rendering data:', data);
    
    if (!data) {
        console.error('[Mining Monitor] No data to render');
        $('#miners-list').html(`
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No data available</p>
            </div>
        `);
        return;
    }
    
    // Ensure data structure is correct
    if (!data.stats) {
        data.stats = { totalMiners: 0, activeMiners: 0, totalCrypto: 0, totalHashrate: 0 };
    }
    if (!data.miners) {
        data.miners = [];
    }
    
    // Update stats
    const stats = data.stats;
    $('#stat-total-miners').text(stats.totalMiners || 0);
    $('#stat-active-miners').text(stats.activeMiners || 0);
    $('#stat-total-crypto').text(formatCrypto(stats.totalCrypto || 0));
    $('#stat-total-hashrate').text(formatHashrate(stats.totalHashrate || 0));
    
    // Render charts
    renderMiningCharts(data);
    
    // Render miners list
    renderMinersList(data);
}

function renderMiningCharts(data) {
    if (!data) {
        console.error('[Mining Monitor] No data provided to renderMiningCharts');
        return;
    }
    
    // Status Distribution Chart
    const statusCtx = document.getElementById('mining-status-chart');
    if (statusCtx) {
        if (miningChart && miningChart.statusChart) {
            miningChart.statusChart.destroy();
        }
        
        const stats = data.stats || {};
        const activeCount = stats.activeMiners || 0;
        const idleCount = (stats.totalMiners || 0) - activeCount;
        
        miningChart = miningChart || {};
        miningChart.statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Active Mining', 'Idle'],
                datasets: [{
                    data: [activeCount, idleCount],
                    backgroundColor: ['#4CAF50', '#9E9E9E'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Hashrate Distribution Chart
    const hashrateCtx = document.getElementById('hashrate-distribution-chart');
    if (hashrateCtx) {
        if (miningChart && miningChart.hashrateChart) {
            miningChart.hashrateChart.destroy();
        }
        
        const miners = data.miners || [];
        
        // Group miners by hashrate ranges
        const ranges = [0, 10, 50, 100, 500, 1000];
        const labels = ['0-10', '10-50', '50-100', '100-500', '500-1000', '1000+'];
        const counts = new Array(labels.length).fill(0);
        
        if (miners.length > 0) {
            miners.forEach(miner => {
                const hashrate = miner.hashrate || 0;
                for (let i = ranges.length - 1; i >= 0; i--) {
                    if (hashrate >= ranges[i]) {
                        counts[i]++;
                        break;
                    }
                }
            });
        }
        
        miningChart = miningChart || {};
        miningChart.hashrateChart = new Chart(hashrateCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Miners',
                    data: counts,
                    backgroundColor: '#00BCD4',
                    borderColor: '#0097A7',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

function renderMinersList(data) {
    if (!data) {
        console.error('[Mining Monitor] No data provided to renderMinersList');
        $('#miners-list').html(`
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No data available</p>
            </div>
        `);
        return;
    }
    
    const miners = data.miners || [];
    
    if (miners.length === 0) {
        $('#miners-list').html(`
            <div class="empty-state">
                <i class="fas fa-server"></i>
                <p>No active miners found</p>
            </div>
        `);
        return;
    }
    
    const filter = $('#filter-miner-status').val() || 'all';
    let filteredMiners = miners;
    
    if (filter === 'mining') {
        filteredMiners = miners.filter(m => m.isMining === true);
    } else if (filter === 'idle') {
        filteredMiners = miners.filter(m => !m.isMining || m.isMining === false);
    }
    
    if (filteredMiners.length === 0) {
        $('#miners-list').html(`
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <p>No miners match the selected filter</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    filteredMiners.forEach(miner => {
        const statusClass = miner.isMining ? 'status-mining' : 'status-idle';
        const statusText = miner.isMining ? 'Mining' : 'Idle';
        const runtimeText = formatRuntime(miner.totalRuntime || 0);
        
        html += `
            <div class="miner-card">
                <div class="miner-header">
                    <div class="miner-id">
                        <i class="fas fa-server"></i>
                        <span>Miner #${miner.minerid || 'Unknown'}</span>
                    </div>
                    <div class="miner-status ${statusClass}">
                        <span class="status-dot"></span>
                        ${statusText}
                    </div>
                </div>
                <div class="miner-info">
                    <div class="info-row">
                        <span class="info-label">Owner:</span>
                        <span class="info-value">${miner.owner || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Hashrate:</span>
                        <span class="info-value">${formatHashrate(miner.hashrate || 0)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Crypto Balance:</span>
                        <span class="info-value">${formatCrypto(miner.cryptoBalance || 0)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Runtime:</span>
                        <span class="info-value">${runtimeText}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Parts:</span>
                        <span class="info-value">${miner.partsCount || 0} installed</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    $('#miners-list').html(html);
}

function formatCrypto(amount) {
    return parseFloat(amount).toFixed(4) + ' ' + currentCryptoSymbol;
}

function formatHashrate(hashrate) {
    if (hashrate >= 1000) {
        return (hashrate / 1000).toFixed(2) + ' KH/s';
    }
    return hashrate.toFixed(2) + ' H/s';
}

function formatRuntime(seconds) {
    if (seconds < 60) {
        return seconds + 's';
    } else if (seconds < 3600) {
        return Math.floor(seconds / 60) + 'm';
    } else if (seconds < 86400) {
        return Math.floor(seconds / 3600) + 'h';
    } else {
        return Math.floor(seconds / 86400) + 'd';
    }
}

// ====================================
// CRYPTO WASH APP
// ====================================

let activeWashId = null;
let washUpdateInterval = null;

function getCryptoWashContent() {
    return `
        <div class="app-crypto-wash">
            <div class="crypto-wash-header">
                <div class="wash-title">
                    <i class="fas fa-shield-halved"></i>
                    <h2>Crypto Wash</h2>
                </div>
                <div class="wash-status" id="wash-status-indicator">
                    <span class="status-badge status-ready">Ready</span>
                </div>
            </div>
            
            <div class="crypto-wash-content" id="crypto-wash-content">
                <div class="wash-tabs">
                    <button class="wash-tab active" data-tab="setup" id="tab-setup">
                        <i class="fas fa-plus-circle"></i> New Wash
                    </button>
                    <button class="wash-tab" data-tab="history" id="tab-history">
                        <i class="fas fa-history"></i> History
                    </button>
                </div>
                
                <div class="wash-setup-section" id="wash-setup-section">
                    <div class="section-card">
                        <h3><i class="fas fa-memory"></i> Select USB Drive</h3>
                        <div id="usb-list-container">
                            <div class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Loading USB drives...</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section-card" id="wash-config-section" style="display: none;">
                        <h3><i class="fas fa-cog"></i> Wash Configuration</h3>
                        <div class="form-group">
                            <label>Crypto Amount</label>
                            <div class="input-with-button">
                                <input type="number" id="wash-crypto-amount" step="0.001" min="0.001" placeholder="0.000">
                                <button type="button" class="btn-max" id="btn-max-crypto">Max</button>
                            </div>
                            <span class="input-info" id="wash-crypto-max">Max: 0.000</span>
                        </div>
                        <div class="form-group">
                            <label>Supervisor Cut (%)</label>
                            <div class="input-with-info">
                                <input type="number" id="wash-supervisor-cut" step="1" min="5" max="50" value="15">
                                <span class="input-info">Min: 5% | Max: 50%</span>
                            </div>
                        </div>
                        <div class="wash-preview" id="wash-preview">
                            <div class="preview-item">
                                <span>Total Value:</span>
                                <span id="preview-total-value">$0</span>
                            </div>
                            <div class="preview-item">
                                <span>Supervisor Cut:</span>
                                <span id="preview-supervisor-cut">$0</span>
                            </div>
                            <div class="preview-item highlight">
                                <span>Your Payout:</span>
                                <span id="preview-owner-payout">$0</span>
                            </div>
                        </div>
                        <button class="btn-primary btn-start-wash" id="btn-start-wash">
                            <i class="fas fa-play"></i> Start Wash
                        </button>
                    </div>
                </div>
                
                <div class="wash-progress-section" id="wash-progress-section" style="display: none;">
                    <div class="section-card">
                        <h3><i class="fas fa-hourglass-half"></i> Wash in Progress</h3>
                        <div class="wash-info">
                            <div class="info-item">
                                <span>Wash ID:</span>
                                <span id="wash-id-display">-</span>
                            </div>
                            <div class="info-item">
                                <span>Crypto Amount:</span>
                                <span id="wash-amount-display">-</span>
                            </div>
                            <div class="info-item">
                                <span>Estimated Time:</span>
                                <span id="wash-time-display">-</span>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar" id="wash-progress-bar">
                                    <div class="progress-fill" id="wash-progress-fill" style="width: 0%"></div>
                                </div>
                                <div class="progress-text" id="wash-progress-text">0%</div>
                            </div>
                        </div>
                        <div class="wash-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Warning: Large amounts increase the risk of detection by law enforcement.</p>
                        </div>
                    </div>
                </div>
                
                <div class="wash-history-section" id="wash-history-section" style="display: none;">
                    <div class="section-card">
                        <h3><i class="fas fa-history"></i> Wash History</h3>
                        <div id="wash-history-list">
                            <div class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Loading history...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadCryptoWash() {
    console.log('[Crypto Wash] Loading...');
    
    // Check permissions first
    $.post('https://fractal-laptop/startCryptoWash', JSON.stringify({}), function(data) {
        if (!data.success) {
            $('#crypto-wash-content').html(`
                <div class="empty-state">
                    <i class="fas fa-lock"></i>
                    <h3>Access Denied</h3>
                    <p>${data.error || 'You do not have permission to use Crypto Wash'}</p>
                    <p class="help-text">Requires Supervisor level or above in a whitelisted job.</p>
                </div>
            `);
            return;
        }
        
        // Check for active washes first
        checkForActiveWashes();
    }).fail(function() {
        $('#crypto-wash-content').html(`
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to connect to server</p>
            </div>
        `);
    });
}

function checkForActiveWashes() {
    $.post('https://fractal-laptop/getMyActiveWashes', JSON.stringify({}), function(data) {
        if (data.success && data.washes && data.washes.length > 0) {
            // Found active wash, restore progress
            const activeWash = data.washes[0]; // Use first active wash
            console.log('[Crypto Wash] Found active wash, restoring progress:', activeWash);
            activeWashId = activeWash.washId;
            showWashProgress({
                washId: activeWash.washId,
                cryptoAmount: activeWash.cryptoAmount,
                cryptoSymbol: activeWash.cryptoSymbol,
                endTime: activeWash.endTime
            });
        } else {
            // No active washes, load USB drives
            loadCryptoWashUSBs();
        }
    }).fail(function() {
        // On error, just load USB drives
        loadCryptoWashUSBs();
    });
}

// Tab switching
$(document).on('click', '.wash-tab', function() {
    const tab = $(this).data('tab');
    
    // Update tab buttons
    $('.wash-tab').removeClass('active');
    $(this).addClass('active');
    
    // Hide all sections
    $('#wash-setup-section').hide();
    $('#wash-progress-section').hide();
    $('#wash-history-section').hide();
    
    // Show selected section
    if (tab === 'setup') {
        $('#wash-setup-section').show();
        // Reload USB drives if needed
        if ($('#usb-list-container').children().length === 0) {
            loadCryptoWashUSBs();
        }
    } else if (tab === 'history') {
        $('#wash-history-section').show();
        loadWashHistory();
    }
});

function loadWashHistory() {
    $.post('https://fractal-laptop/getWashHistory', JSON.stringify({}), function(data) {
        if (!data.success || !data.washes || data.washes.length === 0) {
            $('#wash-history-list').html(`
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No wash history found</p>
                    <p class="help-text">Completed washes will appear here.</p>
                </div>
            `);
            return;
        }
        
        let html = '<div class="history-list">';
        data.washes.forEach(wash => {
            // Handle MySQL TIMESTAMP format (YYYY-MM-DD HH:MM:SS)
            let completedDate;
            if (wash.completedAt) {
                // MySQL TIMESTAMP comes as string, parse it
                completedDate = new Date(wash.completedAt.replace(' ', 'T'));
            } else {
                completedDate = new Date();
            }
            const dateStr = completedDate.toLocaleDateString() + ' ' + completedDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            
            html += `
                <div class="history-item">
                    <div class="history-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="history-info">
                        <div class="history-header">
                            <span class="history-amount">${wash.cryptoAmount} ${wash.cryptoSymbol}</span>
                            <span class="history-date">${dateStr}</span>
                        </div>
                        <div class="history-details">
                            <span>Wash ID: ${wash.washId}</span>
                            <span>•</span>
                            <span>Supervisor: ${wash.supervisorName}</span>
                            <span>•</span>
                            <span>Cut: ${wash.supervisorCutPercent}%</span>
                        </div>
                        <div class="history-payout">
                            <span>Total Value: $${wash.cashValue.toFixed(2)}</span>
                            <span>•</span>
                            <span>Your Payout: $${wash.ownerPayout.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        $('#wash-history-list').html(html);
    }).fail(function() {
        $('#wash-history-list').html(`
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load history</p>
            </div>
        `);
    });
}

function loadCryptoWashUSBs() {
    $.post('https://fractal-laptop/getCryptoWashUSBs', JSON.stringify({}), function(data) {
        if (!data.success || !data.usbs || data.usbs.length === 0) {
            $('#usb-list-container').html(`
                <div class="empty-state">
                    <i class="fas fa-memory"></i>
                    <p>No USB drives with crypto found</p>
                    <p class="help-text">You need a USB drive with crypto from a crypto miner.</p>
                </div>
            `);
            return;
        }
        
        let html = '<div class="usb-list">';
        data.usbs.forEach(usb => {
            html += `
                <div class="usb-item" data-slot="${usb.slot}" data-crypto="${usb.crypto}">
                    <div class="usb-icon">
                        <i class="fas fa-memory"></i>
                    </div>
                    <div class="usb-info">
                        <div class="usb-label">${usb.label}</div>
                        <div class="usb-crypto">${usb.crypto} ${usb.symbol}</div>
                    </div>
                    <button class="btn-select-usb">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        $('#usb-list-container').html(html);
    });
}

// USB selection handler
$(document).on('click', '.usb-item', function() {
    const slot = $(this).data('slot');
    const maxCrypto = parseFloat($(this).data('crypto'));
    
    $('#wash-crypto-max').text(`Max: ${maxCrypto.toFixed(3)}`);
    $('#wash-crypto-amount').attr('max', maxCrypto);
    $('#wash-config-section').data('usb-slot', slot).data('max-crypto', maxCrypto).show();
    
    // Update preview on input
    $('#wash-crypto-amount, #wash-supervisor-cut').off('input').on('input', updateWashPreview);
});

// Max button handler
$(document).on('click', '#btn-max-crypto', function() {
    const maxCrypto = parseFloat($('#wash-config-section').data('max-crypto')) || 0;
    if (maxCrypto > 0) {
        $('#wash-crypto-amount').val(maxCrypto.toFixed(3));
        updateWashPreview();
    }
});

function updateWashPreview() {
    const cryptoAmount = parseFloat($('#wash-crypto-amount').val()) || 0;
    const supervisorCut = parseFloat($('#wash-supervisor-cut').val()) || 15;
    const maxCrypto = parseFloat($('#wash-crypto-max').text().replace('Max: ', '')) || 0;
    
    if (cryptoAmount > maxCrypto) {
        $('#wash-crypto-amount').val(maxCrypto);
        return;
    }
    
    // Get crypto price (default 150)
    const cryptoPrice = 150; // Could be fetched from server
    const totalValue = cryptoAmount * cryptoPrice;
    const supervisorAmount = totalValue * (supervisorCut / 100);
    const ownerAmount = totalValue - supervisorAmount;
    
    $('#preview-total-value').text('$' + totalValue.toFixed(2));
    $('#preview-supervisor-cut').text('$' + supervisorAmount.toFixed(2));
    $('#preview-owner-payout').text('$' + ownerAmount.toFixed(2));
}

// Start wash handler
$(document).on('click', '#btn-start-wash', function() {
    const usbSlot = $('#wash-config-section').data('usb-slot');
    const maxCrypto = parseFloat($('#wash-config-section').data('max-crypto')) || 0;
    const cryptoAmount = parseFloat($('#wash-crypto-amount').val()) || 0;
    const supervisorCut = parseFloat($('#wash-supervisor-cut').val()) || 15;
    
    // Validate crypto available
    if (maxCrypto <= 0 || !usbSlot) {
        showNotification('No Crypto Available', 'No crypto found on USB drive', 'error');
        return;
    }
    
    if (cryptoAmount <= 0) {
        showNotification('Invalid Amount', 'Please enter a valid crypto amount', 'error');
        return;
    }
    
    if (cryptoAmount > maxCrypto) {
        showNotification('Insufficient Crypto', `You only have ${maxCrypto.toFixed(3)} crypto on this USB`, 'error');
        return;
    }
    
    $.post('https://fractal-laptop/startCryptoWash', JSON.stringify({
        usbSlot: usbSlot,
        cryptoAmount: cryptoAmount,
        supervisorCut: supervisorCut
    }), function(data) {
        if (data.success) {
            showNotification('Wash Started', 'Crypto wash operation started successfully', 'success');
            // Will be handled by client event
        } else {
            showNotification('Error', data.error || 'Failed to start wash', 'error');
        }
    }).fail(function() {
        showNotification('Error', 'Failed to connect to server', 'error');
    });
});

// Client events
window.addEventListener('message', function(event) {
    const data = event.data;
    
    console.log('[Crypto Wash] Received message:', data);
    
    if (data.action === 'cryptoWashStarted') {
        console.log('[Crypto Wash] Wash started, showing progress:', data);
        activeWashId = data.washId;
        showWashProgress({
            washId: data.washId,
            cryptoAmount: data.cryptoAmount,
            cryptoSymbol: data.cryptoSymbol,
            endTime: data.endTime
        });
    } else if (data.action === 'cryptoWashCompleted') {
        if (data.washId === activeWashId) {
            showNotification('Wash Completed', 'Your crypto has been successfully cleaned!', 'success');
            activeWashId = null;
            if (washUpdateInterval) {
                clearInterval(washUpdateInterval);
                washUpdateInterval = null;
            }
            setTimeout(() => loadCryptoWash(), 2000); // Reload after 2 seconds
        }
    } else if (data.action === 'cryptoWashAlert') {
        // Law enforcement alert (could show notification)
        console.log('[Crypto Wash] Alert triggered:', data);
    }
});

function showWashProgress(washData) {
    console.log('[Crypto Wash] Showing progress for wash:', washData);
    
    $('#wash-setup-section').hide();
    $('#wash-progress-section').show();
    $('#wash-status-indicator').html('<span class="status-badge status-active">Washing</span>');
    
    $('#wash-id-display').text(washData.washId || '-');
    $('#wash-amount-display').text(`${washData.cryptoAmount || 0} ${washData.cryptoSymbol || 'FBT'}`);
    
    // Clear any existing interval
    if (washUpdateInterval) {
        clearInterval(washUpdateInterval);
        washUpdateInterval = null;
    }
    
    // Start progress updates
    washUpdateInterval = setInterval(function() {
        if (activeWashId) {
            updateWashProgress(activeWashId);
        } else {
            clearInterval(washUpdateInterval);
            washUpdateInterval = null;
        }
    }, 1000);
    
    // Initial update
    updateWashProgress(washData.washId);
}

// Clean up interval when window closes
function cleanupCryptoWash() {
    console.log('[Crypto Wash] Cleaning up intervals (window closed)');
    // Don't clear activeWashId - we want to restore it when reopening
    // Just stop the interval updates
    if (washUpdateInterval) {
        clearInterval(washUpdateInterval);
        washUpdateInterval = null;
    }
}

function updateWashProgress(washId) {
    if (!washId) {
        console.error('[Crypto Wash] No washId provided to updateWashProgress');
        return;
    }
    
    $.post('https://fractal-laptop/getCryptoWashProgress', JSON.stringify({washId: washId}), function(data) {
        if (data.success) {
            const progress = Math.min(100, Math.max(0, data.progress || 0));
            
            // Only update UI if progress section is visible
            if ($('#wash-progress-section').is(':visible')) {
                $('#wash-progress-fill').css('width', progress + '%');
                $('#wash-progress-text').text(progress.toFixed(1) + '%');
                
                if (data.endTime) {
                    const remaining = Math.max(0, data.endTime - Date.now());
                    const minutes = Math.floor(remaining / 60000);
                    const seconds = Math.floor((remaining % 60000) / 1000);
                    $('#wash-time-display').text(`${minutes}m ${seconds}s`);
                }
            }
            
            if (data.status === 'completed') {
                if (washUpdateInterval) {
                    clearInterval(washUpdateInterval);
                    washUpdateInterval = null;
                }
                
                // Mark as completed to prevent notification spam
                const wasActive = activeWashId === washId;
                activeWashId = null;
                
                // Show notification only once if window is open and this was the active wash
                if (wasActive && $('#wash-progress-section').is(':visible')) {
                    showNotification('Wash Completed', 'Your crypto has been successfully cleaned!', 'success');
                    // Reload after a delay to show completion
                    setTimeout(() => {
                        // Switch to history tab and reload
                        $('.wash-tab[data-tab="history"]').click();
                        loadWashHistory();
                    }, 2000);
                } else {
                    // Window is closed or not active, just reload when reopened
                    console.log('[Crypto Wash] Wash completed but window is closed or not active');
                }
            }
        } else {
            console.error('[Crypto Wash] Failed to get progress:', data.error);
            // If wash not found, it might be completed
            if (data.error && data.error.includes('not found')) {
                if (washUpdateInterval) {
                    clearInterval(washUpdateInterval);
                    washUpdateInterval = null;
                }
                activeWashId = null;
            }
        }
    }).fail(function() {
        console.error('[Crypto Wash] Failed to connect to server for progress update');
    });
}

console.log('%c📱 Apps Module Loaded', 'color: #EA4335; font-weight: bold;');

