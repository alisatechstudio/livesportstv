/**
 * LiveSportsTV - Auto Banner Refresh Controller
 * Automatically reloads banner and native ad slots every 10 seconds
 * for maximum ad impressions and revenue optimization.
 */
(function () {
  'use strict';

  const REFRESH_INTERVAL_MS = 10000; // 10 seconds

  function reloadAdIframe(iframe) {
    if (!iframe) return false;
    try {
      const src = iframe.src || iframe.getAttribute('src');
      if (src && src !== 'about:blank' && !src.startsWith('javascript:')) {
        const url = new URL(src, window.location.href);
        url.searchParams.set('_rb', Date.now().toString());
        iframe.src = url.toString();
        return true;
      } else if (iframe.contentWindow) {
        try {
          iframe.contentWindow.location.reload();
          return true;
        } catch (e) {
          // Cross-origin restriction on contentWindow
        }
      }
    } catch (err) {
      if (iframe.src) {
        const clean = iframe.src.replace(/([?&])_rb=\d+/, '');
        const sep = clean.indexOf('?') === -1 ? '?' : '&';
        iframe.src = clean + sep + '_rb=' + Date.now();
        return true;
      }
    }
    return false;
  }

  function reloadNativeBanner() {
    const container = document.getElementById('container-a3c27f6bb252fff26f976d0a2f4be494');
    if (!container) return;

    const iframes = container.querySelectorAll('iframe');
    if (iframes.length > 0) {
      iframes.forEach(reloadAdIframe);
    } else {
      // Re-execute native invoke script if no iframes exist
      container.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://windowthrilling.com/a3c27f6bb252fff26f976d0a2f4be494/invoke.js?_rb=' + Date.now();
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      container.appendChild(script);
    }
  }

  function refreshAllBanners() {
    // 1. Refresh all banner iframes in standard slots
    const selectors = [
      '.ad-slot-native',
      '.ad-slot-middle',
      '.ad-slot-infeed',
      '.ad-slot-bottom',
      '[class*="ad-slot"]'
    ];
    const containers = document.querySelectorAll(selectors.join(', '));
    containers.forEach(function (container) {
      const iframes = container.querySelectorAll('iframe');
      iframes.forEach(function (iframe) {
        reloadAdIframe(iframe);
      });
    });

    // 2. Refresh native banner container
    reloadNativeBanner();
  }

  // Set recurring auto-refresh every 10 seconds
  setInterval(refreshAllBanners, REFRESH_INTERVAL_MS);

  // Instant refresh when user returns to tab
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      refreshAllBanners();
    }
  });
})();
