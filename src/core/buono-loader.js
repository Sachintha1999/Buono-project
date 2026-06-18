/* ═══════════════════════════════════════════════════════════════ */
/* 🚀 BUONO PROJECT - SMART CENTRAL JS LOADER                      */
/* File: src/core/buono-loader.js                                  */
/* Version: 3.0 - Component System Integration                     */
/* Date: 2026-06-17                                                */
/*                                                                 */
/* 🎯 USAGE in HTML:                                               */
/*                                                                 */
/*   <script                                                       */
/*       src="src/core/buono-loader.js"                            */
/*       data-page="employees"                                     */
/*       data-page-config="pages/hr/employees/employees-config.js" */
/*       data-page-script="pages/hr/employees/employees-script.js" */
/*   </script>                                                     */
/*                                                                 */
/* 🆕 v3.0 CHANGES:                                                */
/*   - 🧩 buono-component-loader.js auto-loaded (Foundation)      */
/*   - 🏗️ buono-page-builder.js auto-loaded (Foundation)          */
/*   - ⚙️ data-page-config support (loads BEFORE script)          */
/*   - 🎨 buono-page-system.css in core chain                      */
/*   - 📍 Better nested path handling                              */
/*   - ⚡ Auto PerfTracker.init(pageName) on every page           */
/*                                                                 */
/* 🆕 v2.5 (Kept):                                                 */
/*   - buono-core.css auto-loaded                                  */
/*   - sidebar.js in Foundation                                    */
/*                                                                 */
/* 🆕 v2.4 (Kept):                                                 */
/*   - Theme master CSS auto-loaded                                */
/*   - FOUC-safe                                                   */
/* ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════
    // ⚙️ CONFIGURATION
    // ═══════════════════════════════════════════════
    const CONFIG = {
        debug: true,
        version: '3.0',
        criticalTimeout: 10000,
        foundationTimeout: 5000,
        optionalTimeout: 5000,
        pageScriptTimeout: 10000,
        pageCssTimeout: 5000,
        coreCssTimeout: 5000,
        pageConfigTimeout: 5000,
        
        // Core CSS path (loads EVERYTHING - theme + layout + components + page-system)
        coreCssPath: 'src/core/buono-core.css'
    };

    // ═══════════════════════════════════════════════
    // 📍 BASE PATH DETECTION
    // Auto-detect base path for nested pages
    // ═══════════════════════════════════════════════
    function detectBasePath() {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p && !p.includes('.'));
        const depth = pathParts.length;
        
        if (depth === 0) return '';
        return '../'.repeat(depth);
    }
    
    const BASE_PATH = detectBasePath();
    
    function resolvePath(relativePath) {
        if (!relativePath) return relativePath;
        // Skip if absolute URL or already prefixed
        if (relativePath.startsWith('http') || 
            relativePath.startsWith('/') || 
            relativePath.startsWith('../')) {
            return relativePath;
        }
        return BASE_PATH + relativePath;
    }

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
        },
        { 
            path: 'src/layout/sidebar.js',
            name: 'Sidebar Controller',
            globalCheck: () => typeof window.toggleSidebar !== 'undefined'
        },
        // 🆕 v3.0: Component Loader (auto-load on EVERY page!)
        { 
            path: 'src/core/buono-component-loader.js',
            name: 'Component Loader',
            globalCheck: () => typeof window.BuonoComponents !== 'undefined'
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
        },
        // 🆕 v3.0: Page Builder (auto-load!)
        { 
            path: 'src/core/buono-page-builder.js',
            name: 'Page Builder',
            globalCheck: () => typeof window.BuonoPageBuilder !== 'undefined'
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
            const src = resolvePath(module.path);

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
    function loadStylesheet(cssPath, timeout, type = 'page') {
        return new Promise((resolve, reject) => {
            const resolvedPath = resolvePath(cssPath);
            
            const existing = document.querySelector(`link[href="${resolvedPath}"]`);
            if (existing) {
                log('⏭️', `CSS skipped (already loaded): ${cssPath}`);
                resolve(cssPath);
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = resolvedPath;
            link.dataset.buonoCss = type;

            const timeoutId = setTimeout(() => {
                log('⏰', `CSS Timeout: ${cssPath}`);
                resolve(cssPath); // Don't reject - CSS failures shouldn't block
            }, timeout);

            link.onload = () => {
                clearTimeout(timeoutId);
                const icon = type === 'core' ? '☕' : '🎨';
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
    // ☕ LOAD CORE CSS (v2.5+ - CRITICAL!)
    // FOUC-safe: Loaded SYNCHRONOUSLY before page renders
    // Includes: theme + layout + components + mobile + page-system
    // ═══════════════════════════════════════════════
    async function loadCoreCSS() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[src*="buono-loader.js"]');
        
        if (currentScript && currentScript.dataset.skipCore === 'true') {
            log('⏭️', 'Core CSS skipped (data-skip-core="true")');
            return { skipped: true };
        }

        const existingCore = document.querySelector(
            `link[href*="buono-core.css"], link[data-buono-css="core"]`
        );
        
        if (existingCore) {
            log('⏭️', 'Core CSS already in <head>');
            return { loaded: true, source: 'manual' };
        }

        log('☕', `Loading core CSS: ${CONFIG.coreCssPath}`);
        
        try {
            await loadStylesheet(CONFIG.coreCssPath, CONFIG.coreCssTimeout, 'core');
            return { loaded: true, source: 'auto' };
        } catch (error) {
            log('⚠️', 'Core CSS failed to load (page will use fallbacks)');
            return { loaded: false, error: error.message };
        }
    }

    // ═══════════════════════════════════════════════
    // 🎨 LOAD PAGE CSS (Parallel)
    // ═══════════════════════════════════════════════
    async function loadPageCss() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[data-page-script], script[data-page-css]');
        
        if (!currentScript) return { loaded: [], failed: [] };

        const pageCssAttr = currentScript.dataset.pageCss;
        if (!pageCssAttr) return { loaded: [], failed: [] };

        const cssFiles = pageCssAttr.split(',').map(f => f.trim()).filter(f => f.length > 0);
        if (cssFiles.length === 0) return { loaded: [], failed: [] };

        log('🎨', `Loading ${cssFiles.length} page CSS file(s) in parallel...`);

        const promises = cssFiles.map(cssPath => 
            loadStylesheet(cssPath, CONFIG.pageCssTimeout, 'page')
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
        if (FOUNDATION_MODULES.length === 0) return { loaded: [], failed: [] };

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
        if (OPTIONAL_MODULES.length === 0) return { loaded: [], failed: [] };

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
    // ⚙️ LOAD PAGE CONFIG (NEW v3.0!)
    // Loads BEFORE page script (so config is ready)
    // ═══════════════════════════════════════════════
    async function loadPageConfig() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[data-page-config]');
        
        if (!currentScript) return { loaded: false };
        
        const configPath = currentScript.dataset.pageConfig;
        if (!configPath) return { loaded: false };
        
        log('⚙️', `Loading page config: ${configPath}`);
        
        try {
            await loadScript({
                path: configPath,
                name: 'Page Config'
            }, CONFIG.pageConfigTimeout);
            
            return { loaded: true, path: configPath };
        } catch (error) {
            log('❌', `Page config failed: ${configPath}`);
            return { loaded: false, error: error.message };
        }
    }

    // ═══════════════════════════════════════════════
    // 📄 LOAD PAGE SCRIPTS
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

        // 1. Load DATA file first
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

        // 2. Load MAIN SCRIPT
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

        // 3. Load EXTRAS last
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
    // ⚡ AUTO PERF TRACKER INIT (NEW v3.0!)
    // ═══════════════════════════════════════════════
    function autoInitPerfTracker() {
        const currentScript = document.currentScript || 
                              document.querySelector('script[src*="buono-loader.js"]');
        
        const pageName = currentScript?.dataset?.page || 'Page';
        
        if (window.PerfTracker && typeof window.PerfTracker.init === 'function') {
            try {
                window.PerfTracker.init(pageName);
                log('⚡', `PerfTracker initialized for: ${pageName}`);
            } catch(e) {
                log('⚠️', 'PerfTracker init failed');
            }
        }
    }

    // ═══════════════════════════════════════════════
    // 🚀 MAIN INIT
    // ═══════════════════════════════════════════════
    async function init() {
        const startTime = performance.now();
        log('🚀', `Starting BuonoLoader v${CONFIG.version}`);
        log('📍', `Base path: "${BASE_PATH || '(root)'}"`);

        // ───────────────────────────────────────
        // ☕ PHASE 0: Core CSS (CRITICAL - FOUC prevention)
        // ───────────────────────────────────────
        const coreStart = performance.now();
        const coreResults = await loadCoreCSS();
        const coreTime = (performance.now() - coreStart).toFixed(1);
        log('☕', `Phase 0 (core CSS): ${coreTime}ms`);

        // ───────────────────────────────────────
        // 🎨 PARALLEL: Start page CSS loading
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

        // ⚡ Auto-init PerfTracker AFTER foundation loads
        autoInitPerfTracker();

        // ───────────────────────────────────────
        // PHASE 3: Optional + Page Config (Parallel)
        // ───────────────────────────────────────
        const phase3Start = performance.now();
        
        const [optionalResults, pageConfigResults, cssResults] = await Promise.all([
            loadOptional(),
            loadPageConfig(),
            cssPromise
        ]);
        
        const phase3Time = (performance.now() - phase3Start).toFixed(1);
        log('⚡', `Phase 3 (optional + config + css): ${phase3Time}ms`);

        // ───────────────────────────────────────
        // PHASE 4: Page Scripts (AFTER config loaded!)
        // ───────────────────────────────────────
        const phase4Start = performance.now();
        const pageScriptResults = await loadPageScripts();
        const phase4Time = (performance.now() - phase4Start).toFixed(1);
        log('📄', `Phase 4 (page scripts): ${phase4Time}ms`);

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
        
        if (coreResults.loaded) {
            log('☕', `Core CSS: ✅ (${coreResults.source || 'auto'})`);
        }
        
        if (pageConfigResults.loaded) {
            log('⚙️', `Page config: ✅ ${pageConfigResults.path}`);
        }
        
        if (cssResults.loaded.length > 0) {
            log('🎨', `Page CSS: ${cssResults.loaded.length} loaded`);
        }
        
        if (pageScriptResults.script?.loaded) {
            log('📄', `Page script: ✅ ${pageScriptResults.script.path}`);
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
            core: coreResults,
            critical: criticalResults,
            foundation: foundationResults,
            optional: optionalResults,
            pageCss: cssResults,
            pageConfig: pageConfigResults,
            pageScripts: pageScriptResults,
            totalTime: parseFloat(totalTime),
            version: CONFIG.version,
            basePath: BASE_PATH
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
        basePath: BASE_PATH,
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

        loadCss(cssPath) {
            return loadStylesheet(cssPath, CONFIG.pageCssTimeout, 'page');
        },

        loadCore(corePath) {
            const path = corePath || CONFIG.coreCssPath;
            return loadStylesheet(path, CONFIG.coreCssTimeout, 'core');
        },

        switchCore(corePath) {
            const existing = document.querySelector('link[data-buono-css="core"]');
            if (existing) existing.remove();
            return loadStylesheet(corePath, CONFIG.coreCssTimeout, 'core');
        },

        getLoadedScripts() {
            return Array.from(document.querySelectorAll('script[data-buono-module]'))
                .map(s => ({
                    name: s.dataset.buonoModule,
                    src: s.src
                }));
        },

        getLoadedCss() {
            return Array.from(document.querySelectorAll('link[data-buono-css]'))
                .map(l => ({
                    type: l.dataset.buonoCss,
                    href: l.href
                }));
        },

        // 🆕 v3.0: Resolve path helper
        resolvePath: resolvePath
    };

    // ═══════════════════════════════════════════════
    // 🎬 AUTO-START
    // ═══════════════════════════════════════════════
    init().catch(error => {
        log('💥', 'Init failed:', error);
    });

})();

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF BUONO-LOADER.JS v3.0                                  */
/* ═══════════════════════════════════════════════════════════════ */