/**
 * TodoMVC App built with Mini-Framework
 * Enhanced version with improved UI and accessibility
 */
import {
    createElement,
    getState,
    setState,
    createApp,
    subscribe,
    Router
} from '../../src/index.js';

// Initialize app state
setState({
    todos: JSON.parse(localStorage.getItem('todos') || '[]'),
    filter: window.location.hash.replace('#/', '') || 'all',
    editing: null,
    theme: localStorage.getItem('theme') || 'light',
    animating: false
});

// Save todos to localStorage whenever state changes
const unsubscribe = subscribe(state => {
    localStorage.setItem('todos', JSON.stringify(state.todos));
    localStorage.setItem('theme', state.theme);
});

// Set up routes
const router = new Router([
    { path: '/', component: () => TodoApp },
    { path: '/active', component: () => TodoApp },
    { path: '/completed', component: () => TodoApp }
]);

// Helper functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function addTodo(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newTodo = {
        id: generateId(),
        text: trimmedText,
        completed: false,
        createdAt: new Date().toISOString()
    };

    setState({
        todos: [...getState().todos, newTodo],
        animating: true
    });

    // Remove animating flag after animation completes
    setTimeout(() => {
        setState({ animating: false });
    }, 500);
}

function toggleTodo(id) {
    const { todos } = getState();
    const newTodos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );

    setState({ todos: newTodos });
}

function updateTodo(id, text) {
    const { todos } = getState();
    const newTodos = todos.map(todo =>
        todo.id === id ? { ...todo, text: text.trim() } : todo
    );

    setState({
        todos: newTodos,
        editing: null
    });
}

function removeTodo(id) {
    const { todos } = getState();
    setState({
        todos: todos.filter(todo => todo.id !== id)
    });
}

function clearCompleted() {
    const { todos } = getState();
    setState({
        todos: todos.filter(todo => !todo.completed)
    });
}

function setFilter(filter) {
    setState({ filter });
    const path = filter === 'all' ? '/' : `/${filter}`;
    router.navigate(path);
}

function toggleAll(completed) {
    const { todos } = getState();
    const newTodos = todos.map(todo => ({ ...todo, completed }));
    setState({ todos: newTodos });
}

function startEditing(id) {
    setState({ editing: id });
}

function toggleTheme() {
    const { theme } = getState();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setState({ theme: newTheme });
    document.body.className = newTheme;
}

