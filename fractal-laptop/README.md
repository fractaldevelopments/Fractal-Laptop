# 💻 Fractal Laptop-OS

**A Modern, Fully-Functional Operating System for FiveM**

Transform your FiveM server with a beautifully designed, highly customizable laptop system that players can actually use. Built with performance, extensibility, and user experience in mind.

---

## ✨ Features

### 🎨 Beautiful Modern UI
- **Glassmorphism Design** - Stunning translucent windows with blur effects
- **Dark & Light Modes** - Seamlessly switch between themes
- **Smooth Animations** - Polished, professional transitions
- **Responsive Layout** - Scales perfectly at 80vw x 80vh
- **Custom Wallpapers** - Add your own backgrounds
- **Window Management** - Drag, resize, minimize, maximize

### 📱 Built-in Applications
- **Boss Menu** - Complete employee & society fund management  
- **Browser** - Multi-page internet with homepage, news, banking, marketplace, jobs, crypto exchange, directory, and map
- **Calculator** - Fully functional with keyboard support
- **Crypto Wallet** - Send/receive cryptocurrency between players
- **Settings** - Customize wallpapers, themes, and preferences
- **Chat** - Messaging system
- **Email** - Internal email client
- **Notes** - Take and save notes
- **File Manager** - Browse files and folders

### 🔐 Advanced Features
- **VPN System** - Unlock dark web access with VPN cards
- **.onion Sites** - Silk Road marketplace and BlackHat forums
- **USB Apps** - Plug-and-play application system
- **Real-time Updates** - Live data synchronization
- **Transaction History** - Complete audit trails
- **Notification System** - In-game alerts and updates

### 🛠️ Developer Friendly
- **Modular Architecture** - Easy to extend
- **Custom App Support** - Create your own applications
- **Well-Documented Code** - Clear comments throughout
- **App Templates Included** - Get started quickly
- **Framework Agnostic** - Works with QBCore and ESX

---

## 📋 Requirements

### Essential
- ✅ **QBCore** or **ESX** framework  
- ✅ **MySQL** / **OxMySQL**  
- ✅ **qb-target** or **ox_target**  
- ✅ **lj-inventory** (or compatible inventory system)

### Optional
- ⚠️ **Fractal Crypto Miner** (unlocks premium features)
- ⚠️ **qb-management** (for full boss menu features)

---

## 🚀 Installation

### 1. Add Resource
Extract `fractal-laptop` to `resources/[custom]/` and add to `server.cfg`:

```cfg
ensure fractal-laptop
```

### 2. Add Laptop Item
In `qb-core/shared/items.lua` add:

```lua
['laptop'] = {
    name = 'laptop',
    label = 'Laptop',
    weight = 2000,
    type = 'item',
    image = 'laptop.png',
    unique = true,
    useable = true,
    shouldClose = true,
    description = 'A powerful laptop running FractalOS'
}
```

### 3. Install Database
**Option A (Auto-Install):** Tables create automatically on first start

**Option B (Manual):** Run `INSTALL_DATABASE.sql` in HeidiSQL

### 4. Add Laptop Image
Place `laptop.png` in your inventory's image folder:
- `lj-inventory/html/images/laptop.png`

### 5. Restart Server
```bash
restart qb-core
restart fractal-laptop
```

**Done!** Players can now use laptops in-game!

---

## ⚙️ Configuration

### Framework Setup
```lua
Config.Framework = 'qb-core'  -- or 'esx'
```

### Boss Menu Jobs
```lua
Config.BossMenu = {
    whitelistedJobs = {
        'police',
        'ambulance',
        'mechanic',
        'realestate'
    },
    permissions = {
        requireBoss = true,
        minGrade = 3
    }
}
```

### VPN System
```lua
Config.VPN = {
    enabled = true,
    itemName = 'vpn_card',
    restricted_sites = {
        'darkweb',
        'silk_road',
        'blackhat_forums'
    }
}
```

### Wallpapers
```lua
Config.Wallpapers = {
    {
        id = 'default',
        name = 'Default',
        url = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id = 'custom',
        name = 'Custom',
        url = 'url(images/wallpapers/custom.jpg)'
    }
}
```

---

## 🎮 Usage

### For Players
1. Obtain laptop item
2. Use laptop from inventory
3. FractalOS boots up automatically
4. Click desktop icons to launch apps
5. Customize in Settings

### For Server Owners
1. Configure jobs and permissions
2. Add custom wallpapers
3. Set up VPN access items
4. Create custom apps (see Developer Guide below)

---

## 🔧 Creating Custom Apps

### Quick Start

**Step 1: Add App to Config**
```lua
Config.DefaultApps = {
    {
        id = 'my_app',
        name = 'My Cool App',
        icon = 'fas fa-star',
        category = 'utilities',
        description = 'Does cool stuff!'
    }
}
```

**Step 2: Create App Content** (in `html/js/apps.js`)
```javascript
function getMyAppContent() {
    return `
        <div class="app-my-app">
            <h1>My Cool App</h1>
            <p>Hello from my custom app!</p>
            <button onclick="doSomething()">Click Me!</button>
        </div>
    `;
}
```

**Step 3: Register App**
```javascript
function getAppContent(appId) {
    switch(appId) {
        case 'my_app':
            return getMyAppContent();
        // ... other cases
    }
}
```

**Step 4: Add Styles** (in `html/css/apps.css`)
```css
.app-my-app {
    padding: var(--spacing-lg);
}

.app-my-app h1 {
    color: var(--text-primary);
    font-size: 24px;
}
```

