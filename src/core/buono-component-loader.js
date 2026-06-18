/* ═══════════════════════════════════════════════════════════════ */
/* 🧩 BUONO COMPONENT LOADER                                       */
/* File: src/core/buono-component-loader.js                       */
/* Version: 1.0                                                    */
/* Date: 2026-06-17                                                */
/* Purpose: Universal HTML component fetcher + injector            */
/*                                                                 */
/* 🎯 USAGE:                                                       */
/*   <div data-component="topbar"></div>                          */
/*   <div data-component="sidebar"></div>                         */
/*                                                                 */
/* 🚀 FEATURES:                                                    */
/*   - Auto-scans DOM for [data-component]                        */
/*   - Fetches HTML from src/components/{name}.html               */
/*   - Caches via SmartStorage (1 hour TTL)                       */
/*   - Handles nested page paths (pages/hr/employees/)            */
/*   - Parallel loading                                            */
/*   - MutationObserver for dynamic components                    */
/*   - PerfTracker integration                                     */
/*   - Public API: window.BuonoComponents                         */
/* ═══════════════════════════════════════════════════════════════ */

(function(window, document) {
    'use strict';

    // ═══════════════════════════════════════════
    // 📋 SECTION 1: CONFIG
    // ═══════════════════════════════════════════
    const CONFIG = {
        version: '1.0',
        
        // Component base path (auto-resolved)
        componentBase: 'src/components/',
        
        // Cache settings
        useCache: true,
        cacheTTL: 60 * 60 * 1000,  // 1 hour
        cachePrefix: 'buono_component_',
        
        // Auto-init
        autoInit: true,
        autoScan: true,
        
        // Timing
        fetchTimeout: 5000,
        scanDebounce: 100,
        
        // Logging
        enableLogs: true,
        logPrefix: '[Components]',
        
        // PerfTracker integration
        enablePerfTracking: true,
        
        // Path resolution
        autoDetectBasePath: true   // Auto-detect for nested pages
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 2: STATE
    // ═══════════════════════════════════════════
    const state = {
        initialized: false,
        basePath: '',                    // Auto-detected
        loadedComponents: new Map(),     // name → HTML content
        loadingPromises: new Map(),      // name → Promise (dedupe)
        scannedElements: new WeakSet(),
        mutationObserver: null,
        scanTimer: null,
        stats: {
            scanned: 0,
            loaded: 0,
            cached: 0,
            failed: 0,
            fromCache: 0,
            fromNetwork: 0
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 3: UTILITIES
    // ═══════════════════════════════════════════
    function log(...args) {
        if (CONFIG.enableLogs) {
            console.log(CONFIG.logPrefix, ...args);
        }
    }

    function warn(...args) {
        if (CONFIG.enableLogs) {
            console.warn(CONFIG.logPrefix, ...args);
        }
    }

    function error(...args) {
        console.error(CONFIG.logPrefix, ...args);
    }

    function perfStart(name) {
        if (CONFIG.enablePerfTracking && window.PerfTracker) {
            try { window.PerfTracker.start(name); } catch(e) {}
        }
    }

    function perfEnd(name) {
        if (CONFIG.enablePerfTracking && window.PerfTracker) {
            try { window.PerfTracker.end(name); } catch(e) {}
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 4: BASE PATH DETECTION
    // Auto-detects how deep the page is nested
    // ═══════════════════════════════════════════
    function detectBasePath() {
        if (!CONFIG.autoDetectBasePath) {
            return '';
        }

        // Get current page path
        const path = window.location.pathname;
        
        // Count subdirectories to find depth
        // Examples:
        //   /index.html                                  → depth 0 → ''
        //   /pages/hr/employees/employees.html           → depth 3 → '../../../'
        //   /pages/finance/payment/payment.html          → depth 3 → '../../../'
        
        // Remove filename and leading slash
        const pathParts = path.split('/').filter(p => p && !p.includes('.'));
        const depth = pathParts.length;
        
        if (depth === 0) {
            return '';
        }
        
        // Generate ../ for each level
        return '../'.repeat(depth);
    }

    function resolveComponentPath(componentName) {
        const base = state.basePath || detectBasePath();
        return `${base}${CONFIG.componentBase}${componentName}.html`;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 5: CACHE HELPERS
    // ═══════════════════════════════════════════
    function getCacheKey(componentName) {
        return CONFIG.cachePrefix + componentName;
    }

    function getFromCache(componentName) {
        if (!CONFIG.useCache) return null;
        if (!window.SmartStorage) return null;
        
        try {
            const key = getCacheKey(componentName);
            return window.SmartStorage.get(key);
        } catch(e) {
            return null;
        }
    }

    function saveToCache(componentName, html) {
        if (!CONFIG.useCache) return;
        if (!window.SmartStorage) return;
        
        try {
            const key = getCacheKey(componentName);
            window.SmartStorage.set(key, html, CONFIG.cacheTTL);
        } catch(e) {
            warn('Cache save failed:', componentName, e);
        }
    }

    function clearCache(componentName) {
        if (!window.SmartStorage) return;
        
        try {
            if (componentName) {
                window.SmartStorage.remove(getCacheKey(componentName));
                log('Cache cleared:', componentName);
            } else {
                // Clear all component cache
                const keys = window.SmartStorage.listKeys();
                if (Array.isArray(keys)) {
                    keys.forEach(item => {
                        const k = typeof item === 'string' ? item : item.key;
                        if (k && k.startsWith(CONFIG.cachePrefix)) {
                            window.SmartStorage.remove(k);
                        }
                    });
                    log('All component cache cleared');
                }
            }
        } catch(e) {
            warn('Clear cache failed:', e);
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 6: FETCH COMPONENT HTML
    // ═══════════════════════════════════════════
    async function fetchComponentHtml(componentName) {
        // Check if already loading (dedupe)
        if (state.loadingPromises.has(componentName)) {
            return state.loadingPromises.get(componentName);
        }

        // Check memory first
        if (state.loadedComponents.has(componentName)) {
            return state.loadedComponents.get(componentName);
        }

        // Check cache
        const cached = getFromCache(componentName);
        if (cached) {
            state.loadedComponents.set(componentName, cached);
            state.stats.fromCache++;
            log(`📦 Cache HIT: ${componentName}`);
            return cached;
        }

        // Fetch from network
        const promise = (async () => {
            perfStart(`Component fetch: ${componentName}`);
            
            try {
                const url = resolveComponentPath(componentName);
                log(`🌐 Fetching: ${componentName} from ${url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.fetchTimeout);
                
                const response = await fetch(url, { 
                    signal: controller.signal,
                    cache: 'default'
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${url}`);
                }
                
                const html = await response.text();
                
                // Save to memory + cache
                state.loadedComponents.set(componentName, html);
                saveToCache(componentName, html);
                
                state.stats.fromNetwork++;
                state.stats.loaded++;
                
                perfEnd(`Component fetch: ${componentName}`);
                log(`✅ Loaded: ${componentName} (${(html.length / 1024).toFixed(1)}KB)`);
                
                return html;
                
            } catch(err) {
                state.stats.failed++;
                perfEnd(`Component fetch: ${componentName}`);
                
                if (err.name === 'AbortError') {
                    error(`Timeout: ${componentName}`);
                } else {
                    error(`Fetch failed: ${componentName}`, err.message);
                }
                
                return null;
            } finally {
                // Remove from loading promises
                state.loadingPromises.delete(componentName);
            }
        })();

        state.loadingPromises.set(componentName, promise);
        return promise;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 7: INJECT COMPONENT
    // ═══════════════════════════════════════════
    function injectComponent(element, html, componentName) {
        if (!element || !html) return false;
        
        try {
            // Set innerHTML
            element.innerHTML = html;
            
            // Remove the data-component attribute (mark as loaded)
            element.setAttribute('data-component-loaded', componentName);
            
            // Execute any inline scripts
            executeInlineScripts(element);
            
            // Dispatch event on element
            element.dispatchEvent(new CustomEvent('component:loaded', {
                bubbles: true,
                detail: { name: componentName }
            }));
            
            return true;
        } catch(err) {
            error('Inject failed:', componentName, err);
            return false;
        }
    }

    function executeInlineScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // Copy attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // Copy content
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }
            
            // Replace
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 8: PROCESS SINGLE ELEMENT
    // ═══════════════════════════════════════════
    async function processElement(element) {
        if (!element) return false;
        if (state.scannedElements.has(element)) return false;
        if (element.hasAttribute('data-component-loaded')) return false;
        
        const componentName = element.getAttribute('data-component');
        if (!componentName) return false;
        
        state.scannedElements.add(element);
        state.stats.scanned++;
        
        const html = await fetchComponentHtml(componentName);
        if (!html) return false;
        
        return injectComponent(element, html, componentName);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 9: SCAN & LOAD ALL
    // ═══════════════════════════════════════════
    async function scanAndLoad() {
        perfStart('Components scan & load');
        
        // Find all unloaded components
        const elements = document.querySelectorAll(
            '[data-component]:not([data-component-loaded])'
        );
        
        if (elements.length === 0) {
            perfEnd('Components scan & load');
            return { loaded: 0, failed: 0 };
        }
        
        log(`🔍 Scanning ${elements.length} component(s)...`);
        
        // Process all in parallel
        const promises = Array.from(elements).map(el => processElement(el));
        const results = await Promise.all(promises);
        
        const loaded = results.filter(r => r === true).length;
        const failed = results.length - loaded;
        
        perfEnd('Components scan & load');
        
        log(`✅ Loaded: ${loaded}/${elements.length}`);
        
        // Dispatch ready event
        if (loaded > 0) {
            document.dispatchEvent(new CustomEvent('buono:components-ready', {
                detail: { loaded, failed, total: elements.length }
            }));
        }
        
        return { loaded, failed };
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 10: MUTATION OBSERVER
    // Watches for dynamically added components
    // ═══════════════════════════════════════════
    function setupMutationObserver() {
        if (!('MutationObserver' in window)) return null;
        
        const observer = new MutationObserver((mutations) => {
            let needsScan = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return; // Element only
                    
                    // Check the node itself
                    if (node.hasAttribute && node.hasAttribute('data-component') && 
                        !node.hasAttribute('data-component-loaded')) {
                        needsScan = true;
                    }
                    
                    // Check children
                    if (node.querySelectorAll) {
                        const children = node.querySelectorAll(
                            '[data-component]:not([data-component-loaded])'
                        );
                        if (children.length > 0) {
                            needsScan = true;
                        }
                    }
                });
            });
            
            if (needsScan) {
                // Debounce
                clearTimeout(state.scanTimer);
                state.scanTimer = setTimeout(() => {
                    scanAndLoad();
                }, CONFIG.scanDebounce);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 11: PRELOAD COMPONENTS
    // Useful for preloading critical components
    // ═══════════════════════════════════════════
    async function preload(componentNames) {
        if (!Array.isArray(componentNames)) {
            componentNames = [componentNames];
        }
        
        log(`⚡ Preloading ${componentNames.length} component(s)...`);
        
        const promises = componentNames.map(name => fetchComponentHtml(name));
        const results = await Promise.all(promises);
        
        const success = results.filter(r => r !== null).length;
        log(`✅ Preloaded: ${success}/${componentNames.length}`);
        
        return { success, total: componentNames.length };
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 12: LOAD SPECIFIC COMPONENT
    // Manual loading API
    // ═══════════════════════════════════════════
    async function loadComponent(target, componentName) {
        let element;
        
        if (typeof target === 'string') {
            element = document.querySelector(target);
        } else {
            element = target;
        }
        
        if (!element) {
            warn('Target not found:', target);
            return false;
        }
        
        if (componentName) {
            element.setAttribute('data-component', componentName);
            element.removeAttribute('data-component-loaded');
        }
        
        // Remove from scanned set to allow reload
        state.scannedElements.delete(element);
        
        return processElement(element);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13: RELOAD COMPONENT
    // ═══════════════════════════════════════════
    async function reload(componentName) {
        // Clear cache
        clearCache(componentName);
        state.loadedComponents.delete(componentName);
        
        // Find all instances
        const elements = document.querySelectorAll(
            `[data-component-loaded="${componentName}"], [data-component="${componentName}"]`
        );
        
        log(`🔄 Reloading ${elements.length} instance(s) of: ${componentName}`);
        
        const promises = Array.from(elements).map(el => {
            el.removeAttribute('data-component-loaded');
            el.setAttribute('data-component', componentName);
            state.scannedElements.delete(el);
            return processElement(el);
        });
        
        const results = await Promise.all(promises);
        return results.filter(r => r === true).length;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 14: STATS
    // ═══════════════════════════════════════════
    function getStats() {
        return {
            ...state.stats,
            version: CONFIG.version,
            basePath: state.basePath,
            memoryCacheSize: state.loadedComponents.size,
            pendingLoads: state.loadingPromises.size,
            hitRate: state.stats.fromCache + state.stats.fromNetwork > 0
                ? ((state.stats.fromCache / (state.stats.fromCache + state.stats.fromNetwork)) * 100).toFixed(1) + '%'
                : 'N/A'
        };
    }

    function printStats() {
        const s = getStats();
        console.log('%c🧩 Component Loader Stats', 'color:#D4AF37;font-weight:bold;font-size:13px;');
        console.table({
            'Version': s.version,
            'Base Path': s.basePath || '(root)',
            'Scanned': s.scanned,
            'Loaded': s.loaded,
            'Failed': s.failed,
            'From Cache': s.fromCache,
            'From Network': s.fromNetwork,
            'Cache Hit Rate': s.hitRate,
            'Memory Cache': s.memoryCacheSize,
            'Pending': s.pendingLoads
        });
        return s;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 15: DESTROY
    // ═══════════════════════════════════════════
    function destroy() {
        if (state.mutationObserver) {
            state.mutationObserver.disconnect();
            state.mutationObserver = null;
        }
        
        clearTimeout(state.scanTimer);
        state.loadedComponents.clear();
        state.loadingPromises.clear();
        state.scannedElements = new WeakSet();
        state.initialized = false;
        
        log('Destroyed');
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 16: INIT
    // ═══════════════════════════════════════════
    async function init(userOptions = {}) {
        if (state.initialized) {
            warn('Already initialized');
            return;
        }
        
        // Merge user options
        Object.assign(CONFIG, userOptions);
        
        // Auto-detect base path
        state.basePath = detectBasePath();
        
        // Setup mutation observer
        if (CONFIG.autoScan) {
            state.mutationObserver = setupMutationObserver();
        }
        
        state.initialized = true;
        
        log(`Initialized ✓ (v${CONFIG.version})`, {
            basePath: state.basePath || '(root)',
            cache: !!window.SmartStorage,
            autoScan: CONFIG.autoScan
        });
        
        // Initial scan
        if (CONFIG.autoScan) {
            await scanAndLoad();
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 17: PUBLIC API
    // ═══════════════════════════════════════════
    const BuonoComponents = {
        version: CONFIG.version,
        
        // Lifecycle
        init: init,
        destroy: destroy,
        
        // Loading
        scan: scanAndLoad,
        load: loadComponent,
        reload: reload,
        preload: preload,
        
        // Cache
        clearCache: clearCache,
        
        // Stats
        stats: getStats,
        printStats: printStats,
        
        // Path
        resolveComponentPath: resolveComponentPath,
        detectBasePath: detectBasePath,
        
        // Config access (advanced)
        config: CONFIG,
        
        // Internal state (debug)
        _state: state
    };
    
    window.BuonoComponents = BuonoComponents;

    // ═══════════════════════════════════════════
    // 🚀 AUTO-INIT
    // ═══════════════════════════════════════════
    if (CONFIG.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => init());
        } else {
            init();
        }
    }

    console.log('🧩 Buono Component Loader loaded! (v' + CONFIG.version + ')');
    console.log('💡 Try: BuonoComponents.printStats() | BuonoComponents.scan()');

})(window, document);

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF BUONO-COMPONENT-LOADER.JS v1.0                        */
/* Lines: ~550                                                     */
/* Sections: 17                                                    */
/* Public API: window.BuonoComponents                              */
/* ═══════════════════════════════════════════════════════════════ */