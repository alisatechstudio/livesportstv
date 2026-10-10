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

  // Universal GDPR / CCPA / AdSense Cookie Consent Controller
  function setupUniversalCookieConsent() {
    const COOKIE_KEY = 'livesportsCookieConsent';
    const consent = localStorage.getItem(COOKIE_KEY);
    if (consent) return;

    let banner = document.getElementById('cookieBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'cookieBanner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Cookie consent');
      banner.className = 'fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-surface border-t border-edge shadow-2xl transition-transform duration-300 transform translate-y-full';
      banner.innerHTML = `
        <div class="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div class="text-muted leading-relaxed flex-1">
            We and our partners (including Google AdSense) use cookies to customize content, serve relevant advertising, and analyze traffic. Read our
            <a href="/privacy.html" class="text-primary underline font-semibold">Privacy Policy</a> to learn more.
          </div>
          <div class="flex items-center gap-2 flex-none w-full sm:w-auto justify-end">
            <button id="cookieDeclineBtn"
              class="px-3 py-1.5 rounded-lg border border-edge bg-card hover:bg-card-hover text-ink text-xs font-semibold cursor-pointer transition-colors">
              Essential Only
            </button>
            <button id="cookieAcceptBtn"
              class="px-4 py-1.5 rounded-lg bg-primary hover:opacity-90 text-white text-xs font-semibold cursor-pointer transition-opacity">
              Accept All
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);

      const acceptBtn = banner.querySelector('#cookieAcceptBtn');
      const declineBtn = banner.querySelector('#cookieDeclineBtn');

      if (acceptBtn) {
        acceptBtn.addEventListener('click', function () {
          localStorage.setItem(COOKIE_KEY, 'accepted');
          banner.classList.add('translate-y-full');
        });
      }

      if (declineBtn) {
        declineBtn.addEventListener('click', function () {
          localStorage.setItem(COOKIE_KEY, 'essential');
          banner.classList.add('translate-y-full');
        });
      }
    }

    // Smooth reveal on user interaction or delayed idle
    function revealBanner() {
      if (!localStorage.getItem(COOKIE_KEY) && banner) {
        banner.classList.remove('translate-y-full');
      }
    }
    window.addEventListener('scroll', revealBanner, { once: true, passive: true });
    window.addEventListener('touchstart', revealBanner, { once: true, passive: true });
    setTimeout(revealBanner, 8000);
  }

  // Deferred, non-blocking Loader for Analytics (GTM) and Google AdSense
  function setupDeferredThirdParties() {
    let loaded = false;
    function load() {
      if (loaded) return;
      loaded = true;

      // Google Tag Manager
      if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        const gtm = document.createElement('script');
        gtm.async = true;
        gtm.src = 'https://www.googletagmanager.com/gtag/js?id=G-WLXVKQ8N06';
        document.head.appendChild(gtm);
      }

      // Google AdSense
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const ads = document.createElement('script');
        ads.async = true;
        ads.crossOrigin = 'anonymous';
        ads.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2862340185854650';
        document.head.appendChild(ads);
      }
    }

    // Trigger on first user interaction or when idle
    ['scroll', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
      window.addEventListener(evt, load, { once: true, passive: true });
    });

    if ('requestIdleCallback' in window) {
      requestIdleCallback(function () {
        setTimeout(load, 3000);
      }, { timeout: 5000 });
    } else {
      window.addEventListener('load', function () {
        setTimeout(load, 2500);
      });
    }
  }

  function init() {
    setupMobileMenu();
    setupUniversalCookieConsent();
    setupDeferredThirdParties();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