### App Templates
Check the `custom_apps/` folder for complete examples:
- Simple apps (no server communication)
- Advanced apps (with server integration)
- Database-connected apps
- Real-time apps

---

## 🌐 .onion Sites

### Silk Road Marketplace
- **Anonymous market** for buying/selling items
- **Product categories** with filtering
- **Payment system** with black money and crypto
- **Stock management** with limits
- **Supports light/dark modes**

### BlackHat Forums
- **Underground forums** for posting and discussions
- **Category filters** (General, Exploits, Tutorials, Tools, Marketplace)
- **Upvote/downvote system**
- **Comment threads**
- **Always dark themed** (hacker aesthetic)

Both sites require **VPN access** to visit!

---

## 📊 Performance

- **Optimized NUI** - Minimal resource usage
- **Cached Queries** - Fast database operations
- **Lazy Loading** - Apps load on demand
- **No FPS Drop** - Maintains smooth 60fps
- **Low Server MS** - < 0.01ms per player
- **Efficient Code** - Clean, production-ready

---

## 🎨 Dark Mode

The laptop features a complete dark mode system:
- Toggle in Settings → Personalization
- **Automatically applied** to all apps
- **Persistent** across sessions
- **Custom themes** per player
- **Silk Road** adapts to theme
- **BlackHat Forums** stays dark always

---

## 🔄 Contributing Custom Apps

We welcome community contributions! To add your USB app to the project:

1. **Fork the repository**
2. **Create your custom app** following the app structure
3. **Add to `custom_apps/` folder** with documentation
4. **Submit a pull request**

Your app will be reviewed and potentially added to the main project for everyone to enjoy!

### App Submission Guidelines
- ✅ Clean, commented code
- ✅ No malicious code or exploits
- ✅ Compatible with latest version
- ✅ Include README with usage instructions
- ✅ Follows naming conventions
- ✅ Optimized for performance

---

## 🛡️ Security

- Server-side validation for all actions
- SQL injection protection
- Input sanitization
- Rate limiting on API calls
- Export validation for integrations
- Secure crypto wallet addresses

---

## 📝 License

This project is **open source** and free to use!

### Usage Terms
- ✅ **Free for all** - Use on any server
- ✅ **Modify freely** - Customize as needed
- ✅ **Share improvements** - Contribute back to the community
- ✅ **Commercial use** - Allowed
- ❌ **Reselling** - Not permitted as a paid script
- ❌ **Claiming ownership** - Credit original authors

### Contributing
We encourage contributions! See section above for guidelines.

---

## 📖 Documentation

### File Structure
```
fractal-laptop/
├── client/
│   └── main.lua           # Client-side logic
├── server/
│   └── main.lua           # Server-side logic
├── html/
│   ├── css/
│   │   ├── main.css       # Core styles
│   │   ├── desktop.css    # Desktop/taskbar
│   │   ├── windows.css    # Window management
│   │   ├── taskbar.css    # Taskbar specific
│   │   └── apps.css       # All app styles
│   ├── js/
│   │   ├── main.js        # Main NUI logic
│   │   ├── desktop.js     # Desktop functions
│   │   ├── windowManager.js # Window system
│   │   ├── taskbar.js     # Taskbar logic
│   │   └── apps.js        # All app logic
│   ├── img/
│   │   └── wallpapers/    # Wallpaper images
│   └── index.html         # Main HTML
├── custom_apps/           # App templates
├── config.lua             # Configuration
├── fxmanifest.lua         # Resource manifest
├── INSTALL_DATABASE.sql   # Database tables
└── README.md              # This file
```

### Database Tables
- `laptop_data` - Player laptop settings
- `crypto_wallets` - Crypto wallet addresses
- `crypto_transactions` - Transaction history
- `unlocked_onion_sites` - .onion site access
- `silk_road_purchases` - Marketplace orders
- `blackhat_forum_posts` - Forum posts
- `blackhat_forum_comments` - Forum comments
- `crypto_wash` - Money laundering records

---

## 🆘 Troubleshooting

### Laptop Won't Open
1. Restart qb-core
2. Check item name matches config
3. Verify useable item registered
4. Check F8 console for errors

### Apps Not Showing
1. Check `Config.DefaultApps` configuration
2. Verify app IDs match in code
3. Check browser console (F12) for errors
4. Restart fractal-laptop resource

### Database Errors
1. Run `INSTALL_DATABASE.sql` manually
2. Check MySQL connection in server.cfg
3. Ensure oxmysql starts before fractal-laptop
4. Verify table names in code

### Dark Mode Not Working
1. Check if theme persists after reload
2. Clear browser cache (Ctrl+F5)
3. Verify Settings → Personalization toggle
4. Check console for JavaScript errors

---

## 📞 Support & Community

- **Issues**: Submit on GitHub Issues
- **Contributions**: Fork and create pull requests
- **Custom Apps**: Share in the community section

---

## 🎯 Credits

**Developed by**: FractalRP Industries  
**Contributors**: Open source community  
**Framework**: QBCore/ESX  
**UI Library**: Custom-built with vanilla JavaScript  
**Icons**: Font Awesome 6  

---

## 🚀 Roadmap

Planned features for future releases:
- Mobile phone integration
- Cloud storage system
- More .onion sites
- Multiplayer games
- Video player app
- Music streaming
- Social media platform
- Improved file manager

---

**Thank you for using Fractal Laptop-OS!** 💻✨

If you enjoy this project, please ⭐ star the repository and share it with others!
