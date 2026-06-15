// ═══════════════════════════════════════════════════════════════
// ⚡ BUONO LAZY LOADER
// File: src/performance/lazy-loader.js
// Version: 1.0
// Purpose: Universal lazy loading + skeleton orchestration
// Dependencies: skeleton-loading.css (existing)
// Optional: performance-tracker.js, smart-storage-cache.js
// ═══════════════════════════════════════════════════════════════

(function(window, document) {
    'use strict';

    // ═══════════════════════════════════════════
    // 📋 SECTION 1: CONFIG
    // ═══════════════════════════════════════════
    const CONFIG = {
        version: '1.0',
        // IntersectionObserver options
        rootMargin: '100px 0px',      // Load 100px before viewport
        threshold: 0.01,               // Trigger at 1% visibility
        // Auto-init
        autoInit: true,
        autoScan: true,
        // Skeleton defaults
        defaultSkeletonCount: 3,
        skeletonMinDuration: 200,     // Min show time (avoid flash)
        // Image
        imageFallback: null,           // Set to URL if needed
        // Logging
        enableLogs: true,
        logPrefix: '[LazyLoader]',
        // PerfTracker integration
        enablePerfTracking: true
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 2: STATE
    // ═══════════════════════════════════════════
    const state = {
        initialized: false,
        observer: null,
        mutationObserver: null,
        observedElements: new WeakSet(),
        skeletonMap: new WeakMap(),    // element → skeleton wrapper
        stats: {
            observed: 0,
            loaded: 0,
            skeletonsShown: 0,
            skeletonsHidden: 0,
            imagesLoaded: 0,
            errors: 0
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

    function getElement(selector) {
        if (!selector) return null;
        if (typeof selector === 'string') {
            return document.querySelector(selector);
        }
        return selector;
    }

    function getElements(selector) {
        if (!selector) return [];
        if (typeof selector === 'string') {
            return Array.from(document.querySelectorAll(selector));
        }
        if (selector.length !== undefined) {
            return Array.from(selector);
        }
        return [selector];
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
    // 📋 SECTION 4: BROWSER SUPPORT
    // ═══════════════════════════════════════════
    const supports = {
        intersectionObserver: 'IntersectionObserver' in window,
        mutationObserver: 'MutationObserver' in window,
        nativeLazyImg: 'loading' in HTMLImageElement.prototype
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 5: SKELETON TEMPLATES
    // ═══════════════════════════════════════════
    const templates = {
        // Table rows skeleton
        'table-rows': (count = 3, cols = 5) => {
            let rows = '';
            for (let i = 0; i < count; i++) {
                let cells = '';
                for (let j = 0; j < cols; j++) {
                    cells += `<td><div class="skeleton skeleton-text sk-w-80"></div></td>`;
                }
                rows += `<tr>${cells}</tr>`;
            }
            return rows;
        },

        // Stat cards (5 cards row)
        'stat-cards': (count = 5) => {
            let cards = '';
            for (let i = 0; i < count; i++) {
                cards += `
                    <div class="skeleton-stat-card">
                        <div class="skeleton skeleton-stat-icon"></div>
                        <div class="skeleton-stat-content">
                            <div class="skeleton skeleton-text-lg sk-w-60"></div>
                            <div class="skeleton skeleton-text sk-w-80"></div>
                        </div>
                    </div>
                `;
            }
            return `<div class="skeleton-stats-row">${cards}</div>`;
        },

        // List items (pending list, call history, etc.)
        'list-items': (count = 3) => {
            let items = '';
            for (let i = 0; i < count; i++) {
                items += `
                    <div style="background:#0f3460;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
                        <div class="skeleton skeleton-circle" style="width:40px;height:40px;flex-shrink:0;"></div>
                        <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                            <div class="skeleton skeleton-text sk-w-60"></div>
                            <div class="skeleton skeleton-text-sm sk-w-40"></div>
                        </div>
                    </div>
                `;
            }
            return items;
        },

        // Text lines (paragraphs)
        'text-lines': (count = 4) => {
            let lines = '';
            const widths = ['sk-w-100', 'sk-w-80', 'sk-w-100', 'sk-w-60'];
            for (let i = 0; i < count; i++) {
                const w = widths[i % widths.length];
                lines += `<div class="skeleton skeleton-text ${w} sk-mb-8"></div>`;
            }
            return lines;
        },

        // Card grid (course cards, etc.)
        'card-grid': (count = 4) => {
            let cards = '';
            for (let i = 0; i < count; i++) {
                cards += `
                    <div class="skeleton-stat-card" style="flex-direction:column;align-items:stretch;">
                        <div class="skeleton skeleton-text-lg sk-w-80 sk-mb-12"></div>
                        <div class="skeleton skeleton-text sk-w-100 sk-mb-8"></div>
                        <div class="skeleton skeleton-text sk-w-60"></div>
                    </div>
                `;
            }
            return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">${cards}</div>`;
        },

        // Form fields
        'form-fields': (count = 4) => {
            let fields = '';
            for (let i = 0; i < count; i++) {
                fields += `
                    <div class="skeleton-form-group">
                        <div class="skeleton skeleton-text-sm sk-w-30 sk-mb-8"></div>
                        <div class="skeleton skeleton-input sk-w-100"></div>
                    </div>
                `;
            }
            return fields;
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 6: SKELETON MANAGER
    // ═══════════════════════════════════════════
    function buildSkeletonHTML(type, count, cols) {
        const tpl = templates[type];
        if (!tpl) {
            warn(`Unknown skeleton template: ${type}`);
            return templates['text-lines'](count || 3);
        }
        return tpl(count, cols);
    }

    function showSkeleton(target, type = 'text-lines', count = null, cols = 5) {
        const el = getElement(target);
        if (!el) {
            warn('showSkeleton: target not found', target);
            return false;
        }

        const skeletonCount = count || CONFIG.defaultSkeletonCount;
        const html = buildSkeletonHTML(type, skeletonCount, cols);

        // Store original content
        if (!state.skeletonMap.has(el)) {
            state.skeletonMap.set(el, {
                originalHTML: el.innerHTML,
                shownAt: Date.now(),
                type: type
            });
        }

        // For tables, inject into tbody
        if (el.tagName === 'TABLE') {
            const tbody = el.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = html;
            } else {
                el.innerHTML = `<tbody>${html}</tbody>`;
            }
        } else {
            el.innerHTML = `<div class="skeleton-wrapper">${html}</div>`;
        }

        el.setAttribute('data-skeleton-active', 'true');
        state.stats.skeletonsShown++;
        log(`Skeleton shown: ${type} (${skeletonCount}) on`, el.id || el.className);
        return true;
    }

    function hideSkeleton(target, newContent = null) {
        const el = getElement(target);
        if (!el) return false;

        const data = state.skeletonMap.get(el);
        if (!data) return false;

        const elapsed = Date.now() - data.shownAt;
        const remaining = Math.max(0, CONFIG.skeletonMinDuration - elapsed);

        const doHide = () => {
            // Inject new content or restore original
            if (newContent !== null) {
                if (el.tagName === 'TABLE') {
                    const tbody = el.querySelector('tbody');
                    if (tbody) {
                        tbody.innerHTML = newContent;
                    }
                } else {
                    el.innerHTML = newContent;
                }
            }

            // Add fade-in class
            const realContent = el.querySelector('.real-content');
            if (realContent) {
                requestAnimationFrame(() => {
                    realContent.classList.add('visible');
                });
            }

            el.removeAttribute('data-skeleton-active');
            state.skeletonMap.delete(el);
            state.stats.skeletonsHidden++;
            log('Skeleton hidden:', el.id || el.className);
        };

        if (remaining > 0) {
            setTimeout(doHide, remaining);
        } else {
            doHide();
        }
        return true;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 7: ELEMENT REVEAL
    // ═══════════════════════════════════════════
    function revealElement(el) {
        if (!el || el.hasAttribute('data-lazy-loaded')) return;

        perfStart('Lazy reveal: ' + (el.id || el.tagName));

        // Image lazy load
        if (el.tagName === 'IMG') {
            loadImage(el);
        }
        // Section/div with data-src for image
        else if (el.hasAttribute('data-bg-src')) {
            const src = el.getAttribute('data-bg-src');
            el.style.backgroundImage = `url(${src})`;
            el.removeAttribute('data-bg-src');
        }
        // Generic reveal with animation
        else {
            el.classList.add('anim-fade-in');
        }

        // Fire callback if defined
        const cb = el.getAttribute('data-lazy-callback');
        if (cb && typeof window[cb] === 'function') {
            try {
                window[cb](el);
            } catch(e) {
                error('Callback failed:', cb, e);
                state.stats.errors++;
            }
        }

        // Dispatch event
        el.dispatchEvent(new CustomEvent('lazy:loaded', { bubbles: true }));

        el.setAttribute('data-lazy-loaded', 'true');
        state.stats.loaded++;

        perfEnd('Lazy reveal: ' + (el.id || el.tagName));
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 8: IMAGE LOADER
    // ═══════════════════════════════════════════
    function loadImage(img) {
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');

        if (!src && !srcset) return;

        const tempImg = new Image();
        tempImg.onload = () => {
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            img.classList.add('anim-fade-in');
            state.stats.imagesLoaded++;
        };
        tempImg.onerror = () => {
            warn('Image load failed:', src);
            if (CONFIG.imageFallback) {
                img.src = CONFIG.imageFallback;
            }
            state.stats.errors++;
        };
        if (src) tempImg.src = src;
        if (srcset) tempImg.srcset = srcset;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 9: INTERSECTION OBSERVER
    // ═══════════════════════════════════════════
    function setupObserver() {
        if (!supports.intersectionObserver) {
            warn('IntersectionObserver not supported - loading all immediately');
            return null;
        }

        return new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealElement(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        });
    }

    function observe(target) {
        const els = getElements(target);
        els.forEach(el => {
            if (state.observedElements.has(el)) return;
            if (el.hasAttribute('data-lazy-loaded')) return;

            if (state.observer) {
                state.observer.observe(el);
            } else {
                // Fallback: load immediately
                revealElement(el);
            }
            state.observedElements.add(el);
            state.stats.observed++;
        });
    }

    function unobserve(target) {
        const els = getElements(target);
        els.forEach(el => {
            if (state.observer) {
                state.observer.unobserve(el);
            }
        });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 10: AUTO-SCAN
    // ═══════════════════════════════════════════
    function scan() {
        perfStart('LazyLoader scan');

        // Generic data-lazy elements
        const lazyEls = document.querySelectorAll('[data-lazy]:not([data-lazy-loaded])');
        lazyEls.forEach(el => observe(el));

        // Lazy images
        const lazyImgs = document.querySelectorAll('img[data-src]:not([data-lazy-loaded])');
        lazyImgs.forEach(el => observe(el));

        // Background images
        const lazyBgs = document.querySelectorAll('[data-bg-src]:not([data-lazy-loaded])');
        lazyBgs.forEach(el => observe(el));

        // Auto-skeleton elements
        const skeletonEls = document.querySelectorAll('[data-skeleton]:not([data-skeleton-active])');
        skeletonEls.forEach(el => {
            const type = el.getAttribute('data-skeleton');
            const count = parseInt(el.getAttribute('data-skeleton-count')) || null;
            const cols = parseInt(el.getAttribute('data-skeleton-cols')) || 5;
            showSkeleton(el, type, count, cols);
        });

        perfEnd('LazyLoader scan');
        log(`Scan complete: ${lazyEls.length + lazyImgs.length + lazyBgs.length} elements observed`);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 11: MUTATION OBSERVER
    // ═══════════════════════════════════════════
    function setupMutationObserver() {
        if (!supports.mutationObserver) return null;

        const obs = new MutationObserver(mutations => {
            let needsRescan = false;
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return; // Element only
                    if (node.hasAttribute && (
                        node.hasAttribute('data-lazy') ||
                        node.hasAttribute('data-src') ||
                        node.hasAttribute('data-bg-src') ||
                        node.hasAttribute('data-skeleton')
                    )) {
                        needsRescan = true;
                    }
                    // Check children
                    if (node.querySelectorAll) {
                        const children = node.querySelectorAll(
                            '[data-lazy], [data-src], [data-bg-src], [data-skeleton]'
                        );
                        if (children.length > 0) needsRescan = true;
                    }
                });
            });

            if (needsRescan) {
                // Debounce
                clearTimeout(setupMutationObserver._timer);
                setupMutationObserver._timer = setTimeout(scan, 100);
            }
        });

        obs.observe(document.body, {
            childList: true,
            subtree: true
        });

        return obs;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 12: STATS
    // ═══════════════════════════════════════════
    function getStats() {
        return {
            ...state.stats,
            version: CONFIG.version,
            supported: supports,
            observedNow: state.stats.observed - state.stats.loaded
        };
    }

    function printStats() {
        const s = getStats();
        console.log('%c⚡ LazyLoader Stats', 'color:#f0a500;font-weight:bold;font-size:13px;');
        console.table(s);
        return s;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13: TABLE LOADING HELPER
    // ═══════════════════════════════════════════
    function showTableLoading(tableId, rows = 5, cols = 5) {
        return showSkeleton('#' + tableId, 'table-rows', rows, cols);
    }

    function hideTableLoading(tableId, htmlContent = null) {
        return hideSkeleton('#' + tableId, htmlContent);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 14: DESTROY / CLEANUP
    // ═══════════════════════════════════════════
    function destroy() {
        if (state.observer) {
            state.observer.disconnect();
            state.observer = null;
        }
        if (state.mutationObserver) {
            state.mutationObserver.disconnect();
            state.mutationObserver = null;
        }
        state.observedElements = new WeakSet();
        state.skeletonMap = new WeakMap();
        state.initialized = false;
        log('Destroyed');
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 15: INIT + PUBLIC API
    // ═══════════════════════════════════════════
    function init(userOptions = {}) {
        if (state.initialized) {
            warn('Already initialized');
            return;
        }

        // Merge user config
        Object.assign(CONFIG, userOptions);

        // Setup observers
        state.observer = setupObserver();
        if (CONFIG.autoScan) {
            state.mutationObserver = setupMutationObserver();
        }

        // Initial scan
        if (CONFIG.autoScan) {
            scan();
        }

        state.initialized = true;
        log(`Initialized ✓ (v${CONFIG.version})`, {
            io: supports.intersectionObserver,
            mo: supports.mutationObserver,
            autoScan: CONFIG.autoScan
        });
    }

    // Public API
    const LazyLoader = {
        version: CONFIG.version,
        init: init,
        destroy: destroy,
        // Observation
        observe: observe,
        unobserve: unobserve,
        rescan: scan,
        // Skeleton
        showSkeleton: showSkeleton,
        hideSkeleton: hideSkeleton,
        showTableLoading: showTableLoading,
        hideTableLoading: hideTableLoading,
        // Manual reveal
        reveal: revealElement,
        loadImage: loadImage,
        // Stats
        stats: getStats,
        printStats: printStats,
        // Config access
        config: CONFIG,
        templates: templates,
        supports: supports
    };

    window.LazyLoader = LazyLoader;

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

    console.log('⚡ Lazy Loader loaded! (v' + CONFIG.version + ')');
    console.log('💡 Try: LazyLoader.printStats() | LazyLoader.rescan()');

})(window, document);