// Filter todos based on current filter
function getFilteredTodos() {
    const { todos, filter } = getState();

    switch (filter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// TodoApp component
function TodoApp() {
    const { todos, filter, editing, theme, animating } = getState();
    const filteredTodos = getFilteredTodos();
    const activeTodos = todos.filter(todo => !todo.completed);
    const completedTodos = todos.filter(todo => todo.completed);
    const allCompleted = todos.length > 0 && activeTodos.length === 0;

    return createElement('div', { class: `todoapp ${theme}` }, [
        // Theme toggle
        createElement('button', {
            class: 'theme-toggle',
            onClick: toggleTheme,
            title: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`,
            'aria-label': `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`
        }, [
            theme === 'light' ? '🌙' : '☀️'
        ]),

        // Header
        createElement('header', { class: 'header' }, [
            createElement('h1', {}, ['todos']),
            createElement('label', {
                class: 'visually-hidden',
                for: 'new-todo-input'
            }, ['New todo input']),
            createElement('input', {
                id: 'new-todo-input',
                class: 'new-todo',
                placeholder: 'What needs to be done?',
                autofocus: true,
                'aria-label': 'New todo input',
                onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                        addTodo(e.target.value);
                        e.target.value = '';
                    }
                }
            })
        ]),

        // Main section (only show if there are todos)
        todos.length > 0 ? createElement('section', { class: 'main' }, [
            createElement('input', {
                id: 'toggle-all',
                class: 'toggle-all',
                type: 'checkbox',
                checked: allCompleted,
                onChange: (e) => toggleAll(e.target.checked),
                'aria-label': 'Mark all as complete'
            }),
            createElement('label', { for: 'toggle-all' }, ['Mark all as complete']),

            // Todo list
            createElement('ul', {
                    class: 'todo-list',
                    role: 'list',
                    'aria-label': 'Todo list'
                },
                filteredTodos.map(todo => createElement('li', {
                    key: todo.id,
                    class: `${todo.completed ? 'completed' : ''} ${editing === todo.id ? 'editing' : ''} ${animating && todo.id === todos[todos.length-1].id ? 'new-item' : ''}`,
                    role: 'listitem'
                }, [
                    // View mode
                    createElement('div', { class: 'view' }, [
                        createElement('input', {
                            id: `todo-${todo.id}`,
                            class: 'toggle',
                            type: 'checkbox',
                            checked: todo.completed,
                            onChange: () => toggleTodo(todo.id),
                            'aria-label': `Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`
                        }),
                        createElement('label', {
                            for: `todo-${todo.id}`,
                            onDblClick: () => startEditing(todo.id)
                        }, [todo.text]),
                        createElement('button', {
                            class: 'destroy',
                            onClick: () => removeTodo(todo.id),
                            'aria-label': `Delete "${todo.text}"`
                        }),
                        createElement('span', {
                            class: 'created-date'
                        }, [todo.createdAt ? formatDate(todo.createdAt) : ''])
                    ]),

                    // Edit mode
                    editing === todo.id ? createElement('input', {
                        id: `edit-${todo.id}`,
                        class: 'edit',
                        value: todo.text,
                        autofocus: true,
                        'aria-label': `Edit "${todo.text}"`,
                        onBlur: (e) => updateTodo(todo.id, e.target.value),
                        onKeyDown: (e) => {
                            if (e.key === 'Enter') updateTodo(todo.id, e.target.value);
                            if (e.key === 'Escape') setState({ editing: null });
                        }
                    }) : null
                ]))
            )
        ]) : createElement('div', { class: 'empty-state' }, [
            createElement('p', {}, ['No todos yet. Add one above!'])
        ]),

        // Footer (only show if there are todos)
        todos.length > 0 ? createElement('footer', { class: 'footer' }, [
            // Todo count
            createElement('span', { class: 'todo-count' }, [
                createElement('strong', {}, [activeTodos.length.toString()]),
                ` item${activeTodos.length === 1 ? '' : 's'} left`
            ]),

            // Filters
            createElement('ul', {
                class: 'filters',
                role: 'tablist'
            }, [
                createElement('li', { role: 'presentation' }, [
                    createElement('a', {
                        class: filter === 'all' ? 'selected' : '',
                        href: '#/',
                        role: 'tab',
                        'aria-selected': filter === 'all' ? 'true' : 'false',
                        onClick: (e) => {
                            e.preventDefault();
                            setFilter('all');
                        }
                    }, ['All'])
                ]),
                createElement('li', { role: 'presentation' }, [
                    createElement('a', {
                        class: filter === 'active' ? 'selected' : '',
                        href: '#/active',
                        role: 'tab',
                        'aria-selected': filter === 'active' ? 'true' : 'false',
                        onClick: (e) => {
                            e.preventDefault();
                            setFilter('active');
                        }
                    }, ['Active'])
                ]),
                createElement('li', { role: 'presentation' }, [
                    createElement('a', {
                        class: filter === 'completed' ? 'selected' : '',
                        href: '#/completed',
                        role: 'tab',
                        'aria-selected': filter === 'completed' ? 'true' : 'false',
                        onClick: (e) => {
                            e.preventDefault();
                            setFilter('completed');
                        }
                    }, ['Completed'])
                ])
            ]),

            // Clear completed button (only show if there are completed todos)
            completedTodos.length > 0 ? createElement('button', {
                class: 'clear-completed',
                onClick: clearCompleted,
                'aria-label': 'Clear completed todos'
            }, ['Clear completed']) : null
        ]) : null,

        // Info footer
        createElement('footer', { class: 'info' }, [
            createElement('p', {}, ['Double-click to edit a todo']),
            createElement('p', {}, ['Created with ',
                createElement('a', { href: 'https://github.com/your-username/mini-framework' }, ['Mini-Framework'])
            ])
        ])
    ]);
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    const filter = window.location.hash.replace('#/', '') || 'all';
    setState({ filter });
});

// Apply theme on initial load
document.body.className = getState().theme;

// Create and mount the app
const app = createApp(() => TodoApp());