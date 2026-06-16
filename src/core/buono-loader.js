/* ═══════════════════════════════════════════════════════════════ */
/* 🚀 BUONO PROJECT - SMART CENTRAL JS LOADER                      */
/* File: src/core/buono-loader.js                                  */
/* Version: 2.4 - Theme Master Auto-Load                           */
/* Date: 2026-06-16                                                */
/*                                                                 */
/* 🎯 USAGE in HTML:                                               */
/*                                                                 */
/*   📌 SIMPLE (Old way - still works!):                          */
/*   <script src="src/core/buono-loader.js"                        */
/*           data-page-script="access-script.js"></script>         */
/*                                                                 */
/*   📌 ADVANCED (v2.3+ way):                                     */
/*   <script src="src/core/buono-loader.js"                        */
/*           data-page-css="welcome-style.css,welcome-mobile.css"  */
/*           data-page-data="welcome-data.js"                      */
/*           data-page-script="welcome-script.js"                  */
/*           data-page-extras="welcome-extras.js"></script>        */
/*                                                                 */
/* 🆕 v2.4 CHANGES:                                                */
/*   - 🎨 theme-master.css AUTO-loaded on every page (FOUC-safe)  */
/*   - Loads FIRST before any page CSS                             */
/*   - Synchronous load to prevent unstyled flash                  */
/*   - data-skip-theme="true" to disable (e.g., login pages)      */
/*                                                                 */
/* 🆕 v2.3 (Kept):                                                 */
/*   - data-page-css: Auto-load page CSS (comma-separated)         */
/*   - data-page-data: Load data file BEFORE script                */
/*   - data-page-extras: Load extras AFTER script                  */
/*                                                                 */
/* 🆕 v2.2 (Kept):                                                 */
/*   - 3-phase loading (Critical → Foundation → Optional)          */
/*   - Performance Tracker, Smart Storage, API Cache               */
/*   - Lazy Loader, Image Optimizer, Mobile Touch                  */
/* ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════
    // ⚙️ CONFIGURATION
    // ═══════════════════════════════════════════════
    const CONFIG = {
        debug: true,
        version: '2.4',
        criticalTimeout: 10000,
        foundationTimeout: 5000,
        optionalTimeout: 5000,
        pageScriptTimeout: 10000,
        pageCssTimeout: 5000,
        themeCssTimeout: 3000,
        
        // 🆕 v2.4: Theme master CSS path (auto-loaded)
        themeMasterPath: 'src/theme/theme-master.css'
    };

    // ═══════════════════════════════════════════════
    // 📦 PHASE 1: CRITICAL MODULES (Sequential - BLOCKS)
    // ═══════════════════════════════════════════════
    const CRITICAL_MODULES = [
        { 
            path: 'firebase-config.js',
            name: 'Firebase Config',
            globalCheck: () => typeof db !== 'undefined' && typeof DATABASES !== 'undefined'
        }
    ];

    // ═══════════════════════════════════════════════
    // 📦 PHASE 2: FOUNDATION MODULES (Sequential)
    // ═══════════════════════════════════════════════
    const FOUNDATION_MODULES = [
        { 
            path: 'src/performance/performance-tracker.js',
            name: 'Performance Tracker',
            globalCheck: () => typeof window.PerfTracker !== 'undefined' || typeof PerfTracker !== 'undefined'
        },
        { 
            path: 'src/performance/smart-storage-cache.js',
            name: 'Smart Storage Cache',
            globalCheck: () => typeof window.SmartStorage !== 'undefined' || typeof SmartStorage !== 'undefined'
        }
    ];

    // ═══════════════════════════════════════════════
    // 📦 PHASE 3: OPTIONAL MODULES (Parallel - non-blocking)
    // ═══════════════════════════════════════════════
    const OPTIONAL_MODULES = [
        { 
            path: 'src/performance/api-cache.js',
            name: 'API Cache',
            globalCheck: () => typeof window.ApiCache !== 'undefined'
        },
        { 
            path: 'src/performance/lazy-loader.js',
            name: 'Lazy Loader',
            globalCheck: () => typeof window.LazyLoader !== 'undefined'
        },
        { 
            path: 'src/performance/image-optimizer.js',
            name: 'Image Optimizer',
            globalCheck: () => typeof window.ImageOptimizer !== 'undefined'
        },
        { 
            path: 'src/mobile/mobile-touch.js',
            name: 'Mobile Touch',
            globalCheck: () => typeof window.MobileUX !== 'undefined'
        }
    ];

    // ═══════════════════════════════════════════════
    // 🎨 LOGGER
    // ═══════════════════════════════════════════════
    function log(emoji, message, data) {
        if (!CONFIG.debug) return;
        const prefix = `${emoji} [BuonoLoader]`;
        if (data !== undefined) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    // ═══════════════════════════════════════════════
    // 📥 SCRIPT LOADER
    // ═══════════════════════════════════════════════
    function loadScript(module, timeout) {
        return new Promise((resolve, reject) => {
            const src = module.path;

            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                log('⏭️', `Skipped (already loaded): ${module.name}`);
                resolve(module);
                return;
            }

            if (module.globalCheck && module.globalCheck()) {
                log('⏭️', `Skipped (global exists): ${module.name}`);
                resolve(module);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.buonoModule = module.name;

            const timeoutId = setTimeout(() => {
                log('⏰', `Timeout: ${module.name} (${timeout}ms)`);
                reject(new Error(`Timeout: ${module.name}`));
            }, timeout);

            script.onload = () => {
                clearTimeout(timeoutId);
                log('✅', `Loaded: ${module.name}`);
                resolve(module);
            };

            script.onerror = () => {
                clearTimeout(timeoutId);
                log('❌', `Failed: ${module.name} (${src})`);
                reject(new Error(`Failed: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    // ═══════════════════════════════════════════════
    // 🎨 CSS LOADER
    // ═══════════════════════════════════════════════
    function loadStylesheet(cssPath, timeout, isTheme = false) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`link[href="${cssPath}"]`);
            if (existing) {
                log('⏭️', `CSS skipped (already loaded): ${cssPath}`);
                resolve(cssPath);
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            link.dataset.buonoCss = isTheme ? 'theme-master' : 'page-style';

            const timeoutId = setTimeout(() => {
                log('⏰', `CSS Timeout: ${cssPath}`);
                resolve(cssPath); // Don't reject - CSS failures shouldn't block
            }, timeout);

            link.onload = () => {
                clearTimeout(timeoutId);
                const icon = isTheme ? '🎨' : '🎨';
                log(icon, `CSS Loaded: ${cssPath}`);
                resolve(cssPath);
            };

            link.onerror = () => {
                clearTimeout(timeoutId);
                log('⚠️', `CSS Failed: ${cssPath}`);
                resolve(cssPath); // Don't reject - allow page to continue
            };

            document.head.appendChild(link);
        });
    }

    // ═══════════════════════════════════════════════
    // 🎨 LOAD THEME MASTER (NEW v2.4 - CRITICAL!)
    // FOUC-safe: Loaded SYNCHRONOUSLY before page renders
    // ═══════════════════════════════════════════════
    async function loadThemeMaster() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[src*="buono-loader.js"]');
        
        // Allow opt-out: data-skip-theme="true"
        if (currentScript && currentScript.dataset.skipTheme === 'true') {
            log('⏭️', 'Theme master skipped (data-skip-theme="true")');
            return { skipped: true };
        }

        // Check if already loaded manually in <head>
        const existingTheme = document.querySelector(
            `link[href*="theme-master.css"], link[data-buono-css="theme-master"]`
        );
        
        if (existingTheme) {
            log('⏭️', 'Theme master already in <head>');
            return { loaded: true, source: 'manual' };
        }

        log('🎨', `Loading theme master: ${CONFIG.themeMasterPath}`);
        
        try {
            await loadStylesheet(CONFIG.themeMasterPath, CONFIG.themeCssTimeout, true);
            return { loaded: true, source: 'auto' };
        } catch (error) {
            log('⚠️', 'Theme master failed to load (page will use fallbacks)');
            return { loaded: false, error: error.message };
        }
    }

    // ═══════════════════════════════════════════════
    // 🎨 LOAD PAGE CSS (v2.3 - Parallel)
    // ═══════════════════════════════════════════════
    async function loadPageCss() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[data-page-script], script[data-page-css]');
        
        if (!currentScript) {
            return { loaded: [], failed: [] };
        }

        const pageCssAttr = currentScript.dataset.pageCss;
        if (!pageCssAttr) {
            return { loaded: [], failed: [] };
        }

        // Split comma-separated CSS files
        const cssFiles = pageCssAttr.split(',').map(f => f.trim()).filter(f => f.length > 0);
        
        if (cssFiles.length === 0) {
            return { loaded: [], failed: [] };
        }

        log('🎨', `Loading ${cssFiles.length} page CSS file(s) in parallel...`);

        // Load all CSS files in parallel (faster!)
        const promises = cssFiles.map(cssPath => 
            loadStylesheet(cssPath, CONFIG.pageCssTimeout, false)
                .then(() => ({ status: 'loaded', path: cssPath }))
                .catch(() => ({ status: 'failed', path: cssPath }))
        );

        const results = await Promise.all(promises);

        return {
            loaded: results.filter(r => r.status === 'loaded').map(r => r.path),
            failed: results.filter(r => r.status === 'failed').map(r => r.path)
        };
    }

    // ═══════════════════════════════════════════════
    // 🔥 PHASE 1: LOAD CRITICAL (Sequential)
    // ═══════════════════════════════════════════════
    async function loadCritical() {
        log('🔥', `Loading ${CRITICAL_MODULES.length} critical module(s)...`);
        const results = { loaded: [], failed: [] };

        for (const module of CRITICAL_MODULES) {
            try {
                await loadScript(module, CONFIG.criticalTimeout);
                results.loaded.push(module.name);
            } catch (error) {
                results.failed.push(module.name);
                log('🚨', `CRITICAL FAILED: ${module.name}`);
            }
        }

        return results;
    }

    // ═══════════════════════════════════════════════
    // 🏗️ PHASE 2: LOAD FOUNDATION (Sequential)
    // ═══════════════════════════════════════════════
    async function loadFoundation() {
        if (FOUNDATION_MODULES.length === 0) {
            return { loaded: [], failed: [] };
        }

        log('🏗️', `Loading ${FOUNDATION_MODULES.length} foundation module(s)...`);
        const results = { loaded: [], failed: [] };

        for (const module of FOUNDATION_MODULES) {
            try {
                await loadScript(module, CONFIG.foundationTimeout);
                results.loaded.push(module.name);
            } catch (error) {
                results.failed.push(module.name);
                log('⚠️', `Foundation failed (non-blocking): ${module.name}`);
            }
        }

        return results;
    }

    // ═══════════════════════════════════════════════
    // ⚡ PHASE 3: LOAD OPTIONAL (Parallel)
    // ═══════════════════════════════════════════════
    async function loadOptional() {
        if (OPTIONAL_MODULES.length === 0) {
            return { loaded: [], failed: [] };
        }

        log('⚡', `Loading ${OPTIONAL_MODULES.length} optional module(s) in parallel...`);

        const promises = OPTIONAL_MODULES.map(module =>
            loadScript(module, CONFIG.optionalTimeout)
                .then(() => ({ status: 'loaded', name: module.name }))
                .catch(() => ({ status: 'failed', name: module.name }))
        );

        const results = await Promise.all(promises);

        return {
            loaded: results.filter(r => r.status === 'loaded').map(r => r.name),
            failed: results.filter(r => r.status === 'failed').map(r => r.name)
        };
    }

    // ═══════════════════════════════════════════════
    // 📄 LOAD PAGE SCRIPTS (v2.3)
    // Loading order: data → script → extras (sequential)
    // ═══════════════════════════════════════════════
    async function loadPageScripts() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[data-page-script], script[data-page-data], script[data-page-extras]');
        
        if (!currentScript) {
            log('ℹ️', 'No page scripts specified');
            return { data: null, script: null, extras: null };
        }

        const pageDataPath = currentScript.dataset.pageData;
        const pageScriptPath = currentScript.dataset.pageScript;
        const pageExtrasPath = currentScript.dataset.pageExtras;

        const results = {
            data: { loaded: false },
            script: { loaded: false },
            extras: { loaded: false }
        };

        // ── 1. Load DATA file first (if exists) ──
        if (pageDataPath) {
            log('📊', `Loading page data: ${pageDataPath}`);
            try {
                await loadScript({
                    path: pageDataPath,
                    name: 'Page Data'
                }, CONFIG.pageScriptTimeout);
                results.data = { loaded: true, path: pageDataPath };
            } catch (error) {
                log('❌', `Page data failed: ${pageDataPath}`);
                results.data = { loaded: false, error: error.message };
            }
        }

        // ── 2. Load MAIN SCRIPT (if exists) ──
        if (pageScriptPath) {
            log('📄', `Loading page script: ${pageScriptPath}`);
            try {
                await loadScript({
                    path: pageScriptPath,
                    name: 'Page Script'
                }, CONFIG.pageScriptTimeout);
                results.script = { loaded: true, path: pageScriptPath };
            } catch (error) {
                log('❌', `Page script failed: ${pageScriptPath}`);
                results.script = { loaded: false, error: error.message };
            }
        }

        // ── 3. Load EXTRAS last (if exists) ──
        if (pageExtrasPath) {
            log('✨', `Loading page extras: ${pageExtrasPath}`);
            try {
                await loadScript({
                    path: pageExtrasPath,
                    name: 'Page Extras'
                }, CONFIG.pageScriptTimeout);
                results.extras = { loaded: true, path: pageExtrasPath };
            } catch (error) {
                log('❌', `Page extras failed: ${pageExtrasPath}`);
                results.extras = { loaded: false, error: error.message };
            }
        }

        return results;
    }

    // ═══════════════════════════════════════════════
    // 🚀 MAIN INIT - 4-PHASE LOADING (Theme + Critical + Foundation + Optional)
    // ═══════════════════════════════════════════════
    async function init() {
        const startTime = performance.now();
        log('🚀', `Starting BuonoLoader v${CONFIG.version}`);

        // ───────────────────────────────────────
        // 🎨 PHASE 0: Theme Master CSS (NEW v2.4)
        // CRITICAL: Load FIRST to prevent FOUC
        // ───────────────────────────────────────
        const themeStart = performance.now();
        const themeResults = await loadThemeMaster();
        const themeTime = (performance.now() - themeStart).toFixed(1);
        log('🎨', `Phase 0 (theme): ${themeTime}ms`);

        // ───────────────────────────────────────
        // 🎨 PARALLEL: Start page CSS loading
        // (Runs in background, doesn't block JS)
        // ───────────────────────────────────────
        const cssPromise = loadPageCss();

        // ───────────────────────────────────────
        // PHASE 1: Critical (BLOCKS everything)
        // ───────────────────────────────────────
        const criticalStart = performance.now();
        const criticalResults = await loadCritical();
        const criticalTime = (performance.now() - criticalStart).toFixed(1);
        log('🔥', `Phase 1 (critical): ${criticalTime}ms`);

        // ───────────────────────────────────────
        // PHASE 2: Foundation (Sequential)
        // ───────────────────────────────────────
        const foundationStart = performance.now();
        const foundationResults = await loadFoundation();
        const foundationTime = (performance.now() - foundationStart).toFixed(1);
        log('🏗️', `Phase 2 (foundation): ${foundationTime}ms`);

        // ───────────────────────────────────────
        // PHASE 3: Optional + Page Scripts (Parallel)
        // ───────────────────────────────────────
        const phase3Start = performance.now();
        
        const [optionalResults, pageScriptResults, cssResults] = await Promise.all([
            loadOptional(),
            loadPageScripts(),
            cssPromise
        ]);
        
        const phase3Time = (performance.now() - phase3Start).toFixed(1);
        log('⚡', `Phase 3 (optional + page + css): ${phase3Time}ms`);

        // ───────────────────────────────────────
        // Summary
        // ───────────────────────────────────────
        const totalTime = (performance.now() - startTime).toFixed(1);
        const totalLoaded = criticalResults.loaded.length + 
                           foundationResults.loaded.length + 
                           optionalResults.loaded.length;
        const totalFailed = criticalResults.failed.length + 
                           foundationResults.failed.length + 
                           optionalResults.failed.length;

        log('🎉', `Complete in ${totalTime}ms`);
        log('📊', `Critical: ${criticalResults.loaded.length}/${CRITICAL_MODULES.length} | Foundation: ${foundationResults.loaded.length}/${FOUNDATION_MODULES.length} | Optional: ${optionalResults.loaded.length}/${OPTIONAL_MODULES.length}`);
        
        // 🆕 v2.4: Theme status
        if (themeResults.loaded) {
            log('🎨', `Theme master: ✅ (${themeResults.source || 'auto'})`);
        } else if (themeResults.skipped) {
            log('🎨', `Theme master: ⏭️ skipped`);
        } else {
            log('🎨', `Theme master: ❌ failed`);
        }
        
        if (cssResults.loaded.length > 0) {
            log('🎨', `Page CSS: ${cssResults.loaded.length} loaded`);
        }
        
        if (pageScriptResults.data?.loaded) {
            log('📊', `Page data loaded: ${pageScriptResults.data.path}`);
        }
        if (pageScriptResults.script?.loaded) {
            log('📄', `Page script loaded: ${pageScriptResults.script.path}`);
        }
        if (pageScriptResults.extras?.loaded) {
            log('✨', `Page extras loaded: ${pageScriptResults.extras.path}`);
        }

        if (totalFailed > 0) {
            const allFailed = [
                ...criticalResults.failed, 
                ...foundationResults.failed, 
                ...optionalResults.failed
            ];
            log('⚠️', `Failed: ${allFailed.join(', ')}`);
        }

        // Set global state
        window.BuonoReady = true;
        window.BuonoLoadResults = {
            theme: themeResults,  // 🆕 v2.4
            critical: criticalResults,
            foundation: foundationResults,
            optional: optionalResults,
            pageCss: cssResults,
            pageScripts: pageScriptResults,
            totalTime: parseFloat(totalTime),
            version: CONFIG.version
        };

        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('buono:ready', { 
            detail: window.BuonoLoadResults 
        }));
        log('📡', `Event "buono:ready" dispatched`);
    }

    // ═══════════════════════════════════════════════
    // 🌐 PUBLIC API
    // ═══════════════════════════════════════════════
    window.BuonoLoader = {
        version: CONFIG.version,
        config: CONFIG,
        criticalModules: CRITICAL_MODULES,
        foundationModules: FOUNDATION_MODULES,
        optionalModules: OPTIONAL_MODULES,

        isReady() {
            return window.BuonoReady === true;
        },

        whenReady() {
            return new Promise((resolve) => {
                if (this.isReady()) {
                    resolve(window.BuonoLoadResults);
                } else {
                    document.addEventListener('buono:ready', (e) => resolve(e.detail), { once: true });
                }
            });
        },

        addOptionalModule(path, name, globalCheck) {
            const newModule = { path, name, globalCheck };
            OPTIONAL_MODULES.push(newModule);
            return loadScript(newModule, CONFIG.optionalTimeout);
        },

        // 🆕 v2.3: Manual CSS load
        loadCss(cssPath) {
            return loadStylesheet(cssPath, CONFIG.pageCssTimeout, false);
        },

        // 🆕 v2.4: Manual theme load (if needed)
        loadTheme(themePath) {
            const path = themePath || CONFIG.themeMasterPath;
            return loadStylesheet(path, CONFIG.themeCssTimeout, true);
        },

        // 🆕 v2.4: Switch theme dynamically (future use)
        switchTheme(themePath) {
            // Remove existing theme
            const existing = document.querySelector('link[data-buono-css="theme-master"]');
            if (existing) existing.remove();
            
            // Load new theme
            return loadStylesheet(themePath, CONFIG.themeCssTimeout, true);
        },

        getLoadedScripts() {
            return Array.from(document.querySelectorAll('script[data-buono-module]'))
                .map(s => ({
                    name: s.dataset.buonoModule,
                    src: s.src
                }));
        },

        // 🆕 v2.3: Get loaded CSS files
        getLoadedCss() {
            return Array.from(document.querySelectorAll('link[data-buono-css]'))
                .map(l => ({
                    type: l.dataset.buonoCss,
                    href: l.href
                }));
        }
    };

    // ═══════════════════════════════════════════════
    // 🎬 AUTO-START
    // ═══════════════════════════════════════════════
    init().catch(error => {
        log('💥', 'Init failed:', error);
    });

})();

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF BUONO-LOADER.JS v2.4                                  */
/* ═══════════════════════════════════════════════════════════════ */