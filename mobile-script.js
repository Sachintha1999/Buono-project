/* ═══════════════════════════════════════════════════════════ */
/* 📱 BUONO PROJECT - MOBILE UNIVERSAL SCRIPT                  */
/* Click outside to close menus/dropdowns/modals               */
/* Apply to ALL pages                                          */
/* ═══════════════════════════════════════════════════════════ */

(function initMobileUX() {
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMobileUX);
    } else {
        setupMobileUX();
    }
    
    function setupMobileUX() {
        createOverlay();
        setupSidebarOverlay();
        setupDropdownClickOutside();
        setupModalClickOutside();
        setupEscapeKey();
        enhanceSidebarToggle();
    }
    
    /* ─────────────────────────────────────────────── */
    /* Create overlay for sidebar                      */
    /* ─────────────────────────────────────────────── */
    function createOverlay() {
        if (document.getElementById('sidebarOverlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);
    }
    
    /* ─────────────────────────────────────────────── */
    /* Tap overlay → Close sidebar                     */
    /* ─────────────────────────────────────────────── */
    function setupSidebarOverlay() {
        const overlay = document.getElementById('sidebarOverlay');
        if (!overlay) return;
        
        overlay.addEventListener('click', function() {
            closeAllSidebars();
        });
    }
    
    /* ─────────────────────────────────────────────── */
    /* Close all sidebars (works for all pages)        */
    /* ─────────────────────────────────────────────── */
    function closeAllSidebars() {
        const sidebars = [
            'reportsSidebar',
            'kitchenSidebar',
            'inventorySidebar',
            'purchasingSidebar'
        ];
        sidebars.forEach(id => {
            const sb = document.getElementById(id);
            if (sb) sb.classList.remove('open');
        });
        
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.classList.remove('active');
        
        document.body.style.overflow = '';
    }
    
    /* ─────────────────────────────────────────────── */
    /* Click outside dropdown → Close                  */
    /* ─────────────────────────────────────────────── */
    function setupDropdownClickOutside() {
        document.addEventListener('click', function(e) {
            // All possible dropdowns
            const dropdownIds = [
                'rptSwitcherDropdown',
                'purSwitcherDropdown',
                'invSwitcherDropdown',
                'kitSwitcherDropdown',
                'cashSwitcherDropdown'
            ];
            const btnIds = [
                'rptSwitcherBtn',
                'purSwitcherBtn',
                'invSwitcherBtn',
                'kitSwitcherBtn',
                'cashSwitcherBtn'
            ];
            
            dropdownIds.forEach((id, i) => {
                const dropdown = document.getElementById(id);
                const btn = document.getElementById(btnIds[i]);
                if (dropdown && dropdown.classList.contains('show')) {
                    if (!dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
                        dropdown.classList.remove('show');
                    }
                }
            });
        });
    }
    
    /* ─────────────────────────────────────────────── */
    /* Click on modal background → Close               */
    /* ─────────────────────────────────────────────── */
    function setupModalClickOutside() {
        document.addEventListener('click', function(e) {
            // Photo modal
            if (e.target.id === 'photoFullscreenModal') {
                e.target.classList.remove('show');
            }
            // Mark paid modal
            if (e.target.id === 'markPaidModal') {
                e.target.classList.remove('show');
            }
            // Generic modals
            if (e.target.classList && e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    /* ─────────────────────────────────────────────── */
    /* ESC key → Close all open menus/modals          */
    /* ─────────────────────────────────────────────── */
    function setupEscapeKey() {
        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Escape') return;
            
            // Close sidebars
            closeAllSidebars();
            
            // Close all dropdowns
            document.querySelectorAll('.rpt-db-dropdown.show, .pur-db-dropdown.show, .inv-db-dropdown.show, .kit-db-dropdown.show').forEach(d => {
                d.classList.remove('show');
            });
            
            // Close modals
            document.querySelectorAll('.photo-fullscreen-modal.show, .mark-paid-modal.show').forEach(m => {
                m.classList.remove('show');
            });
        });
    }
    
    /* ─────────────────────────────────────────────── */
    /* Enhance toggleSidebar - Auto show/hide overlay  */
    /* ─────────────────────────────────────────────── */
    function enhanceSidebarToggle() {
        const sidebarIds = [
            'reportsSidebar',
            'kitchenSidebar',
            'inventorySidebar',
            'purchasingSidebar'
        ];
        
        // Watch for class changes on sidebars
        sidebarIds.forEach(id => {
            const sb = document.getElementById(id);
            if (!sb) return;
            
            // Use MutationObserver to detect class changes
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class') {
                        const overlay = document.getElementById('sidebarOverlay');
                        if (!overlay) return;
                        
                        if (sb.classList.contains('open')) {
                            overlay.classList.add('active');
                            document.body.style.overflow = 'hidden';
                        } else {
                            overlay.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    }
                });
            });
            
            observer.observe(sb, { attributes: true });
        });
    }
    
})();