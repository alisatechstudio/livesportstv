/**
 * LiveSportsTV - Mobile Navigation Controller
 * Handles mobile drawer toggle and outside click closing.
 */
(function () {
  'use strict';

  function setupMobileMenu() {
    const toggles = document.querySelectorAll('#menuToggle, #menuToggleMobile');
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isHidden = mobileMenu.classList.toggle('hidden');
        btn.setAttribute('aria-expanded', !isHidden);
        btn.innerHTML = isHidden
          ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>'
          : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target)) {
        let clickedToggle = false;
        toggles.forEach(function (t) {
          if (t.contains(e.target)) clickedToggle = true;
        });
        if (!clickedToggle) {
          mobileMenu.classList.add('hidden');
          toggles.forEach(function (t) {
            t.setAttribute('aria-expanded', 'false');
            t.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';
          });
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileMenu);
  } else {
    setupMobileMenu();
  }
})();
