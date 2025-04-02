# Mini-Framework Documentation

Mini-Framework is a lightweight JavaScript framework for building modern web applications. It provides the essential features you need to create interactive web apps while maintaining a small footprint and simple API.

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Core Concepts](#core-concepts)
   - [DOM Abstraction](#dom-abstraction)
   - [State Management](#state-management)
   - [Event Handling](#event-handling)
   - [Routing](#routing)
5. [API Reference](#api-reference)
   - [DOM Functions](#dom-functions)
   - [State Functions](#state-functions)
   - [Router](#router)
6. [Examples](#examples)
   - [Basic Elements](#basic-elements)
   - [Nested Elements](#nested-elements)
   - [Adding Events](#adding-events)
   - [State Management](#state-management-example)
   - [Routing](#routing-example)
7. [TodoMVC Example](#todomvc-example)
8. [Why Mini-Framework Works This Way](#why-mini-framework-works-this-way)
9. [Performance Tips](#performance-tips)

## Introduction

Mini-Framework is designed to provide the essential features of modern frontend frameworks in a lightweight, easy-to-understand package. It follows the inversion of control principle, where the framework manages the application flow.

Unlike libraries where you call methods, with Mini-Framework, you define components and the framework handles rendering, updates, and event handling. This design allows you to focus on building your application's features rather than managing the DOM directly.

## Features

Mini-Framework includes four core features:

1. **DOM Abstraction**: Create and manipulate DOM elements using JavaScript objects (Virtual DOM).
2. **State Management**: Maintain application state and automatically update the UI when the state changes.
3. **Event Handling**: Handle user interactions with a simplified event system.
4. **Routing**: Navigate between different views while synchronizing with the browser URL.

## Installation

### Option 1: Clone the repository

```bash
# Clone the repository
git clone https://github.com/your-username/mini-framework.git
cd mini-framework

# Install dependencies
npm install

# Start the development server (runs the TodoMVC example)
npm start
```

### Option 2: Create a new project from scratch

```bash
# Create a project directory
mkdir my-mini-framework-app
cd my-mini-framework-app

# Initialize npm package
npm init -y

# Install dependencies
npm install parcel-bundler --save-dev

# Create folder structure
mkdir -p src examples/myApp
```

Then copy the Mini-Framework source files into your project's `src` directory.

## Core Concepts

### DOM Abstraction

Mini-Framework uses a virtual DOM approach to manage DOM elements. Instead of directly manipulating the DOM, you create a tree of JavaScript objects that represent the desired DOM structure. The framework then efficiently updates the real DOM to match this virtual representation.

The DOM abstraction is based on three main functions:

- `createElement`: Creates a virtual DOM element
- `render`: Converts a virtual DOM element to a real DOM element
- `mount`: Attaches a real DOM element to a container

This approach provides several benefits:

1. Declarative code that's easier to understand
2. Automatic event handling
3. Performance optimizations
4. Simplified DOM updates

### State Management

Mini-Framework provides a simple state management system that allows components to respond to changes in the application state. The state is a JavaScript object that can be modified through the `setState` function. When the state changes, all components that depend on it are automatically re-rendered.

Key state management functions:

- `setState`: Updates the application state
- `getState`: Retrieves the current state
- `subscribe`: Registers a callback function to be called when the state changes

### Event Handling

Mini-Framework simplifies event handling by allowing you to attach event listeners directly in the element definition. Events are defined as attributes starting with "on" followed by the event name (e.g., `onClick`, `onInput`, `onKeyDown`).

This approach eliminates the need to write separate event listeners and keeps your event handling code close to the elements they affect.

### Routing

Mini-Framework includes a routing system that allows you to create single-page applications with multiple views. The router synchronizes the URL with the application state, enabling bookmarkable URLs and browser history navigation.

The router is implemented as a class with methods for defining routes, navigating between pages, and handling browser history events.

## API Reference

### DOM Functions

#### `createElement(tag, attrs, children)`

Creates a virtual DOM element.

Parameters:
- `tag` (string): The HTML tag name (e.g., 'div', 'span', 'input')
- `attrs` (object, optional): Element attributes and event handlers
- `children` (array or string, optional): Child elements or text content

Returns: A virtual DOM element object

Example:
```javascript
createElement('div', { class: 'container' }, [
  createElement('h1', {}, ['Hello, World!']),
  createElement('p', {}, ['Welcome to Mini-Framework'])
]);
```

#### `render(vNode)`

Converts a virtual DOM element to a real DOM element.

Parameters:
- `vNode` (object or string): A virtual DOM element or text string

Returns: A real DOM element (HTMLElement or Text node)

Example:
```javascript
const vNode = createElement('div', {}, ['Hello, World!']);
const realNode = render(vNode);
```

#### `mount(element, container)`

Attaches a real DOM element to a container.

Parameters:
- `element` (HTMLElement): A real DOM element
- `container` (HTMLElement): The container element

Example:
```javascript
const vNode = createElement('div', {}, ['Hello, World!']);
const realNode = render(vNode);
mount(realNode, document.getElementById('root'));
```

#### `createApp(component, rootId)`

Creates and initializes the application with a root component.

Parameters:
- `component` (function): The root component function that returns a virtual DOM element
- `rootId` (string, optional): The ID of the root DOM element (default: 'root')

Returns: An object with `setState` and `getState` methods

Example:
```javascript
function App() {
  return createElement('div', {}, ['Hello, World!']);
}

const app = createApp(App);
```

### State Functions

#### `setState(newState)`

Updates the application state.

Parameters:
- `newState` (object): An object to merge with the current state

Example:
```javascript
setState({ count: 0 });
setState({ count: getState().count + 1 });
```

#### `getState()`

Retrieves the current application state.

Returns: The current state object

Example:
```javascript
const { count } = getState();
console.log(`Current count: ${count}`);
```

#### `subscribe(listener)`

Registers a callback function to be called when the state changes.

Parameters:
- `listener` (function): A function to call when the state changes

Returns: A function to unsubscribe the listener

Example:
```javascript
const unsubscribe = subscribe(state => {
  console.log('State changed:', state);
});

// Later, when you want to unsubscribe:
unsubscribe();
```

### Router

#### `new Router(routes, options)`

Creates a new router.

Parameters:
- `routes` (array): An array of route objects with `path` and `component` properties
- `options` (object, optional): Router configuration options

Example:
```javascript
const router = new Router([
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage }
]);
```

#### `router.navigate(path, state)`

Navigates to a new path.

Parameters:
- `path` (string): The path to navigate to
- `state` (object, optional): State to pass to the history API

Example:
```javascript
router.navigate('/about');
```

#### `router.createLink(path, attrs, children)`

Creates a virtual DOM link element with automatic navigation.

Parameters:
- `path` (string): The path to link to
- `attrs` (object, optional): Additional attributes for the link
- `children` (array, optional): Child elements

Returns: A virtual DOM element

Example:
```javascript
router.createLink('/about', { class: 'nav-link' }, ['About Us']);
```

## Examples

### Basic Elements

Creating a simple element:

```javascript
import { createElement, render, mount } from '../src/index.js';

// Create a heading element
const heading = createElement('h1', { class: 'title' }, ['Hello, World!']);

// Render and mount it to the DOM
const app = render(heading);
mount(app, document.getElementById('root'));
```

### Nested Elements

Creating nested elements:

```javascript
import { createElement, render, mount } from '../src/index.js';

// Create a complex element structure
const card = createElement('div', { class: 'card' }, [
  createElement('div', { class: 'card-header' }, [
    createElement('h2', { class: 'card-title' }, ['Card Title'])
  ]),
  createElement('div', { class: 'card-body' }, [
    createElement('p', { class: 'card-text' }, ['This is some card content.']),
    createElement('button', { class: 'btn btn-primary' }, ['Click Me'])
  ])
]);

// Render and mount it to the DOM
const app = render(card);
mount(app, document.getElementById('root'));
```

### Adding Events

Adding event handlers to elements:

```javascript
import { createElement, render, mount } from '../src/index.js';

// Create a button with a click handler
const button = createElement('button', {
  class: 'btn',
  onClick: () => alert('Button clicked!')
}, ['Click Me']);

// Render and mount it to the DOM
const app = render(button);
mount(app, document.getElementById('root'));
```

### State Management Example

Using state management:

```javascript
import { createElement, getState, setState, createApp } from '../src/index.js';

// Initialize state
setState({ count: 0 });

// Create counter component
function Counter() {
  const { count } = getState();
  
  return createElement('div', { class: 'counter' }, [
    createElement('h2', {}, [`Count: ${count}`]),
    createElement('button', {
      onClick: () => setState({ count: count + 1 })
    }, ['Increment']),
    createElement('button', {
      onClick: () => setState({ count: count - 1 })
    }, ['Decrement'])
  ]);
}

// Create and mount the app
const app = createApp(Counter);
```

### Routing Example

Using the router:

```javascript
import { createElement, createApp, Router } from '../src/index.js';

// Define components for different routes
function HomePage() {
  return createElement('div', {}, [
    createElement('h1', {}, ['Home']),
    createElement('p', {}, ['Welcome to the home page!'])
  ]);
}

function AboutPage() {
  return createElement('div', {}, [
    createElement('h1', {}, ['About']),
    createElement('p', {}, ['Learn more about us.'])
  ]);
}

// Set up routes
const router = new Router([
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage }
]);

// Create navigation component
function Navigation() {
  return createElement('nav', {}, [
    router.createLink('/', { class: 'nav-link' }, ['Home']),
    ' | ',
    router.createLink('/about', { class: 'nav-link' }, ['About'])
  ]);
}

// Create app component
function App() {
  const Component = router.getCurrentComponent();
  
  return createElement('div', { class: 'app' }, [
    createElement(Navigation),
    createElement('main', {}, [
      createElement(Component)
    ])
  ]);
}

// Create and mount the app
const app = createApp(App);
```

## TodoMVC Example

The framework includes a complete implementation of the TodoMVC application, which demonstrates all the features of Mini-Framework. The TodoMVC example can be found in the `examples/todoMVC` directory.

Key features of the TodoMVC example:

1. Adding, editing, and deleting todos
2. Marking todos as complete
3. Filtering todos (all, active, completed)
4. Persisting todos to localStorage
5. Routing with hash-based URLs
6. Responsive design with dark/light theme support

To run the TodoMVC example:

```bash
npm start
```

Then open your browser and navigate to `http://localhost:1234`.

## Why Mini-Framework Works This Way

Mini-Framework is designed with simplicity and learning in mind, while still providing the essential features needed for building modern web applications.

### Virtual DOM Approach

We chose to use a virtual DOM approach because it:

1. **Simplifies the mental model**: Developers can think declaratively about their UI rather than imperatively manipulating the DOM.
2. **Reduces bugs**: By abstracting direct DOM manipulation, we reduce the chances of inconsistent UI states.
3. **Improves performance**: The framework can optimize DOM updates by minimizing the changes needed.
4. **Enhances testability**: Virtual DOM components are easier to test since they're just functions that return objects.

### State Management

The state management system is deliberately simple:

1. **Single source of truth**: A global state object that contains all application data.
2. **Immutability**: State updates create a new state object rather than mutating the existing one.
3. **Automatic UI updates**: Components automatically re-render when the state changes.

This approach is inspired by modern frameworks like React and Redux, but simplified for ease of understanding.

### Event Handling

Our event handling approach:

1. **Declarative syntax**: Events are defined as attributes on elements.
2. **Automatic cleanup**: The framework handles adding and removing event listeners.
3. **Simplified API**: No need to manually call `addEventListener` or manage event delegation.

### Routing

The routing system is designed to:

1. **Synchronize UI with URL**: Keep the browser URL in sync with the application state.
2. **Support browser history**: Work with the browser's back and forward buttons.
3. **Provide a simple API**: Make it easy to define routes and navigate between them.

## Performance Tips

To get the most out of Mini-Framework, consider these performance tips:

1. **Key property**: Use the `key` property on elements in lists to help the framework identify which elements have changed.
2. **Component granularity**: Break your UI into smaller components to minimize re-rendering.
3. **Memoization**: Cache expensive computations to avoid redundant work.
4. **Avoid anonymous functions**: Define event handlers outside render functions to prevent unnecessary re-renders.
5. **Batch state updates**: Combine multiple state updates into a single call to `setState` when possible.

Example of using the `key` property:

```javascript
// Good - using keys for list items
const todoList = createElement('ul', { class: 'todo-list' },
  todos.map(todo => createElement('li', {
    key: todo.id,
    class: todo.completed ? 'completed' : ''
  }, [todo.text]))
);

// Bad - not using keys
const todoList = createElement('ul', { class: 'todo-list' },
  todos.map(todo => createElement('li', {
    class: todo.completed ? 'completed' : ''
  }, [todo.text]))
);
```

---

This documentation covers the core features and usage of Mini-Framework. Explore the source code and examples to learn more about how the framework works and how you can use it to build your own web applications.