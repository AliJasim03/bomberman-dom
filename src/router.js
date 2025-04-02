/**
 * Mini-Framework Router (Improved)
 * Provides client-side routing functionality with enhanced error handling
 * and support for route parameters.
 */

import { setState, getState } from './index.js';

export class Router {
    /**
     * Create a new router
     * @param {Array} routes - Array of route objects { path, component }
     * @param {Object} options - Router options
     * @param {Function} options.notFound - Component to render when no route matches
     */
    constructor(routes, options = {}) {
        this.routes = routes;
        this.currentPath = window.location.pathname;
        this.options = {
            notFound: () => ({
                tag: 'div',
                attrs: { class: 'not-found' },
                children: ['Page not found']
            }),
            ...options
        };
        this.init();
    }

    /**
     * Initialize the router
     */
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handleRouteChange(window.location.pathname, event.state);
        });

        // // Handle hash changes (for hash-based routing)
        // window.addEventListener('hashchange', () => {
        //     const hash = window.location.hash.replace('#', '');
        //     if (hash) {
        //         this.handleRouteChange(hash);
        //     }
        // });

        // Handle initial route
        this.handleRouteChange(this.currentPath);

        // Update state with current route
        setState({
            router: {
                currentPath: this.currentPath,
                params: {}
            }
        });
    }

    /**
     * Match a path against route patterns
     * @param {string} path - The current path
     * @param {string} pattern - The route pattern
     * @returns {Object|null} Matched params or null if no match
     */
    matchRoute(path, pattern) {
        // Convert route pattern to regex
        const regexPattern = pattern
            .replace(/:\w+/g, '([^/]+)')  // Replace :param with regex capture group
            .replace(/\*/g, '.*');        // Replace * with wildcard

        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);

        if (!match) return null;

        // Extract parameter names from the pattern
        const paramNames = (pattern.match(/:\w+/g) || [])
            .map(name => name.substring(1));

        // Create params object
        const params = {};
        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });

        return params;
    }

    /**
     * Find a matching route for a path
     * @param {string} path - The path to match
     * @returns {Object|null} Matched route and params or null
     */
    findRoute(path) {
        for (const route of this.routes) {
            const params = this.matchRoute(path, route.path);
            if (params !== null) {
                return { route, params };
            }
        }
        return null;
    }

    /**
     * Handle route changes
     * @param {string} path - The new path
     * @param {Object} state - History state
     */
    handleRouteChange(path, state = {}) {
        this.currentPath = path;

        const match = this.findRoute(path);
        const params = match ? match.params : {};
        const component = match ? match.route.component : this.options.notFound;

        // Update state with new route info
        setState({
            router: {
                currentPath: path,
                params,
                notFound: !match
            },
            ...state
        });
    }

    /**
     * Navigate to a new path
     * @param {string} path - Path to navigate to
     * @param {Object} state - State to pass to history
     */
    navigate(path, state = {}) {
        // Don't navigate if already on the same path
        if (path === this.currentPath) return;

        // Update browser history
        window.history.pushState(state, '', path);

        // Handle route change
        this.handleRouteChange(path, state);
    }

    /**
     * Get the current component based on path
     * @returns {Function} Component function for the current route
     */
    getCurrentComponent() {
        const match = this.findRoute(this.currentPath);
        return match ? match.route.component : this.options.notFound;
    }

    /**
     * Create a link element with automatic navigation
     * @param {string} path - Path to link to
     * @param {Object} attrs - Additional attributes
     * @param {Array} children - Child elements
     * @returns {Object} Virtual DOM node
     */
    createLink(path, attrs = {}, children = []) {
        const isActive = this.currentPath === path;

        const onClick = (e) => {
            e.preventDefault();
            this.navigate(path);
        };

        return {
            tag: 'a',
            attrs: {
                href: path,
                onClick,
                'aria-current': isActive ? 'page' : null,
                ...attrs,
                class: `${attrs.class || ''} ${isActive ? 'active' : ''}`.trim()
            },
            children
        };
    }
}