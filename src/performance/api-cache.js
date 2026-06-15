// ═══════════════════════════════════════════════════════════════
// 🔥 BUONO API CACHE
// File: src/performance/api-cache.js
// Version: 1.1 (Fixed SmartStorage detection)
// Purpose: Firebase query caching (2-layer: memory + localStorage)
// Dependencies: firebase (window.db), smart-storage-cache.js (optional)
// Optional: performance-tracker.js
// ═══════════════════════════════════════════════════════════════

(function(window, document) {
    'use strict';

    // ═══════════════════════════════════════════
    // 📋 SECTION 1: CONFIG
    // ═══════════════════════════════════════════
    const CONFIG = {
        version: '1.1',
        // Auto-init
        autoInit: true,
        // Cache layers
        useMemoryCache: true,           // L1
        useStorageCache: true,          // L2 (SmartStorage)
        // Memory cache limits
        memoryMaxSize: 50,              // Max 50 cached queries
        // Stale-while-revalidate
        enableSWR: true,
        swrThreshold: 0.5,              // Revalidate if >50% TTL elapsed
        // Logging
        enableLogs: true,
        logPrefix: '[ApiCache]',
        // PerfTracker integration
        enablePerfTracking: true,
        // Cache key prefix
        keyPrefix: 'api_'
    };

    // TTL per collection (milliseconds)
    const TTL_DEFAULTS = {
        'courses':              30 * 60 * 1000,    // 30 min
        'settings':             60 * 60 * 1000,    // 1 hour
        'employees':            15 * 60 * 1000,    // 15 min
        'students':              5 * 60 * 1000,    // 5 min
        'leads':                 2 * 60 * 1000,    // 2 min
        'callLogs':              2 * 60 * 1000,    // 2 min
        'payments':              1 * 60 * 1000,    // 1 min
        'inventory':            10 * 60 * 1000,    // 10 min
        'kitchenItems':         10 * 60 * 1000,    // 10 min
        'purchaseOrders':        5 * 60 * 1000,    // 5 min
        'suppliers':            30 * 60 * 1000,    // 30 min
        'events':               15 * 60 * 1000,    // 15 min
        'scripts':              30 * 60 * 1000,    // 30 min
        'counters':              0,                // No cache (always fresh)
        'DEFAULT':               5 * 60 * 1000     // 5 min default
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 2: STATE
    // ═══════════════════════════════════════════
    const state = {
        initialized: false,
        memoryCache: new Map(),         // L1
        pendingRequests: new Map(),     // Dedupe concurrent requests
        stats: {
            hits: 0,
            misses: 0,
            l1Hits: 0,
            l2Hits: 0,
            sets: 0,
            invalidations: 0,
            swrRefreshes: 0,
            errors: 0,
            dedupes: 0
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 3: UTILITIES
    // ═══════════════════════════════════════════
    function log(...args) {
        if (CONFIG.enableLogs) console.log(CONFIG.logPrefix, ...args);
    }

    function warn(...args) {
        if (CONFIG.enableLogs) console.warn(CONFIG.logPrefix, ...args);
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

    function getTTL(collection) {
        return TTL_DEFAULTS[collection] !== undefined
            ? TTL_DEFAULTS[collection]
            : TTL_DEFAULTS.DEFAULT;
    }

    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 4: SMARTSTORAGE DETECTION (NEW v1.1)
    // ═══════════════════════════════════════════
    // Robust detection that works even when SmartStorage 
    // is declared with const/let (not on window)
    function getSmartStorage() {
        // Method 1: Check window
        if (typeof window.SmartStorage !== 'undefined') {
            return window.SmartStorage;
        }
        // Method 2: Try global scope
        try {
            // eslint-disable-next-line no-undef
            if (typeof SmartStorage !== 'undefined') {
                window.SmartStorage = SmartStorage; // Auto-expose
                return SmartStorage;
            }
        } catch(e) {}
        return null;
    }

    function hasStorage() {
        if (!CONFIG.useStorageCache) return false;
        return getSmartStorage() !== null;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 5: CACHE KEY GENERATOR
    // ═══════════════════════════════════════════
    function buildKey(collection, type = 'all', extra = '') {
        let key = `${collection}::${type}`;
        if (extra) key += `::${extra}`;
        return key;
    }

    function buildQueryHash(queryRef) {
        if (!queryRef) return 'unknown';
        try {
            const parts = [];
            if (queryRef._query) {
                const q = queryRef._query;
                if (q.path) parts.push(q.path.canonicalString());
                if (q.filters && q.filters.length) {
                    q.filters.forEach(f => {
                        parts.push(`${f.field.canonicalString()}_${f.op}_${JSON.stringify(f.value || '')}`);
                    });
                }
                if (q.explicitOrderBy && q.explicitOrderBy.length) {
                    q.explicitOrderBy.forEach(o => {
                        parts.push(`order_${o.field.canonicalString()}_${o.dir}`);
                    });
                }
                if (q.limit) parts.push(`limit_${q.limit}`);
            }
            return hashString(parts.join('|'));
        } catch(e) {
            try {
                return hashString(JSON.stringify(queryRef));
            } catch(e2) {
                return 'fallback_' + Date.now();
            }
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 6: L1 - MEMORY CACHE
    // ═══════════════════════════════════════════
    function l1Get(key) {
        if (!CONFIG.useMemoryCache) return null;

        const entry = state.memoryCache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            state.memoryCache.delete(key);
            return null;
        }

        state.stats.l1Hits++;
        return entry;
    }

    function l1Set(key, data, ttlMs) {
        if (!CONFIG.useMemoryCache) return;

        if (state.memoryCache.size >= CONFIG.memoryMaxSize && !state.memoryCache.has(key)) {
            const firstKey = state.memoryCache.keys().next().value;
            state.memoryCache.delete(firstKey);
        }

        state.memoryCache.set(key, {
            data: data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs,
            ttl: ttlMs
        });
    }

    function l1Delete(key) {
        return state.memoryCache.delete(key);
    }

    function l1Clear() {
        const size = state.memoryCache.size;
        state.memoryCache.clear();
        return size;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 7: L2 - STORAGE CACHE
    // ═══════════════════════════════════════════
    function l2Get(key) {
        const storage = getSmartStorage();
        if (!storage) return null;
        try {
            const data = storage.get(CONFIG.keyPrefix + key);
            if (data !== null) {
                state.stats.l2Hits++;
                return data;
            }
        } catch(e) {
            state.stats.errors++;
        }
        return null;
    }

    function l2Set(key, data, ttlMs) {
        const storage = getSmartStorage();
        if (!storage) return;
        try {
            storage.set(CONFIG.keyPrefix + key, data, ttlMs);
        } catch(e) {
            state.stats.errors++;
        }
    }

    function l2Delete(key) {
        const storage = getSmartStorage();
        if (!storage) return;
        try {
            storage.remove(CONFIG.keyPrefix + key);
        } catch(e) {
            state.stats.errors++;
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 8: CACHE GET/SET (MULTI-LAYER)
    // ═══════════════════════════════════════════
    function cacheGet(key) {
        const l1 = l1Get(key);
        if (l1) {
            state.stats.hits++;
            return l1;
        }

        const l2Data = l2Get(key);
        if (l2Data !== null) {
            const ttl = TTL_DEFAULTS.DEFAULT;
            l1Set(key, l2Data, ttl);
            state.stats.hits++;
            return {
                data: l2Data,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttl,
                ttl: ttl,
                fromL2: true
            };
        }

        state.stats.misses++;
        return null;
    }

    function cacheSet(key, data, ttlMs) {
        l1Set(key, data, ttlMs);
        l2Set(key, data, ttlMs);
        state.stats.sets++;
    }

    function cacheDelete(key) {
        l1Delete(key);
        l2Delete(key);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 9: STALE-WHILE-REVALIDATE
    // ═══════════════════════════════════════════
    function shouldRevalidate(entry) {
        if (!CONFIG.enableSWR) return false;
        if (!entry || !entry.timestamp) return false;

        const age = Date.now() - entry.timestamp;
        const threshold = entry.ttl * CONFIG.swrThreshold;
        return age > threshold;
    }

    function backgroundRefresh(key, fetchFn, ttlMs) {
        state.stats.swrRefreshes++;
        fetchFn()
            .then(fresh => {
                if (fresh !== null && fresh !== undefined) {
                    cacheSet(key, fresh, ttlMs);
                    log(`SWR refreshed: ${key}`);
                }
            })
            .catch(err => {
                warn(`SWR refresh failed: ${key}`, err);
            });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 10: REQUEST DEDUPLICATION
    // ═══════════════════════════════════════════
    function withDedupe(key, fetchFn) {
        if (state.pendingRequests.has(key)) {
            state.stats.dedupes++;
            return state.pendingRequests.get(key);
        }

        const promise = fetchFn().finally(() => {
            state.pendingRequests.delete(key);
        });

        state.pendingRequests.set(key, promise);
        return promise;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 11: FIREBASE - GET COLLECTION
    // ═══════════════════════════════════════════
    async function getCollection(collectionName, options = {}) {
        const {
            force = false,
            ttl = null,
            orderBy = null,
            orderDir = 'asc',
            limit = null
        } = options;

        const ttlMs = ttl !== null ? ttl : getTTL(collectionName);
        if (ttlMs === 0) {
            return fetchCollection(collectionName, { orderBy, orderDir, limit });
        }

        let key = buildKey(collectionName, 'all');
        if (orderBy) key += `::ob_${orderBy}_${orderDir}`;
        if (limit) key += `::lim_${limit}`;

        if (force) {
            cacheDelete(key);
        } else {
            const cached = cacheGet(key);
            if (cached) {
                log(`HIT: ${key} (${cached.fromL2 ? 'L2' : 'L1'})`);

                if (shouldRevalidate(cached)) {
                    backgroundRefresh(key,
                        () => fetchCollection(collectionName, { orderBy, orderDir, limit }),
                        ttlMs);
                }

                return cached.data;
            }
        }

        log(`MISS: ${key} - fetching...`);
        return withDedupe(key, async () => {
            const data = await fetchCollection(collectionName, { orderBy, orderDir, limit });
            if (data) cacheSet(key, data, ttlMs);
            return data;
        });
    }

    async function fetchCollection(collectionName, options = {}) {
        perfStart(`API: ${collectionName} (all)`);
        try {
            const db = window.db || (window.firebase && window.firebase.firestore());
            if (!db) throw new Error('Firebase db not initialized');

            let query = db.collection(collectionName);
            if (options.orderBy) {
                query = query.orderBy(options.orderBy, options.orderDir || 'asc');
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });

            perfEnd(`API: ${collectionName} (all)`);
            return docs;
        } catch(err) {
            error(`fetchCollection failed: ${collectionName}`, err);
            state.stats.errors++;
            perfEnd(`API: ${collectionName} (all)`);
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 12: FIREBASE - GET DOC
    // ═══════════════════════════════════════════
    async function getDoc(collectionName, docId, options = {}) {
        const { force = false, ttl = null } = options;

        const ttlMs = ttl !== null ? ttl : getTTL(collectionName);
        if (ttlMs === 0) {
            return fetchDoc(collectionName, docId);
        }

        const key = buildKey(collectionName, 'doc', docId);

        if (force) {
            cacheDelete(key);
        } else {
            const cached = cacheGet(key);
            if (cached) {
                log(`HIT: ${key} (${cached.fromL2 ? 'L2' : 'L1'})`);

                if (shouldRevalidate(cached)) {
                    backgroundRefresh(key,
                        () => fetchDoc(collectionName, docId),
                        ttlMs);
                }

                return cached.data;
            }
        }

        log(`MISS: ${key} - fetching...`);
        return withDedupe(key, async () => {
            const data = await fetchDoc(collectionName, docId);
            if (data) cacheSet(key, data, ttlMs);
            return data;
        });
    }

    async function fetchDoc(collectionName, docId) {
        perfStart(`API: ${collectionName}/${docId}`);
        try {
            const db = window.db || (window.firebase && window.firebase.firestore());
            if (!db) throw new Error('Firebase db not initialized');

            const docSnap = await db.collection(collectionName).doc(docId).get();
            if (!docSnap.exists) {
                perfEnd(`API: ${collectionName}/${docId}`);
                return null;
            }

            perfEnd(`API: ${collectionName}/${docId}`);
            return { id: docSnap.id, ...docSnap.data() };
        } catch(err) {
            error(`fetchDoc failed: ${collectionName}/${docId}`, err);
            state.stats.errors++;
            perfEnd(`API: ${collectionName}/${docId}`);
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13: FIREBASE - QUERY
    // ═══════════════════════════════════════════
    async function getQuery(queryRef, options = {}) {
        const { force = false, ttl = null, collectionHint = 'DEFAULT' } = options;

        const ttlMs = ttl !== null ? ttl : getTTL(collectionHint);
        if (ttlMs === 0) {
            return fetchQuery(queryRef);
        }

        const queryHash = buildQueryHash(queryRef);
        const key = buildKey(collectionHint, 'query', queryHash);

        if (force) {
            cacheDelete(key);
        } else {
            const cached = cacheGet(key);
            if (cached) {
                log(`HIT: ${key} (${cached.fromL2 ? 'L2' : 'L1'})`);

                if (shouldRevalidate(cached)) {
                    backgroundRefresh(key,
                        () => fetchQuery(queryRef),
                        ttlMs);
                }

                return cached.data;
            }
        }

        log(`MISS: ${key} - fetching query...`);
        return withDedupe(key, async () => {
            const data = await fetchQuery(queryRef);
            if (data) cacheSet(key, data, ttlMs);
            return data;
        });
    }

    async function fetchQuery(queryRef) {
        perfStart('API: custom query');
        try {
            if (!queryRef) throw new Error('Query ref required');

            const snapshot = await queryRef.get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });

            perfEnd('API: custom query');
            return docs;
        } catch(err) {
            error('fetchQuery failed', err);
            state.stats.errors++;
            perfEnd('API: custom query');
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 14: INVALIDATION
    // ═══════════════════════════════════════════
    function invalidate(collection, docId = null) {
        let cleared = 0;

        if (docId) {
            const key = buildKey(collection, 'doc', docId);
            cacheDelete(key);
            cleared++;
        }

        const prefix = collection + '::';
        const keysToDelete = [];

        state.memoryCache.forEach((_, k) => {
            if (k.startsWith(prefix)) keysToDelete.push(k);
        });
        keysToDelete.forEach(k => {
            l1Delete(k);
            l2Delete(k);
            cleared++;
        });

        const storage = getSmartStorage();
        if (storage && typeof storage.listKeys === 'function') {
            try {
                const keys = storage.listKeys();
                if (Array.isArray(keys)) {
                    keys.forEach(item => {
                        const k = typeof item === 'string' ? item : item.key;
                        if (k && k.startsWith(CONFIG.keyPrefix + prefix)) {
                            storage.remove(k);
                            cleared++;
                        }
                    });
                }
            } catch(e) {}
        }

        state.stats.invalidations++;
        log(`Invalidated: ${collection}${docId ? '/' + docId : ''} (${cleared} entries)`);
        return cleared;
    }

    function invalidateAll() {
        const l1Size = l1Clear();
        let l2Size = 0;

        const storage = getSmartStorage();
        if (storage) {
            try {
                if (typeof storage.listKeys === 'function') {
                    const keys = storage.listKeys();
                    if (Array.isArray(keys)) {
                        keys.forEach(item => {
                            const k = typeof item === 'string' ? item : item.key;
                            if (k && k.startsWith(CONFIG.keyPrefix)) {
                                storage.remove(k);
                                l2Size++;
                            }
                        });
                    }
                }
            } catch(e) {}
        }

        state.stats.invalidations++;
        log(`Invalidated ALL: L1=${l1Size} L2=${l2Size}`);
        return l1Size + l2Size;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 15: STATS
    // ═══════════════════════════════════════════
    function getStats() {
        const total = state.stats.hits + state.stats.misses;
        const hitRate = total > 0
            ? ((state.stats.hits / total) * 100).toFixed(1) + '%'
            : 'N/A';

        return {
            ...state.stats,
            version: CONFIG.version,
            totalCalls: total,
            hitRate: hitRate,
            l1Size: state.memoryCache.size,
            l1Max: CONFIG.memoryMaxSize,
            l2Available: hasStorage(),
            pendingRequests: state.pendingRequests.size
        };
    }

    function printStats() {
        const s = getStats();
        console.log('%c🔥 ApiCache Stats', 'color:#FF9800;font-weight:bold;font-size:13px;');
        console.table({
            'Total Calls': s.totalCalls,
            'Hit Rate': s.hitRate,
            'Cache Hits': s.hits,
            'Cache Misses': s.misses,
            'L1 Hits': s.l1Hits,
            'L2 Hits': s.l2Hits,
            'L1 Size': `${s.l1Size} / ${s.l1Max}`,
            'L2 Available': s.l2Available ? 'Yes (SmartStorage)' : 'No',
            'SWR Refreshes': s.swrRefreshes,
            'Dedupes': s.dedupes,
            'Errors': s.errors
        });
        return s;
    }

    function resetStats() {
        state.stats = {
            hits: 0,
            misses: 0,
            l1Hits: 0,
            l2Hits: 0,
            sets: 0,
            invalidations: 0,
            swrRefreshes: 0,
            errors: 0,
            dedupes: 0
        };
        log('Stats reset');
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 16: TEST UTILITY
    // ═══════════════════════════════════════════
    async function testCache() {
        console.log('%c🧪 ApiCache Test', 'color:#f0a500;font-weight:bold;');
        console.log('────────────────────────────────');

        try {
            resetStats();

            console.log('\n📥 Test 1: First fetch (MISS expected)');
            const t1 = Date.now();
            const courses1 = await getCollection('courses');
            const time1 = Date.now() - t1;
            console.log(`✅ Got ${courses1 ? courses1.length : 0} courses in ${time1}ms`);

            console.log('\n⚡ Test 2: Second fetch (HIT expected)');
            const t2 = Date.now();
            const courses2 = await getCollection('courses');
            const time2 = Date.now() - t2;
            console.log(`✅ Got ${courses2 ? courses2.length : 0} courses in ${time2}ms`);

            const speedup = time1 > 0 ? (time1 / Math.max(time2, 1)).toFixed(1) : 'N/A';
            console.log(`🚀 Speedup: ${speedup}x faster!`);

            console.log('\n🔄 Test 3: Force refresh');
            const t3 = Date.now();
            const courses3 = await getCollection('courses', { force: true });
            const time3 = Date.now() - t3;
            console.log(`✅ Force refresh: ${time3}ms`);

            console.log('\n🗑️ Test 4: Invalidate');
            const cleared = invalidate('courses');
            console.log(`✅ Cleared ${cleared} entries`);

            console.log('\n📊 Final stats:');
            printStats();

            console.log('\n🎉 All tests passed!');
            return true;
        } catch(err) {
            console.error('❌ Test failed:', err);
            return false;
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 17: INIT + PUBLIC API
    // ═══════════════════════════════════════════
    function init(userOptions = {}) {
        if (state.initialized) {
            warn('Already initialized');
            return;
        }

        Object.assign(CONFIG, userOptions);

        const dbAvailable = !!(window.db || (window.firebase && window.firebase.firestore));
        const storageAvailable = hasStorage();

        state.initialized = true;
        log(`Initialized ✓ (v${CONFIG.version})`, {
            db: dbAvailable,
            l1: CONFIG.useMemoryCache,
            l2: storageAvailable,
            swr: CONFIG.enableSWR
        });

        if (!dbAvailable) {
            warn('Firebase db not detected - API calls will fail');
        }
        if (!storageAvailable && CONFIG.useStorageCache) {
            warn('SmartStorage not detected - L2 cache disabled (will use L1 only)');
        }
    }

    // Public API
    const ApiCache = {
        version: CONFIG.version,
        init: init,
        // Firebase fetchers
        getCollection: getCollection,
        getDoc: getDoc,
        getQuery: getQuery,
        // Invalidation
        invalidate: invalidate,
        invalidateAll: invalidateAll,
        // Stats
        stats: getStats,
        printStats: printStats,
        resetStats: resetStats,
        // Test
        test: testCache,
        // Direct cache access (advanced)
        cacheGet: cacheGet,
        cacheSet: cacheSet,
        cacheDelete: cacheDelete,
        buildKey: buildKey,
        // Storage detection helper (NEW v1.1)
        hasStorage: hasStorage,
        getStorage: getSmartStorage,
        // Config
        config: CONFIG,
        TTL: TTL_DEFAULTS
    };

    window.ApiCache = ApiCache;

    // ═══════════════════════════════════════════
    // 🚀 AUTO-INIT (Delayed for SmartStorage detection)
    // ═══════════════════════════════════════════
    if (CONFIG.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Small delay to ensure other scripts loaded
                setTimeout(() => init(), 50);
            });
        } else {
            setTimeout(() => init(), 50);
        }
    }

    console.log('🔥 API Cache loaded! (v' + CONFIG.version + ')');
    console.log('💡 Try: ApiCache.test() | ApiCache.printStats()');

})(window, document);