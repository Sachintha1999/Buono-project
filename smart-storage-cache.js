// ═══════════════════════════════════════════
// 💾 BUONO SMART STORAGE CACHE
// File: smart-storage-cache.js
// Version: 1.0
// Universal localStorage + sessionStorage helper
// ═══════════════════════════════════════════

const SmartStorage = (function() {

    const CACHE_VERSION = 'v1';
    const PREFIX = 'buono_cache_';

    // Cache durations (milliseconds)
    const DURATIONS = {
        SHORT:  1 * 60 * 1000,        // 1 minute
        MEDIUM: 5 * 60 * 1000,        // 5 minutes
        LONG:   30 * 60 * 1000,       // 30 minutes
        HOUR:   60 * 60 * 1000,       // 1 hour
        DAY:    24 * 60 * 60 * 1000   // 24 hours
    };

    // Stats tracking
    let stats = {
        hits: 0,
        misses: 0,
        saves: 0,
        errors: 0
    };

    // ═══════════════════════════════════════════
    // 💾 SAVE TO LOCALSTORAGE (persistent)
    // ═══════════════════════════════════════════
    function set(key, data, durationMs = DURATIONS.MEDIUM) {
        try {
            const item = {
                version: CACHE_VERSION,
                data: data,
                timestamp: Date.now(),
                expiresAt: Date.now() + durationMs,
                duration: durationMs
            };

            const serialized = JSON.stringify(item);
            localStorage.setItem(PREFIX + key, serialized);

            stats.saves++;
            console.log(`💾 Cache saved: ${key} (${(serialized.length / 1024).toFixed(1)}KB)`);
            return true;

        } catch (error) {
            stats.errors++;
            console.warn(`⚠️ Cache save failed: ${key}`, error);

            // If quota exceeded, clear old cache
            if (error.name === 'QuotaExceededError') {
                clearExpired();
            }
            return false;
        }
    }

    // ═══════════════════════════════════════════
    // 📤 GET FROM LOCALSTORAGE
    // ═══════════════════════════════════════════
    function get(key) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (!raw) {
                stats.misses++;
                return null;
            }

            const item = JSON.parse(raw);

            // Version check
            if (item.version !== CACHE_VERSION) {
                console.log(`🔄 Cache version mismatch: ${key}`);
                remove(key);
                stats.misses++;
                return null;
            }

            // Expiry check
            if (Date.now() > item.expiresAt) {
                console.log(`⏰ Cache expired: ${key}`);
                remove(key);
                stats.misses++;
                return null;
            }

            stats.hits++;
            const ageMs = Date.now() - item.timestamp;
            console.log(`⚡ Cache HIT: ${key} (age: ${(ageMs / 1000).toFixed(0)}s)`);
            return item.data;

        } catch (error) {
            stats.errors++;
            console.warn(`⚠️ Cache read failed: ${key}`, error);
            return null;
        }
    }

    // ═══════════════════════════════════════════
    // 🔄 GET WITH AUTO-REFRESH (smart pattern!)
    // ═══════════════════════════════════════════
    async function getOrFetch(key, fetchFn, durationMs = DURATIONS.MEDIUM) {
        // Try cache first
        const cached = get(key);
        if (cached !== null) {
            // Background refresh if older than 50% of duration
            const raw = localStorage.getItem(PREFIX + key);
            if (raw) {
                const item = JSON.parse(raw);
                const age = Date.now() - item.timestamp;
                const halfLife = durationMs / 2;

                if (age > halfLife) {
                    console.log(`🔄 Background refresh: ${key}`);
                    // Refresh in background (don't await!)
                    fetchFn().then(freshData => {
                        if (freshData !== null && freshData !== undefined) {
                            set(key, freshData, durationMs);
                        }
                    }).catch(err => {
                        console.warn(`⚠️ Background refresh failed: ${key}`, err);
                    });
                }
            }

            return cached;
        }

        // Cache miss - fetch fresh
        console.log(`🔍 Cache MISS: ${key} - fetching...`);
        try {
            const freshData = await fetchFn();
            if (freshData !== null && freshData !== undefined) {
                set(key, freshData, durationMs);
            }
            return freshData;
        } catch (error) {
            console.error(`❌ Fetch failed: ${key}`, error);
            throw error;
        }
    }

    // ═══════════════════════════════════════════
    // 🗑️ REMOVE
    // ═══════════════════════════════════════════
    function remove(key) {
        try {
            localStorage.removeItem(PREFIX + key);
            return true;
        } catch (error) {
            return false;
        }
    }

    // ═══════════════════════════════════════════
    // 🧹 CLEAR EXPIRED
    // ═══════════════════════════════════════════
    function clearExpired() {
        let cleared = 0;
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (!key.startsWith(PREFIX)) return;

                const raw = localStorage.getItem(key);
                if (!raw) return;

                try {
                    const item = JSON.parse(raw);
                    if (Date.now() > item.expiresAt) {
                        localStorage.removeItem(key);
                        cleared++;
                    }
                } catch (e) {
                    // Corrupt entry, remove it
                    localStorage.removeItem(key);
                    cleared++;
                }
            });

            if (cleared > 0) {
                console.log(`🧹 Cleared ${cleared} expired cache entries`);
            }
        } catch (error) {
            console.warn('⚠️ Clear expired failed:', error);
        }

        return cleared;
    }

    // ═══════════════════════════════════════════
    // 🗑️ CLEAR ALL CACHE
    // ═══════════════════════════════════════════
    function clearAll() {
        let cleared = 0;
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(PREFIX)) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            });
            console.log(`🗑️ Cleared all ${cleared} cache entries`);
        } catch (error) {
            console.warn('⚠️ Clear all failed:', error);
        }
        return cleared;
    }

    // ═══════════════════════════════════════════
    // 📊 GET STATS
    // ═══════════════════════════════════════════
    function getStats() {
        const totalCalls = stats.hits + stats.misses;
        const hitRate = totalCalls > 0
            ? ((stats.hits / totalCalls) * 100).toFixed(1)
            : 0;

        return {
            ...stats,
            totalCalls,
            hitRate: `${hitRate}%`,
            cacheSize: getCacheSize()
        };
    }

    // ═══════════════════════════════════════════
    // 📏 CACHE SIZE
    // ═══════════════════════════════════════════
    function getCacheSize() {
        let totalBytes = 0;
        let count = 0;
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(PREFIX)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        totalBytes += value.length + key.length;
                        count++;
                    }
                }
            });
        } catch (error) {
            console.warn('Size calc failed:', error);
        }

        return {
            entries: count,
            bytes: totalBytes,
            kb: (totalBytes / 1024).toFixed(1),
            mb: (totalBytes / 1024 / 1024).toFixed(2)
        };
    }

    // ═══════════════════════════════════════════
    // 📋 LIST ALL KEYS
    // ═══════════════════════════════════════════
    function listKeys() {
        const keys = [];
        try {
            Object.keys(localStorage).forEach(key => {
                if (!key.startsWith(PREFIX)) return;

                const raw = localStorage.getItem(key);
                if (!raw) return;

                try {
                    const item = JSON.parse(raw);
                    const age = Date.now() - item.timestamp;
                    const remaining = item.expiresAt - Date.now();
                    const status = remaining > 0 ? '✅' : '⏰';

                    keys.push({
                        key: key.replace(PREFIX, ''),
                        ageSeconds: Math.floor(age / 1000),
                        remainingSeconds: Math.floor(remaining / 1000),
                        status: status,
                        size: ((raw.length + key.length) / 1024).toFixed(1) + 'KB'
                    });
                } catch (e) {
                    // Skip corrupt
                }
            });
        } catch (error) {
            console.warn('List failed:', error);
        }

        if (keys.length > 0) {
            console.table(keys);
        } else {
            console.log('📭 No cache entries');
        }

        return keys;
    }

    // ═══════════════════════════════════════════
    // 🚀 INIT - Clear expired on load
    // ═══════════════════════════════════════════
    function init() {
        clearExpired();
        const stats = getStats();
        const size = getCacheSize();
        console.log(`💾 SmartStorage initialized | Entries: ${size.entries} | Size: ${size.kb}KB`);
    }

    // Auto-init
    init();

    // ═══════════════════════════════════════════
    // 📤 PUBLIC API
    // ═══════════════════════════════════════════
    return {
        set,
        get,
        getOrFetch,
        remove,
        clearExpired,
        clearAll,
        getStats,
        listKeys,
        DURATIONS
    };

})();

console.log('💾 Smart Storage Cache loaded!');
console.log('💡 Try: SmartStorage.listKeys() or SmartStorage.getStats()');