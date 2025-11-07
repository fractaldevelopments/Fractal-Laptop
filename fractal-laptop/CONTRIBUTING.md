# Contributing to Fractal Laptop-OS

Thank you for your interest in contributing! We welcome contributions from the community to make this project better for everyone.

---

## 🎯 How Can You Contribute?

### 1. 📱 Create Custom Apps
The best way to contribute is by creating custom USB applications!

**Steps:**
1. Fork the repository
2. Create your app in the `custom_apps/` folder
3. Follow the app structure guidelines below
4. Test thoroughly
5. Submit a pull request

### 2. 🐛 Report Bugs
Found a bug? Help us fix it!

**To report a bug:**
1. Check if it's already reported in Issues
2. Create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your FiveM server version
   - Framework (QBCore/ESX)

### 3. 💡 Suggest Features
Have an idea for a new feature?

**To suggest a feature:**
1. Check if it's already suggested
2. Create a new issue with:
   - Clear description of the feature
   - Why it would be useful
   - How it should work
   - Mockups/examples if possible

### 4. 📝 Improve Documentation
Documentation can always be better!

**Ways to help:**
- Fix typos or unclear explanations
- Add more examples
- Translate to other languages
- Create video tutorials

---

## 📱 Creating Custom USB Apps

### App Guidelines

✅ **DO:**
- Follow the existing code style
- Add comments to explain complex logic
- Test your app thoroughly
- Include a README for your app
- Use meaningful variable names
- Keep it simple and user-friendly
- Optimize for performance

❌ **DON'T:**
- Include malicious code
- Use excessive server calls
- Ignore error handling
- Copy existing app names
- Use copyrighted content
- Make it resource-heavy

### App Structure

Your app should include:

```
custom_apps/
└── your_app/
    ├── README.md           # App description & usage
    ├── app_code.js         # JavaScript code
    ├── app_styles.css      # CSS styling
    └── server_side.lua     # Server code (if needed)
```

### App Template

```javascript
// ====================================
// YOUR APP NAME
// ====================================

function getYourAppContent() {
    return `
        <div class="app-your-app">
            <h1>Your App</h1>
            <p>App content here</p>
        </div>
    `;
}

// Initialize app
function initializeYourApp() {
    // Setup code
}

// Cleanup on close
function cleanupYourApp() {
    // Cleanup code
}
```

### Required Documentation

Each custom app must include:

1. **App Name & Description**
2. **Features List**
3. **Installation Instructions**
4. **Configuration (if any)**
5. **Dependencies (if any)**
6. **Screenshots/Demo**
7. **Author Credit**

---

## 💻 Code Style Guidelines

### Lua Code Style

```lua
-- Use descriptive variable names
local playerData = Player.PlayerData

-- Add comments for complex logic
-- This function checks if player can access the app
local function CanPlayerAccess(source)
    local Player = QBCore.Functions.GetPlayer(source)
    return Player ~= nil
end

-- Use proper indentation (4 spaces)
if condition then
    doSomething()
end
```

### JavaScript Code Style

```javascript
// Use camelCase for variables
const playerName = 'John';

// Add JSDoc comments for functions
/**
 * Opens the app window
 * @param {string} appId - The app identifier
 */
function openApp(appId) {
    // Implementation
}

// Use const/let, not var
const isActive = true;
let counter = 0;
```

### CSS Code Style

```css
/* Use clear class names */
.app-container {
    padding: var(--spacing-lg);
    background: var(--bg-primary);
}

/* Group related properties */
.app-header {
    /* Layout */
    display: flex;
    align-items: center;
    
    /* Spacing */
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    
    /* Appearance */
    background: var(--glass-bg);
    border-radius: var(--radius-md);
}
```

---

## 🔄 Pull Request Process

### Before Submitting

1. ✅ Test your changes thoroughly
2. ✅ Ensure no console errors
3. ✅ Update documentation if needed
4. ✅ Add your app to `custom_apps/`
5. ✅ Follow the code style guidelines

### Submitting a Pull Request

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-app
   ```

3. **Make your changes**
   - Write clean code
   - Add comments
   - Test thoroughly

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: My Awesome App"
   ```
   
   Use clear commit messages:
   - `Add: New feature`
   - `Fix: Bug description`
   - `Update: What was updated`
   - `Remove: What was removed`

5. **Push to your fork**
   ```bash
   git push origin feature/my-new-app
   ```

6. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the template

### Pull Request Template

```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] New custom app
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
How did you test your changes?

## Screenshots (if applicable)
Add screenshots of your app

## Checklist
- [ ] Code follows style guidelines
- [ ] Tested thoroughly
- [ ] No console errors
- [ ] Documentation updated
- [ ] Comments added where needed
```

---

## 🧪 Testing Guidelines

### Test Your App

Before submitting, test:

1. ✅ **Opening the app** - No errors on launch
2. ✅ **All features** - Every button/function works
3. ✅ **Closing the app** - No errors on close
4. ✅ **Multiple uses** - Can open/close repeatedly
5. ✅ **With other apps** - Works alongside other apps
6. ✅ **Error handling** - Graceful error messages
7. ✅ **Performance** - No lag or FPS drops

### Testing Checklist

```
□ Tested in QBCore
□ Tested in ESX (if framework agnostic)
□ Tested with multiple players
□ Tested on low-end PCs
□ No console errors (F8)
□ No browser errors (F12)
□ No SQL errors
□ Proper cleanup on close
```

---

## 🏆 Recognition

Contributors will be:
- ✨ Listed in the README credits section
- 🎯 Mentioned in release notes
- 💫 Featured in the community showcase
- 🌟 Given contributor badge (if applicable)

---

## ❓ Questions?

- **GitHub Issues** - For bugs and features
- **Pull Requests** - For code contributions
- **Discussions** - For general questions

---

## 📜 Code of Conduct

### Be Respectful
- Be kind and courteous
- Respect others' opinions
- Provide constructive feedback
- Help newcomers

### Be Professional
- Keep discussions on-topic
- No spam or self-promotion
- No harassment or discrimination
- Follow GitHub's terms of service

### Be Collaborative
- Work together to improve the project
- Share knowledge and help others
- Give credit where it's due
- Accept feedback gracefully

---

## 🎉 Thank You!

Every contribution, no matter how small, helps make this project better for everyone. We appreciate your time and effort!

**Happy coding!** 💻✨

