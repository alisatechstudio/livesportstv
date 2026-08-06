<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="google-adsense-account" content="ca-pub-4690647905356010">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo htmlspecialchars(SITE_NAME); ?> — Watch Free Live TV from 175+ Countries</title>
    <meta
      name="description"
      content="Browse thousands of free, publicly available live TV channels from 175+ countries. Watch news, sports, movies and more with no account required."
    />
    <link rel="canonical" href="<?php echo SITE_URL; ?>/" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="<?php echo htmlspecialchars(SITE_NAME); ?> — Watch Free Live TV from 175+ Countries" />
    <meta
      property="og:description"
      content="Browse thousands of free, publicly available live TV channels from 175+ countries. Watch news, sports, movies and more with no account required."
    />
    <meta property="og:url" content="<?php echo SITE_URL; ?>/" />
    <meta property="og:site_name" content="<?php echo htmlspecialchars(SITE_NAME); ?>" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?php echo htmlspecialchars(SITE_NAME); ?> — Watch Free Live TV from 175+ Countries" />
    <meta
      name="twitter:description"
      content="Browse thousands of free, publicly available live TV channels from 175+ countries. Watch news, sports, movies and more with no account required."
    />

    <!-- Structured Data -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "<?php echo htmlspecialchars(SITE_NAME); ?>",
        "url": "<?php echo SITE_URL; ?>/",
        "description": "Watch free live TV channels from 175+ countries.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "<?php echo SITE_URL; ?>/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    </script>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-JWH1BZW037"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-JWH1BZW037");
    </script>

    <!-- Resource hints -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
    <link rel="dns-prefetch" href="https://flagcdn.com" />
    <link rel="preload" href="https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js" as="script" />
    <link rel="preload" href="freetv.css" as="style" />

    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="freetv.css" />

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              base: "var(--bg)",
              surface: "var(--bg-2)",
              card: "var(--card)",
              "card-hover": "var(--card-hover)",
              ink: "var(--text)",
              muted: "var(--muted)",
              edge: "var(--border)",
              primary: "var(--primary)",
              "primary-soft": "var(--primary-soft)",
              accent: "var(--accent)",
              emerald: "var(--emerald)",
            },
            borderRadius: {
              xl: "14px",
              "2xl": "18px",
            },
            boxShadow: {
              glass: "0 10px 30px rgba(0, 0, 0, 0.45)",
              card: "0 14px 30px rgba(0, 0, 0, 0.35)",
            },
            transitionDuration: {
              160: "160ms",
            },
            keyframes: {
              livepulse: {
                "0%": { boxShadow: "0 0 0 0 rgba(255, 77, 77, 0.6)" },
                "70%": { boxShadow: "0 0 0 8px rgba(255, 77, 77, 0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(255, 77, 77, 0)" },
              },
              spin: {
                to: { transform: "rotate(360deg)" },
              },
            },
            animation: {
              livepulse: "livepulse 1.8s infinite",
              spin: "spin 0.9s linear infinite",
            },
          },
        },
      };
    </script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4690647905356010"
     crossorigin="anonymous"></script>
  </head>
  <body class="bg-base text-ink antialiased">
    <!-- Header -->
    <header
      class="sticky top-0 z-40 backdrop-blur-md border-b border-edge bg-[color:color-mix(in_srgb,var(--bg)_80%,transparent)]"
    >
      <div
        class="max-w-[1180px] mx-auto px-5 py-3 flex items-center gap-[18px] flex-wrap"
      >
        <a href="/" class="brand flex items-center gap-2 font-extrabold text-lg tracking-tight flex-none">
          <span
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent text-white text-sm"
          >
            ▶
          </span>
          <span>ALISA<span class="text-primary">TV</span></span>
        </a>

        <div class="search-box relative flex-1 max-w-[560px] mx-auto">
          <svg
            class="search-icon absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-[18px] h-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            id="searchInput"
            type="text"
            placeholder="Search channels, countries, or what's on now…"
            class="w-full py-2.5 px-3.5 pl-10 rounded-full border border-edge bg-surface text-ink font-[inherit] text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </div>

        <nav class="main-nav flex items-center gap-[18px] flex-none">
          <a
            href="#rowTrending"
            data-nav="trending"
            class="text-muted font-semibold text-sm hover:text-ink transition-colors duration-160"
          >
            Trending
          </a>
          <a
            href="#rowSports"
            data-nav="sports"
            class="text-muted font-semibold text-sm hover:text-ink transition-colors duration-160"
          >
            Sports
          </a>
          <a
            href="#rowNews"
            data-nav="news"
            class="text-muted font-semibold text-sm hover:text-ink transition-colors duration-160"
          >
            News
          </a>
          <a
            href="#rowAll"
            data-nav="movies"
            class="text-muted font-semibold text-sm hover:text-ink transition-colors duration-160"
          >
            Movies
          </a>
          <button
            id="themeToggle"
            class="theme-toggle bg-transparent border border-edge text-ink w-9 h-9 rounded-full cursor-pointer text-base flex items-center justify-center hover:scale-110 transition-transform duration-160"
            aria-label="Toggle theme"
          >
            ☀️
          </button>
        </nav>
      </div>
    </header>