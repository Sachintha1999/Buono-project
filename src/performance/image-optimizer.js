// ═══════════════════════════════════════════════════════════════
// 🖼️ BUONO IMAGE OPTIMIZER
// File: src/performance/image-optimizer.js
// Version: 1.0
// Purpose: Image lazy load, fallback, preload, format detection
// Dependencies: None
// Optional: lazy-loader.js, performance-tracker.js
// ═══════════════════════════════════════════════════════════════

(function(window, document) {
    'use strict';

    // ═══════════════════════════════════════════
    // 📋 SECTION 1: CONFIG
    // ═══════════════════════════════════════════
    const CONFIG = {
        version: '1.0',
        // Auto-init
        autoInit: true,
        autoScan: true,
        // Lazy loading
        rootMargin: '200px 0px',
        threshold: 0.01,
        // Fallback image (coffee themed SVG placeholder)
        fallbackSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23362417"/><text x="100" y="110" font-size="60" text-anchor="middle" fill="%23D4AF37">☕</text></svg>',
        placeholderSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23362417" opacity="0.3"/></svg>',
        // Preload
        preloadCritical: true,
        // Native lazy
        useNativeLazy: true,
        // Logging
        enableLogs: true,
        logPrefix: '[ImageOptimizer]',
        // PerfTracker integration
        enablePerfTracking: true
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 2: STATE
    // ═══════════════════════════════════════════
    const state = {
        initialized: false,
        observer: null,
        observedImages: new WeakSet(),
        loadedImages: new WeakSet(),
        preloadedUrls: new Set(),
        stats: {
            observed: 0,
            loaded: 0,
            failed: 0,
            preloaded: 0,
            fallbackUsed: 0
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 3: BROWSER SUPPORT
    // ═══════════════════════════════════════════
    const supports = {
        intersectionObserver: 'IntersectionObserver' in window,
        nativeLazyImg: 'loading' in HTMLImageElement.prototype,
        webp: false,    // Detected async
        avif: false,    // Detected async
        srcset: 'srcset' in document.createElement('img'),
        objectFit: 'objectFit' in document.documentElement.style
    };

    // Async format detection
    function detectFormat(format, dataURI) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img.width > 0 && img.height > 0);
            img.onerror = () => resolve(false);
            img.src = dataURI;
        });
    }

    async function detectFormats() {
        const [webp, avif] = await Promise.all([
            detectFormat('webp', 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='),
            detectFormat('avif', 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK')
        ]);
        supports.webp = webp;
        supports.avif = avif;
        log(`Format support: WebP=${webp ? '✓' : '✗'} AVIF=${avif ? '✓' : '✗'}`);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 4: UTILITIES
    // ═══════════════════════════════════════════
    function log(...args) {
        if (CONFIG.enableLogs) console.log(CONFIG.logPrefix, ...args);
    }

    function warn(...args) {
        if (CONFIG.enableLogs) console.warn(CONFIG.logPrefix, ...args);
    }

    function getElement(selector) {
        if (!selector) return null;
        if (typeof selector === 'string') return document.querySelector(selector);
        return selector;
    }

    function getElements(selector) {
        if (!selector) return [];
        if (typeof selector === 'string') return Array.from(document.querySelectorAll(selector));
        if (selector.length !== undefined) return Array.from(selector);
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
    // 📋 SECTION 5: IMAGE LOADER
    // ═══════════════════════════════════════════
    function loadImage(img) {
        if (!img || state.loadedImages.has(img)) return;

        const src = img.getAttribute('data-src') || img.src;
        const srcset = img.getAttribute('data-srcset');
        const sizes = img.getAttribute('data-sizes');

        if (!src && !srcset) return;

        perfStart('Image load: ' + (img.id || src.substring(src.lastIndexOf('/') + 1)));

        // Add loading class for animation
        img.classList.add('img-loading');

        // Use temp image to preload
        const tempImg = new Image();

        tempImg.onload = () => {
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            if (sizes) img.sizes = sizes;

            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            img.removeAttribute('data-sizes');

            img.classList.remove('img-loading');
            img.classList.add('img-loaded', 'anim-fade-in');

            state.loadedImages.add(img);
            state.stats.loaded++;

            // Dispatch event
            img.dispatchEvent(new CustomEvent('img:loaded', { bubbles: true }));

            perfEnd('Image load: ' + (img.id || src.substring(src.lastIndexOf('/') + 1)));
        };

        tempImg.onerror = () => {
            handleImageError(img, src);
            perfEnd('Image load: ' + (img.id || src.substring(src.lastIndexOf('/') + 1)));
        };

        if (srcset) tempImg.srcset = srcset;
        if (src) tempImg.src = src;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 6: ERROR HANDLER + FALLBACK
    // ═══════════════════════════════════════════
    function handleImageError(img, originalSrc) {
        warn('Image failed:', originalSrc);

        const fallback = img.getAttribute('data-fallback') || CONFIG.fallbackSrc;

        img.src = fallback;
        img.classList.remove('img-loading');
        img.classList.add('img-failed', 'img-fallback');
        img.setAttribute('data-original-failed', originalSrc || '');

        state.stats.failed++;
        state.stats.fallbackUsed++;

        // Dispatch event
        img.dispatchEvent(new CustomEvent('img:failed', {
            bubbles: true,
            detail: { originalSrc: originalSrc }
        }));
    }

    // Auto-attach error handler to all images
    function attachGlobalErrorHandler() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG' && !e.target.hasAttribute('data-no-fallback')) {
                if (!e.target.classList.contains('img-fallback')) {
                    handleImageError(e.target, e.target.src);
                }
            }
        }, true);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 7: INTERSECTION OBSERVER
    // ═══════════════════════════════════════════
    function setupObserver() {
        if (!supports.intersectionObserver) {
            warn('IntersectionObserver not supported - loading all images immediately');
            return null;
        }

        return new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        });
    }

    function observe(target) {
        const imgs = getElements(target).filter(el => el.tagName === 'IMG');

        imgs.forEach(img => {
            if (state.observedImages.has(img)) return;
            if (state.loadedImages.has(img)) return;

            // Set placeholder
            if (!img.src || img.src === window.location.href) {
                img.src = CONFIG.placeholderSrc;
            }

            // Use native lazy loading if supported
            if (CONFIG.useNativeLazy && supports.nativeLazyImg) {
                img.loading = 'lazy';
            }

            if (state.observer) {
                state.observer.observe(img);
            } else {
                loadImage(img);
            }

            state.observedImages.add(img);
            state.stats.observed++;
        });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 8: PRELOAD MANAGER
    // ═══════════════════════════════════════════
    function preload(urls, options = {}) {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const priority = options.priority || 'low';

        urlList.forEach(url => {
            if (!url || state.preloadedUrls.has(url)) return;

            // Method 1: <link rel="preload">
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            if (priority === 'high') {
                link.setAttribute('fetchpriority', 'high');
            }
            document.head.appendChild(link);

            // Method 2: Image() object (fallback)
            const img = new Image();
            img.src = url;

            state.preloadedUrls.add(url);
            state.stats.preloaded++;
        });

        log(`Preloaded ${urlList.length} image(s)`);
    }

    function preloadCriticalImages() {
        const critical = document.querySelectorAll('img[data-preload], img[data-critical]');
        const urls = [];
        critical.forEach(img => {
            const src = img.getAttribute('data-src') || img.src;
            if (src) urls.push(src);
        });
        if (urls.length > 0) {
            preload(urls, { priority: 'high' });
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 9: RESPONSIVE HELPER
    // ═══════════════════════════════════════════
    function buildSrcset(baseUrl, widths = [320, 640, 960, 1280]) {
        if (!baseUrl) return '';
        // Pattern: image.jpg → image-320w.jpg, image-640w.jpg, etc.
        // User can override with custom URL pattern
        const dotIdx = baseUrl.lastIndexOf('.');
        if (dotIdx === -1) return baseUrl;

        const base = baseUrl.substring(0, dotIdx);
        const ext = baseUrl.substring(dotIdx);

        return widths
            .map(w => `${base}-${w}w${ext} ${w}w`)
            .join(', ');
    }

    function applySrcset(img, baseUrl, widths) {
        const srcset = buildSrcset(baseUrl, widths);
        img.srcset = srcset;
        if (!img.sizes) {
            img.sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw';
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 10: FORMAT HELPER
    // ═══════════════════════════════════════════
    function getBestFormat() {
        if (supports.avif) return 'avif';
        if (supports.webp) return 'webp';
        return 'jpg';
    }

    function optimizeUrl(url) {
        // If user has format placeholder, replace
        if (url.includes('{format}')) {
            return url.replace('{format}', getBestFormat());
        }
        return url;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 11: AUTO-SCAN
    // ═══════════════════════════════════════════
    function scan() {
        perfStart('ImageOptimizer scan');

        // Lazy images: <img data-src="...">
        const lazyImgs = document.querySelectorAll('img[data-src]:not([data-img-observed])');
        lazyImgs.forEach(img => {
            img.setAttribute('data-img-observed', 'true');
            observe(img);
        });

        // Auto-mark all images without explicit handling
        const allImgs = document.querySelectorAll('img:not([data-no-optimize]):not([data-img-observed])');
        allImgs.forEach(img => {
            // Only optimize if has src (already loaded) for error handling
            if (img.src && !img.classList.contains('img-loaded')) {
                img.setAttribute('data-img-observed', 'true');
                // Add error handler if not present
                if (!img.onerror) {
                    img.addEventListener('error', () => {
                        if (!img.classList.contains('img-fallback')) {
                            handleImageError(img, img.src);
                        }
                    });
                }
            }
        });

        // Critical preload
        if (CONFIG.preloadCritical) {
            preloadCriticalImages();
        }

        perfEnd('ImageOptimizer scan');
        log(`Scan complete: ${lazyImgs.length} lazy images observed`);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 12: CSS INJECTION
    // ═══════════════════════════════════════════
    function injectCSS() {
        if (document.getElementById('imageOptimizerStyles')) return;

        const style = document.createElement('style');
        style.id = 'imageOptimizerStyles';
        style.textContent = `
            /* Image Optimizer Styles */
            img.img-loading {
                opacity: 0.5;
                filter: blur(8px);
                transition: opacity 0.3s ease, filter 0.4s ease;
            }
            img.img-loaded {
                opacity: 1;
                filter: blur(0);
                transition: opacity 0.4s ease, filter 0.4s ease;
            }
            img.img-failed {
                opacity: 0.7;
            }
            img.img-fallback {
                background: #362417;
                border-radius: 8px;
            }
            @keyframes imgFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13: STATS
    // ═══════════════════════════════════════════
    function getStats() {
        return {
            ...state.stats,
            version: CONFIG.version,
            supports: supports,
            bestFormat: getBestFormat()
        };
    }

    function printStats() {
        const s = getStats();
        console.log('%c🖼️ ImageOptimizer Stats', 'color:#D4AF37;font-weight:bold;font-size:13px;');
        console.table({
            observed: s.observed,
            loaded: s.loaded,
            failed: s.failed,
            preloaded: s.preloaded,
            fallbackUsed: s.fallbackUsed
        });
        console.log('Support:', s.supports);
        return s;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 14: DESTROY
    // ═══════════════════════════════════════════
    function destroy() {
        if (state.observer) {
            state.observer.disconnect();
            state.observer = null;
        }
        state.observedImages = new WeakSet();
        state.loadedImages = new WeakSet();
        state.initialized = false;
        log('Destroyed');
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 15: INIT + PUBLIC API
    // ═══════════════════════════════════════════
    async function init(userOptions = {}) {
        if (state.initialized) {
            warn('Already initialized');
            return;
        }

        Object.assign(CONFIG, userOptions);

        // Inject CSS
        injectCSS();

        // Detect formats (async)
        detectFormats();

        // Setup observer
        state.observer = setupObserver();

        // Attach global error handler
        attachGlobalErrorHandler();

        // Initial scan
        if (CONFIG.autoScan) {
            scan();
        }

        state.initialized = true;
        log(`Initialized ✓ (v${CONFIG.version})`, {
            io: supports.intersectionObserver,
            nativeLazy: supports.nativeLazyImg,
            autoScan: CONFIG.autoScan
        });
    }

    // Public API
    const ImageOptimizer = {
        version: CONFIG.version,
        init: init,
        destroy: destroy,
        // Loading
        loadImage: loadImage,
        observe: observe,
        rescan: scan,
        // Preload
        preload: preload,
        // Responsive
        buildSrcset: buildSrcset,
        applySrcset: applySrcset,
        // Format
        getBestFormat: getBestFormat,
        optimizeUrl: optimizeUrl,
        // Error
        handleError: handleImageError,
        // Stats
        stats: getStats,
        printStats: printStats,
        // Config access
        config: CONFIG,
        supports: supports
    };

    window.ImageOptimizer = ImageOptimizer;

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

    console.log('🖼️ Image Optimizer loaded! (v' + CONFIG.version + ')');
    console.log('💡 Try: ImageOptimizer.printStats() | ImageOptimizer.preload(url)');

})(window, document);