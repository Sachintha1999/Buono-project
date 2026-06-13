// ═══════════════════════════════════════════
// ⚡ BUONO PERFORMANCE TRACKER
// File: performance-tracker.js
// Version: 1.0
// Universal tracker for all pages!
// ═══════════════════════════════════════════

const PerfTracker = (function() {

    let operations = [];
    let pageStartTime = 0;
    let isInitialized = false;

    // ═══════════════════════════════════════════
    // 🚀 INIT
    // ═══════════════════════════════════════════
    function init(pageName) {
        pageStartTime = performance.now();
        operations = [];
        isInitialized = true;

        operations.push({
            name: '🚀 ' + (pageName || 'Page') + ' Start',
            startTime: 0,
            duration: 0,
            status: 'info'
        });

        console.log(`%c⚡ PerfTracker started for: ${pageName}`,
            'color:#f0a500;font-weight:bold;');
    }

    // ═══════════════════════════════════════════
    // ⏱️ START OPERATION
    // ═══════════════════════════════════════════
    function start(operationName) {
        if (!isInitialized) {
            console.warn('⚠️ PerfTracker not initialized!');
            return null;
        }

        const op = {
            name: operationName,
            startTime: performance.now() - pageStartTime,
            duration: null,
            status: 'pending',
            startMark: performance.now()
        };

        operations.push(op);
        return op;
    }

    // ═══════════════════════════════════════════
    // ✅ END OPERATION
    // ═══════════════════════════════════════════
    function end(operationName) {
        if (!isInitialized) return;

        const op = operations.find(
            o => o.name === operationName && o.status === 'pending'
        );

        if (!op) {
            console.warn(`⚠️ Operation not found: ${operationName}`);
            return;
        }

        op.duration = performance.now() - op.startMark;
        op.status = getStatus(op.duration);
        delete op.startMark;
    }

    // ═══════════════════════════════════════════
    // 📊 GET STATUS BASED ON DURATION
    // ═══════════════════════════════════════════
    function getStatus(duration) {
        if (duration < 100) return 'instant';
        if (duration < 500) return 'fast';
        if (duration < 1500) return 'good';
        return 'slow';
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'instant': return '⚡⚡';
            case 'fast':    return '⚡';
            case 'good':    return '✅';
            case 'slow':    return '⚠️';
            case 'info':    return 'ℹ️';
            default:        return '•';
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'instant': return '#00e676';
            case 'fast':    return '#4CAF50';
            case 'good':    return '#FFC107';
            case 'slow':    return '#ff4444';
            case 'info':    return '#2196F3';
            default:        return '#888';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'instant': return 'Instant';
            case 'fast':    return 'Fast';
            case 'good':    return 'Good';
            case 'slow':    return 'Slow';
            case 'info':    return 'Info';
            default:        return '-';
        }
    }

    // ═══════════════════════════════════════════
    // 📋 GENERATE REPORT (Console Table)
    // ═══════════════════════════════════════════
    function report(label) {
        if (!isInitialized) return;

        const totalTime = performance.now() - pageStartTime;

        console.log(
            `%c\n⏱️ ━━━ PERFORMANCE REPORT ━━━ ⏱️\n${label || ''}`,
            'color:#f0a500;font-weight:bold;font-size:13px;'
        );

        // Build table data
        const tableData = operations
            .filter(op => op.duration !== null && op.duration !== 0)
            .map(op => ({
                Operation: op.name,
                Time: op.duration
                    ? `${op.duration.toFixed(0)}ms`
                    : '-',
                Status: `${getStatusIcon(op.status)} ${getStatusText(op.status)}`
            }));

        // Add total
        tableData.push({
            Operation: '🏆 TOTAL',
            Time: `${totalTime.toFixed(0)}ms`,
            Status: `${getStatusIcon(getStatus(totalTime))} ${getStatusText(getStatus(totalTime))}`
        });

        console.table(tableData);

        // Insights
        console.log(
            '%c📊 Insights:',
            'color:#2196F3;font-weight:bold;'
        );

        const totalStatus = getStatus(totalTime);
        const totalIcon = getStatusIcon(totalStatus);
        const totalText = getStatusText(totalStatus);

        console.log(
            `%c${totalIcon} Total Load Time: ${totalTime.toFixed(0)}ms (${totalText})`,
            `color:${getStatusColor(totalStatus)};font-weight:bold;`
        );

        // Find slowest
        const slowest = operations
            .filter(op => op.duration !== null)
            .sort((a, b) => b.duration - a.duration)[0];

        if (slowest) {
            console.log(
                `%c🐌 Slowest: ${slowest.name} (${slowest.duration.toFixed(0)}ms)`,
                'color:#FFC107;'
            );
        }

        // Update visual badge
        updateBadge(totalTime, operations);

        return { totalTime, operations: [...operations] };
    }

    // ═══════════════════════════════════════════
    // 🎨 VISUAL BADGE (Bottom-right corner)
    // ═══════════════════════════════════════════
    function updateBadge(totalTime, ops) {

        // Remove existing badge
        const existing = document.getElementById('perfBadge');
        if (existing) existing.remove();

        const status = getStatus(totalTime);
        const color = getStatusColor(status);
        const icon = getStatusIcon(status);

        // Create badge
        const badge = document.createElement('div');
        badge.id = 'perfBadge';
        badge.style.cssText = `
            position: fixed;
            bottom: 16px;
            left: 16px;
            background: rgba(22, 33, 62, 0.95);
            border: 1px solid ${color};
            border-radius: 10px;
            padding: 8px 14px;
            color: ${color};
            font-family: 'Segoe UI', sans-serif;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            backdrop-filter: blur(8px);
            transition: all 0.2s ease;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0;
            animation: perfBadgeIn 0.4s ease forwards;
        `;

        badge.innerHTML = `
            <span style="font-size:14px;">${icon}</span>
            <span>${totalTime.toFixed(0)}ms</span>
            <span style="
                background: ${color};
                color: #16213e;
                padding: 1px 6px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                margin-left: 4px;
            ">${getStatusText(status).toUpperCase()}</span>
        `;

        // Hover effect
        badge.onmouseenter = () => {
            badge.style.transform = 'translateY(-2px) scale(1.05)';
            badge.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
        };
        badge.onmouseleave = () => {
            badge.style.transform = 'translateY(0) scale(1)';
            badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        };

        // Click → show details modal
        badge.onclick = () => showDetailsModal(totalTime, ops);

        // Add animation keyframes
        if (!document.getElementById('perfBadgeStyles')) {
            const style = document.createElement('style');
            style.id = 'perfBadgeStyles';
            style.textContent = `
                @keyframes perfBadgeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes perfModalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .perf-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.75);
                    z-index: 99998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    animation: perfBadgeIn 0.2s ease;
                }

                .perf-modal {
                    background: #16213e;
                    border: 1px solid #0f3460;
                    border-radius: 14px;
                    max-width: 500px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: perfModalIn 0.3s ease;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                }

                .perf-modal-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid #0f3460;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .perf-modal-title {
                    color: #f0a500;
                    font-weight: 700;
                    font-size: 16px;
                }

                .perf-modal-close {
                    background: transparent;
                    border: none;
                    color: #888;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                }

                .perf-modal-close:hover {
                    color: #ff4444;
                }

                .perf-modal-body {
                    padding: 20px;
                }

                .perf-summary {
                    background: #0f3460;
                    border-radius: 10px;
                    padding: 16px;
                    margin-bottom: 16px;
                    text-align: center;
                }

                .perf-summary-time {
                    font-size: 28px;
                    font-weight: 800;
                    margin-bottom: 4px;
                }

                .perf-summary-label {
                    color: #aaa;
                    font-size: 12px;
                    text-transform: uppercase;
                }

                .perf-op-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .perf-op-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: #0f3460;
                    border-radius: 8px;
                    border-left: 3px solid;
                }

                .perf-op-name {
                    color: #ccc;
                    font-size: 13px;
                    flex: 1;
                }

                .perf-op-time {
                    font-weight: 700;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }

                .perf-tip {
                    margin-top: 16px;
                    padding: 12px;
                    background: rgba(33, 150, 243, 0.1);
                    border: 1px solid rgba(33, 150, 243, 0.3);
                    border-radius: 8px;
                    color: #90caf9;
                    font-size: 12px;
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(badge);
    }

    // ═══════════════════════════════════════════
    // 📋 DETAILS MODAL (On badge click)
    // ═══════════════════════════════════════════
    function showDetailsModal(totalTime, ops) {

        // Remove existing modal
        const existing = document.querySelector('.perf-modal-overlay');
        if (existing) existing.remove();

        const status = getStatus(totalTime);
        const color = getStatusColor(status);
        const icon = getStatusIcon(status);

        const overlay = document.createElement('div');
        overlay.className = 'perf-modal-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        const opsHtml = ops
            .filter(op => op.duration !== null && op.duration !== 0)
            .map(op => {
                const opColor = getStatusColor(op.status);
                const opIcon = getStatusIcon(op.status);
                return `
                    <div class="perf-op-item" style="border-left-color: ${opColor};">
                        <span class="perf-op-name">
                            ${opIcon} ${op.name}
                        </span>
                        <span class="perf-op-time" style="color: ${opColor};">
                            ${op.duration.toFixed(0)}ms
                        </span>
                    </div>
                `;
            }).join('');

        overlay.innerHTML = `
            <div class="perf-modal">
                <div class="perf-modal-header">
                    <div class="perf-modal-title">📊 Performance Report</div>
                    <button class="perf-modal-close"
                            onclick="this.closest('.perf-modal-overlay').remove()">
                        ✕
                    </button>
                </div>
                <div class="perf-modal-body">
                    <div class="perf-summary" style="border: 2px solid ${color};">
                        <div class="perf-summary-time" style="color: ${color};">
                            ${icon} ${totalTime.toFixed(0)}ms
                        </div>
                        <div class="perf-summary-label">
                            Total Load Time - ${getStatusText(status)}
                        </div>
                    </div>

                    <div class="perf-op-list">
                        ${opsHtml}
                    </div>

                    <div class="perf-tip">
                        💡 ⚡ Instant: &lt;100ms | ⚡ Fast: &lt;500ms | ✅ Good: &lt;1.5s | ⚠️ Slow: &gt;1.5s
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    // ═══════════════════════════════════════════
    // 🔄 RESET
    // ═══════════════════════════════════════════
    function reset() {
        operations = [];
        pageStartTime = performance.now();
    }

    // ═══════════════════════════════════════════
    // 📤 PUBLIC API
    // ═══════════════════════════════════════════
    return {
        init,
        start,
        end,
        report,
        reset
    };

})();

console.log('⚡ Performance Tracker loaded!');