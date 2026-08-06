<?php
require_once __DIR__ . '/includes/config.php';

$channels_json = '[]';
$channels_data = get_cached('channels');
if ($channels_data === false) {
    $m3uText = fetch_url(M3U_URL);
    if ($m3uText !== false) {
        $countries = get_cached('countries');
        if ($countries === false) {
            $countriesText = fetch_url(COUNTRIES_URL);
            if ($countriesText !== false) {
                $countries = json_decode($countriesText, true) ?: [];
                set_cached('countries', $countries);
            } else {
                $countries = [];
            }
        }

        $langs = get_cached('languages');
        if ($langs === false) {
            $langsText = fetch_url(LANGUAGES_URL);
            if ($langsText !== false) {
                $langs = json_decode($langsText, true) ?: [];
                set_cached('languages', $langs);
            } else {
                $langs = [];
            }
        }

        $countryMap = [];
        foreach ($countries as $c) {
            $countryMap[$c['code']] = [
                'name' => $c['name'],
                'flag' => $c['flag'] ?? '',
                'languages' => $c['languages'] ?? [],
            ];
        }

        $langName = [];
        foreach ($langs as $l) {
            $langName[$l['code']] = $l['name'];
        }

        $lines = explode("\n", $m3uText);
        $channels = [];
        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (strpos($line, '#EXTINF:') !== 0) continue;
            $next = isset($lines[$i + 1]) ? trim($lines[$i + 1]) : '';
            if (!$next || strpos($next, '#') === 0 || substr($next, -6) !== '.m3u8') continue;

            $group = [];
            preg_match('/group-title="([^"]*)"/', $line, $group);
            $category = $group[1] ?? 'General';

            $tvgId = [];
            preg_match('/tvg-id="([^"]*)"/', $line, $tvgId);
            $id = $tvgId[1] ?? 'ch-' . count($channels);

            $name = (preg_match('/,(.+)$/', $line, $m) ? $m[1] : 'Unknown');
            $logo = (preg_match('/tvg-logo="([^"]*)"/', $line, $m) ? $m[1] : '');

            $cc = [];
            preg_match('/\.([a-zA-Z]{2})(@|$)/', $id, $cc);
            $country = $cc ? strtoupper($cc[1]) : 'INT';

            $langsForCountry = ($countryMap[$country]['languages'] ?? []) ?: [];
            $languages = array_filter(array_map(function ($code) use ($langName) {
                return $langName[$code] ?? $code;
            }, $langsForCountry));

            $channels[] = [
                'id' => $id,
                'name' => trim($name),
                'category' => $category,
                'country' => $country,
                'languages' => array_values($languages),
                'language' => ($languages[0] ?? 'Unknown'),
                'logo' => $logo,
                'streamUrl' => $next,
            ];
        }

        usort($channels, function ($a, $b) {
            return ($a['country'] === 'INT') - ($b['country'] === 'INT');
        });

        $channels_data = [
            'channels' => $channels,
            'count' => count($channels),
            'countries' => count(array_unique(array_column($channels, 'country'))),
            'categories' => count(array_unique(array_map(function ($c) {
                return $c['category'];
            }, $channels))),
        ];
        set_cached('channels', $channels_data);
    }
}

if ($channels_data !== false) {
    $channels_json = json_encode($channels_data['channels'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

require_once __DIR__ . '/includes/header.php';
?>

    <!-- Hero -->
    <section
      class="hero border-b border-edge bg-[color:radial-gradient(120%_120%_at_50%_0%,rgba(109,94,252,0.16),transparent_60%)]"
    >
      <div class="max-w-[1180px] mx-auto px-5 py-16 text-center">
        <span
          class="inline-block px-3.5 py-1.5 rounded-full bg-primary-soft text-primary font-bold text-xs tracking-[0.04em] mb-5"
        >
          Free • No account • No apps
        </span>
        <h1 class="text-4xl lg:text-5xl leading-tight mb-4 tracking-tight">
          Watch free live TV from
          <span
            class="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            175+ countries
          </span>
        </h1>

        <div class="hero-stats flex justify-center gap-9 flex-wrap">
          <div>
            <strong id="statChannels" class="block text-3xl"><?php echo number_format($channels_data['count'] ?? 0); ?></strong
            ><span class="text-muted text-sm">Channels</span>
          </div>
          <div>
            <strong id="statCountries" class="block text-3xl"><?php echo $channels_data['countries'] ?? 0; ?></strong
            ><span class="text-muted text-sm">Countries</span>
          </div>
          <div>
            <strong id="statCategories" class="block text-3xl"><?php echo $channels_data['categories'] ?? 0; ?></strong
            ><span class="text-muted text-sm">Categories</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="filters border-b border-edge bg-base" aria-label="Filters">
      <div
        class="max-w-[1180px] mx-auto px-5 py-4 flex gap-[14px] items-end flex-wrap"
      >
        <div class="filter-group flex flex-col gap-1.5 min-w-[160px] flex-1 basis-[160px]">
          <label for="countryFilter" class="text-xs font-semibold text-muted uppercase tracking-[0.04em]">
            Country
          </label>
          <select
            id="countryFilter"
            class="p-2.5 rounded-lg border border-edge bg-surface text-ink font-[inherit] cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            <option value="all">All countries</option>
          </select>
        </div>
        <div class="filter-group flex flex-col gap-1.5 min-w-[160px] flex-1 basis-[160px]">
          <label for="categoryFilter" class="text-xs font-semibold text-muted uppercase tracking-[0.04em]">
            Category
          </label>
          <select
            id="categoryFilter"
            class="p-2.5 rounded-lg border border-edge bg-surface text-ink font-[inherit] cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            <option value="all">All categories</option>
          </select>
        </div>
        <div class="filter-group flex flex-col gap-1.5 min-w-[160px] flex-1 basis-[160px]">
          <label for="languageFilter" class="text-xs font-semibold text-muted uppercase tracking-[0.04em]">
            Language
          </label>
          <select
            id="languageFilter"
            class="p-2.5 rounded-lg border border-edge bg-surface text-ink font-[inherit] cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            <option value="all">All languages</option>
          </select>
        </div>
        <button
          id="favoritesToggle"
          class="pill-toggle ml-auto p-2.5 rounded-full border border-edge bg-surface text-ink font-semibold cursor-pointer transition-all duration-160"
          aria-pressed="false"
        >
          ★ Favorites
        </button>
      </div>
    </section>

    <!-- Channel sections -->
    <main class="container max-w-[1180px] mx-auto px-5 py-8 pb-14">
      <section class="row mb-10" id="rowTrending">
        <div class="row-head flex items-baseline gap-3 mb-4">
          <h2 class="m-0 text-2xl tracking-tight">Trending</h2>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[14px]" id="gridTrending"></div>
      </section>

      <section class="row mb-10" id="rowSports">
        <div class="row-head flex items-baseline gap-3 mb-4">
          <h2 class="m-0 text-2xl tracking-tight">Sports on now</h2>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[14px]" id="gridSports"></div>
      </section>

      <section class="row mb-10" id="rowNews">
        <div class="row-head flex items-baseline gap-3 mb-4">
          <h2 class="m-0 text-2xl tracking-tight">News</h2>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[14px]" id="gridNews"></div>
      </section>

      <section class="row" id="rowAll">
        <div class="row-head flex items-baseline gap-3 mb-4">
          <h2 class="m-0 text-2xl tracking-tight">Browse all channels</h2>
          <span class="row-count text-muted text-sm" id="allCount"></span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[14px]" id="gridAll"></div>
      </section>
    </main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>