# Simple App Template - Todo List

This template shows you how to create a basic todo list app with no server communication.

## Step 1: Add to Config

```lua
-- In config.lua, add to Config.DefaultApps:
{
    id = 'todo_list',
    name = 'Todo List',
    icon = 'fas fa-list-check',
    category = 'productivity',
    description = 'Manage your tasks'
}
```

## Step 2: HTML Content (Add to apps.js)

```javascript
// ====================================
// TODO LIST APP
// ====================================

function getTodoListContent() {
    return `
        <div class="app-todo">
            <div class="todo-header">
                <h2><i class="fas fa-list-check"></i> Todo List</h2>
            </div>
            
            <div class="todo-input-section">
                <input 
                    type="text" 
                    id="todo-input" 
                    class="todo-input" 
                    placeholder="What needs to be done?"
                    maxlength="100"
                />
                <button class="btn-add-todo" id="btn-add-todo">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
            
            <div class="todo-list" id="todo-list">
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks yet. Add one above!</p>
                </div>
            </div>
        </div>
    `;
}
```

## Step 3: Register App (Add to apps.js)

```javascript
// In getAppContent() function:
function getAppContent(appId) {
    switch(appId) {
        // ... existing cases ...
        case 'todo_list':
            return getTodoListContent();
        // ... rest of cases ...
    }
}
```

## Step 4: JavaScript Logic (Add to apps.js)

```javascript
// Todo list state (stored in browser)
let todos = JSON.parse(localStorage.getItem('laptop-todos') || '[]');

// Initialize todo list
function initializeTodoList() {
    loadTodos();
}

// Load and display todos
function loadTodos() {
    const container = $('#todo-list');
    
    if (todos.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks yet. Add one above!</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    todos.forEach((todo, index) => {
        html += `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-index="${index}">
                <div class="todo-check" onclick="toggleTodo(${index})">
                    <i class="fas ${todo.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                </div>
                <div class="todo-text">${todo.text}</div>
                <button class="todo-delete" onclick="deleteTodo(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    container.html(html);
}

// Add new todo
$(document).on('click', '#btn-add-todo', function() {
    const input = $('#todo-input');
    const text = input.val().trim();
    
    if (!text) {
        showNotification('Error', 'Please enter a task', 'error');
        return;
    }
    
    todos.push({
        text: text,
        completed: false,
        created: Date.now()
    });
    
    saveTodos();
    loadTodos();
    input.val('');
    showNotification('Success', 'Task added!', 'success');
});

// Add on Enter key
$(document).on('keypress', '#todo-input', function(e) {
    if (e.which === 13) {
        $('#btn-add-todo').click();
    }
});

// Toggle todo completed
function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    loadTodos();
}

// Delete todo
function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    loadTodos();
}

// Save to localStorage
function saveTodos() {
    localStorage.setItem('laptop-todos', JSON.stringify(todos));
}

// Cleanup
function cleanupTodoList() {
    // No cleanup needed for this app
}
```

## Step 5: Initialize (Add to windowManager.js)

```javascript
// In initializeApp() function:
function initializeApp(appId) {
    switch(appId) {
        // ... existing cases ...
        case 'todo_list':
            initializeTodoList();
            break;
        // ... rest of cases ...
    }
}

// In closeWindow() function cleanup:
switch(appId) {
    // ... existing cases ...
    case 'todo_list':
        cleanupTodoList();
        break;
    // ... rest of cases ...
}
```

## Step 6: CSS Styling (Add to apps.css)

```css
/* ====================================
   TODO LIST APP
   ==================================== */

.app-todo {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    height: 100%;
}

.todo-header {
    margin-bottom: var(--spacing-lg);
}

.todo-header h2 {
    color: var(--text-primary);
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.todo-input-section {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
}

.todo-input {
    flex: 1;
    padding: var(--spacing-md);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-sm);
    font-size: 14px;
    outline: none;
}

.todo-input:focus {
    border-color: var(--primary);
}

.btn-add-todo {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-add-todo:hover {
    opacity: 0.8;
    transform: translateY(-2px);
}

.todo-list {
    flex: 1;
    overflow-y: auto;
}

.todo-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--glass-bg);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-sm);
    transition: all 0.2s;
}

.todo-item:hover {
    background: rgba(255, 255, 255, 0.15);
}

.todo-item.completed {
    opacity: 0.5;
}

.todo-item.completed .todo-text {
    text-decoration: line-through;
}

.todo-check {
    cursor: pointer;
    color: var(--primary);
    font-size: 20px;
    transition: all 0.2s;
}

.todo-check:hover {
    transform: scale(1.2);
}

.todo-item.completed .todo-check {
    color: var(--success);
}

.todo-text {
    flex: 1;
    color: var(--text-primary);
    font-size: 14px;
}

.todo-delete {
    background: transparent;
    border: none;
    color: var(--error);
    font-size: 16px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
}

.todo-item:hover .todo-delete {
    opacity: 1;
}

.todo-delete:hover {
    transform: scale(1.2);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary);
}

.empty-state i {
    font-size: 48px;
    margin-bottom: var(--spacing-md);
    opacity: 0.3;
}
```

## ✅ Done!

Your todo list app is now complete! Players can:
- Add tasks
- Check off completed tasks
- Delete tasks
- Data persists in browser localStorage

**This is the simplest type of app - no server needed!**

