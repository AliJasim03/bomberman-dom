/**
 * Mini-Framework Core (Improved Version)
 * A lightweight JavaScript framework with DOM abstraction, state management,
 * event handling, and routing functionality.
 */

// State management
let _state = {};
let _listeners = [];
let _prevState = {};

/**
 * Update the application state
 * @param {Object} newState - The new state to merge with the existing state
 */
export function setState(newState) {
    _prevState = { ..._state };
    _state = { ..._state, ...newState };

    // Compare and only trigger updates if state actually changed
    if (JSON.stringify(_prevState) !== JSON.stringify(_state)) {
        // Ensure _listeners exists and is an array before calling forEach
        if (_listeners && Array.isArray(_listeners)) {
            _listeners.forEach(listener => listener(_state, _prevState));
        }
    }
}

/**
 * Get the current application state
 * @returns {Object} The current state
 */
export function getState() {
    return _state;
}

/**
 * Subscribe to state changes
 * @param {Function} listener - Function to call when state changes
 * @returns {Function} Function to unsubscribe the listener
 */
export function subscribe(listener) {
    _listeners.push(listener);
    return () => {
        _listeners = _listeners.filter(l => l !== listener);
    };
}

/**
 * Create a virtual DOM element
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array} children - Child elements or text
 * @returns {Object} Virtual DOM node
 */
export function createElement(tag, attrs = {}, children = []) {
    // Ensure children is always an array
    const normalizedChildren = Array.isArray(children) ? children : [children];

    // Clean up children array, filtering out null and undefined
    const cleanedChildren = normalizedChildren.filter(child => child !== null && child !== undefined);

    return {
        tag,
        attrs,
        children: cleanedChildren,
        key: attrs.key || null
    };
}

/**
 * Render a virtual DOM node to a real DOM element
 * @param {Object|string} vNode - Virtual DOM node or text string
 * @returns {HTMLElement|Text} Real DOM node
 */
export function render(vNode) {
    // Handle null or undefined
    if (vNode === null || vNode === undefined) {
        return document.createComment('empty node');
    }

    // Handle text nodes
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return document.createTextNode(vNode);
    }

    // Create DOM element
    const element = document.createElement(vNode.tag);

    // Set attributes and attach event handlers
    Object.entries(vNode.attrs || {}).forEach(([key, value]) => {
        if (key === 'key' || value === null || value === undefined) {
            // Skip key attribute, it's only for internal use
            // Also skip null/undefined values
            return;
        } else if (key === 'style' && typeof value === 'object') {
            // Handle style objects
            Object.entries(value).forEach(([prop, val]) => {
                if (val !== null && val !== undefined) {
                    element.style[prop] = val;
                }
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            // Handle event listeners
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'checked' || key === 'disabled' || key === 'selected' || key === 'autofocus') {
            // Handle boolean attributes
            if (value) {
                element.setAttribute(key, key);
                // Also set property for form elements
                if (key in element) {
                    element[key] = true;
                }
            }
        } else if (key === 'value' && ('value' in element)) {
            // Handle value attribute (special case for form elements)
            element.value = value;
        } else if (key === 'class' || key === 'className') {
            // Handle class attribute
            element.className = value;
        } else if (key === 'for') {
            // Handle htmlFor attribute (label for element)
            element.htmlFor = value;
            element.setAttribute('for', value);
        } else {
            // Handle regular attributes
            element.setAttribute(key, value);
        }
    });

    // Render and append children
    // Add a check to ensure vNode.children exists
    if (vNode.children) {
        vNode.children.forEach(child => {
            if (child !== null && child !== undefined) {
                element.appendChild(render(child));
            }
        });
    }

    return element;
}

/**
 * Mount a rendered element to a DOM node
 * @param {HTMLElement} element - Element to mount
 * @param {HTMLElement} container - Container to mount to
 */
export function mount(element, container) {
    container.innerHTML = '';
    container.appendChild(element);
}

/**
 * Initialize the application with a root component
 * @param {Function} component - Root component function
 * @param {string} rootId - ID of the root DOM element
 */
// Create HTTP server
export function createApp(component, rootId = 'root') {
    const rootElement = document.getElementById(rootId);

    if (!rootElement) {
        console.error(`Element with id "${rootId}" not found`);
        return;
    }

    // Function to render the app
    const renderApp = () => {
        const timestamp = Date.now();
        console.time(`render-${timestamp}`);
        const vNode = component(getState());
        const realNode = render(vNode);
        mount(realNode, rootElement);
        console.timeEnd(`render-${timestamp}`);
    };

    // Subscribe to state changes to trigger re-renders
    subscribe(renderApp);

    // Initial render
    renderApp();

    return {
        setState,
        getState
    };
}

// Export the Router class for routing functionality
export { Router } from './router.js';