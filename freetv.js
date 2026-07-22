// FreeTV clone — uses the public iptv-org data
const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';
const LANGUAGES_URL = 'https://iptv-org.github.io/api/languages.json';
const FAV_KEY = 'freetvFavorites';
const THEME_KEY = 'freetvTheme';

// Country data sourced from iptv-org/database via their public API.
// Maps ISO alpha-2 code -> { name, flag (emoji), languages: [iso639-3,...] }
let countryData = {};
// Maps ISO 639-3 language code -> human-readable name.
let langName = {};

// Category mapping derived from iptv-org group-title values
const CATEGORY_MAP = {
  'news': 'News',
  'sports': 'Sports',
  'movies': 'Movies',
  'music': 'Music',
  'entertainment': 'Entertainment',
  'general': 'General',
  'kids': 'Kids',
  'documentary': 'Documentary',
  'education': 'Education',
  'religious': 'Religious',
  'business': 'Business',
  'weather': 'Weather',
  'animation': 'Animation',
  'travel': 'Travel',
  'lifestyle': 'Lifestyle',
  'series': 'Series',
  'auto': 'Auto',
  'culture': 'Culture',
  'family': 'Family',
  'outdoor': 'Outdoor',
  'relax': 'Relax',
  'shop': 'Shop',
  'legislative': 'Legislative',
};

let channels = [];
let favorites = [];

// Element refs
const els = {
  search: document.getElementById('searchInput'),
  country: document.getElementById('countryFilter'),
  category: document.getElementById('categoryFilter'),
  language: document.getElementById('languageFilter'),
  favoritesToggle: document.getElementById('favoritesToggle'),
  statChannels: document.getElementById('statChannels'),
  statCountries: document.getElementById('statCountries'),
  statCategories: document.getElementById('statCategories'),
  allCount: document.getElementById('allCount'),
  themeToggle: document.getElementById('themeToggle'),
  modal: document.getElementById('playerModal'),
  player: document.getElementById('player'),
  overlay: document.getElementById('videoOverlay'),
  overlayText: document.getElementById('overlayText'),
  title: document.getElementById('playerTitle'),
  desc: document.getElementById('playerDesc'),
  countryEl: document.getElementById('playerCountry'),
  categoryEl: document.getElementById('playerCategory'),
  flag: document.getElementById('playerFlag'),
  grids: {
    trending: document.getElementById('gridTrending'),
    sports: document.getElementById('gridSports'),
    news: document.getElementById('gridNews'),
    all: document.getElementById('gridAll'),
  },
};

const countryNameProvider = new Intl.DisplayNames(['en'], { type: 'region' });

function getCountryName(code) {
  if (!code || code === 'INT') return 'International';
  if (countryData[code]) return countryData[code].name;
  try {
    return countryNameProvider.of(code);
  } catch {
    return code;
  }
}

function getCountryFlag(code, asImage = false) {
  if (countryData[code] && countryData[code].flag && !asImage) {
    return countryData[code].flag; // emoji
  }
  return `https://flagcdn.com/24x18/${String(code).toLowerCase()}.png`; // image fallback
}

function categoryFor(channel) {
  const key = (channel.category || '').toLowerCase();
  return CATEGORY_MAP[key] || (channel.category ? channel.category : 'General');
}

function loadFavorites() {
  favorites = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
}
function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}
function isFav(id) {
  return favorites.includes(id);
}
function toggleFav(id) {
  const i = favorites.indexOf(id);
  if (i > -1) favorites.splice(i, 1);
  else favorites.push(id);
  saveFavorites();
}

function setupTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved ? saved : prefersLight ? 'light' : 'dark');
  els.themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}
function applyTheme(theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  els.themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Parse the main M3U into channels. Country is extracted from the tvg-id,
// which uses the form "Name.cc@Quality" (e.g. "BBCNews.uk@SD").
function parseM3U(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;
    const next = lines[i + 1] ? lines[i + 1].trim() : '';
    if (!next || next.startsWith('#') || !next.endsWith('.m3u8')) continue;

    const group = line.match(/group-title="([^"]*)"/);
    const category = group ? group[1] : 'General';
    const tvgId = line.match(/tvg-id="([^"]*)"/);
    const id = tvgId ? tvgId[1] : `ch-${out.length}`;
    const name = (line.match(/,(.+)$/) || [, 'Unknown'])[1];
    const logo = (line.match(/tvg-logo="([^"]*)"/) || [])[1] || '';
    const cc = id.match(/\.([a-zA-Z]{2})(@|$)/);
    const country = cc ? cc[1].toUpperCase() : 'INT';

    // Derive language(s) from the country's official languages.
    const langs = (countryData[country] && countryData[country].languages) || [];
    const languages = langs.map((code) => langName[code] || code).filter(Boolean);

    out.push({
      id: id || name,
      name: name.trim(),
      category,
      country,
      languages,
      language: languages[0] || 'Unknown',
      logo,
      streamUrl: next,
    });
  }
  return out;
}

function populateFilters() {
  // Reset the selects before (re)populating.
  els.country.innerHTML = '<option value="all">All countries</option>';
  els.category.innerHTML = '<option value="all">All categories</option>';
  els.language.innerHTML = '<option value="all">All languages</option>';

  // Only show countries that actually have channels.
  const present = new Set(channels.map((c) => c.country));
  const countryOptions = [...present]
    .filter((code) => code && code !== 'INT')
    .map((code) => ({ code, name: getCountryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (present.has('INT')) {
    countryOptions.unshift({ code: 'INT', name: 'International' });
  }
  countryOptions.forEach(({ code, name }) => {
    const o = document.createElement('option');
    o.value = code;
    o.textContent = name;
    els.country.appendChild(o);
  });

  const cats = [...new Set(channels.map((c) => categoryFor(c)))].sort();
  cats.forEach((c) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    els.category.appendChild(o);
  });

  // Languages derived from each channel's country.
  const langs = [...new Set(channels.flatMap((c) => c.languages))]
    .filter((l) => l && l !== 'Unknown')
    .sort((a, b) => a.localeCompare(b));
  langs.forEach((l) => {
    const o = document.createElement('option');
    o.value = l;
    o.textContent = l;
    els.language.appendChild(o);
  });

  els.statChannels.textContent = channels.length.toLocaleString();
  els.statCountries.textContent = present.size;
  els.statCategories.textContent = cats.length;
}

function logoUrl(channel) {
  if (channel.logo) return channel.logo;
  // fall back to a letter tile
  return null;
}

function cardHtml(channel) {
  const flagUrl = getCountryFlag(channel.country, true);
  const fav = isFav(channel.id);
  const logo = logoUrl(channel);
  const initials = channel.name.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 2).toUpperCase();
  const favStyle = fav ? 'opacity:1;color:#ffc83d' : '';
  
  const logoEl = logo
    ? `<img class="w-10 h-10 rounded-lg object-cover bg-black border border-edge flex-none" src="${logo}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.outerHTML='<div class=\\'w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-white flex-none\\' style=\\'background:linear-gradient(135deg,#6d5efc,#38e1ff)\\'>${initials}</div>'">`
    : `<div class="w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-white flex-none" style="background:linear-gradient(135deg,#6d5efc,#38e1ff)">${initials}</div>`;

  return `
    <article class="group relative border border-edge bg-card rounded-xl p-3.5 cursor-pointer transition-all duration-160 flex flex-col gap-2.5 hover:-translate-y-0.75 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:shadow-card hover:bg-card-hover" data-id="${channel.id}">
      <button style="${favStyle}" data-fav="${channel.id}" aria-label="Toggle favorite" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full border border-edge bg-[color:color-mix(in_srgb,var(--bg)_70%,transparent)] text-muted cursor-pointer text-sm flex items-center justify-center opacity-0 transition-all duration-160 group-hover:opacity-100 hover:scale-110">★</button>
      <div class="flex items-center gap-2.5">
        ${logoEl}
        <div class="font-bold text-sm leading-snug overflow-hidden line-clamp-2">${channel.name}</div>
      </div>
      <div class="flex items-center justify-between gap-2 mt-auto">
        <span class="flex items-center gap-1.5 text-muted text-xs">
          <img class="w-5 h-[14px] rounded-sm object-cover flex-none" src="${flagUrl}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'"> ${getCountryName(channel.country)}
        </span>
        <span class="text-muted text-xs bg-[var(--lang-bg)] px-2 py-0.5 rounded-full whitespace-nowrap">${channel.language !== 'Unknown' ? channel.language : ''}</span>
        <span class="inline-flex items-center gap-[5px] text-xs font-semibold text-emerald bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.3)] px-2 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-emerald"></span> Live</span>
      </div>
    </article>`;
}

function renderGrid(grid, list) {
  if (!list.length) {
    grid.innerHTML = '<div class="col-span-full text-center text-muted p-10 border border-dashed border-edge rounded-xl">No channels match your filters right now.</div>';
    return;
  }
  grid.innerHTML = list.map(cardHtml).join('');
}

function getFilters() {
  return {
    q: els.search.value.trim().toLowerCase(),
    country: els.country.value,
    category: els.category.value,
    language: els.language.value,
    favOnly: els.favoritesToggle.getAttribute('aria-pressed') === 'true',
  };
}

function filtered(f) {
  return channels.filter((c) => {
    if (f.favOnly && !isFav(c.id)) return false;
    if (f.country !== 'all' && c.country !== f.country) return false;
    if (f.category !== 'all' && categoryFor(c) !== f.category) return false;
    if (f.language !== 'all' && !(c.languages || []).includes(f.language)) return false;
    if (f.q) {
      const hay = `${c.name} ${getCountryName(c.country)} ${categoryFor(c)} ${(c.languages || []).join(' ')}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
}

function renderAll() {
  const f = getFilters();
  const all = filtered(f);

  // Section rows reflect the same filtered set but highlighted by category
  const trending = all.slice(0, 12);
  const sports = all.filter((c) => categoryFor(c) === 'Sports').slice(0, 12);
  const news = all.filter((c) => categoryFor(c) === 'News').slice(0, 12);

  // When a specific search/filter is active, hide the themed rows and show everything in "all"
  const focused = f.q || f.country !== 'all' || f.category !== 'all' || f.language !== 'all' || f.favOnly;

  els.grids.trending.parentElement.style.display = focused ? 'none' : '';
  els.grids.sports.parentElement.style.display = focused ? 'none' : '';
  els.grids.news.parentElement.style.display = focused ? 'none' : '';

  renderGrid(els.grids.trending, trending);
  renderGrid(els.grids.sports, sports);
  renderGrid(els.grids.news, news);
  renderGrid(els.grids.all, all);
  els.allCount.textContent = `${all.length} channel${all.length === 1 ? '' : 's'}`;
}

// Player
let hls = null;

function openPlayer(channel) {
  els.title.textContent = channel.name;
  els.desc.textContent = `${categoryFor(channel)} • ${getCountryName(channel.country)}${channel.language !== 'Unknown' ? ' • ' + channel.language : ''}`;
  els.countryEl.textContent = getCountryName(channel.country);
  els.categoryEl.textContent = categoryFor(channel);
  els.flag.src = `https://flagcdn.com/24x18/${channel.country.toLowerCase()}.png`;
  els.flag.referrerPolicy = 'no-referrer';
  els.flag.style.display = '';

  showOverlay('Connecting to stream…');

  if (hls) {
    hls.destroy();
    hls = null;
  }
  els.player.removeAttribute('src');

  if (!channel.streamUrl) {
    showOverlay('This stream is unavailable right now.', true);
    return;
  }

  if (els.player.canPlayType('application/vnd.apple.mpegurl')) {
    els.player.src = channel.streamUrl;
    els.player.play().catch(() => {});
    els.player.addEventListener('loadeddata', () => hideOverlay(), { once: true });
  } else if (window.Hls && Hls.isSupported()) {
    hls = new Hls({ manifestLoadTimeout: 15000 });
    hls.loadSource(channel.streamUrl);
    hls.attachMedia(els.player);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      hideOverlay();
      els.player.play().catch(() => {});
    });
    hls.on(Hls.Events.ERROR, (e, data) => {
      if (data.fatal) {
        let msg = 'This stream appears to be offline or unavailable.';
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && data.response?.code === 403) {
          msg = 'Access to this stream is forbidden (403). It may be region-locked.';
        }
        showOverlay(msg, true);
        hls.destroy();
      }
    });
  } else {
    showOverlay('Your browser cannot play this stream.', true);
  }

  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
}

function closePlayer() {
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');
  if (hls) {
    hls.destroy();
    hls = null;
  }
  els.player.pause();
  els.player.removeAttribute('src');
}

function showOverlay(text, isError = false) {
  els.overlayText.textContent = text;
  els.overlay.classList.toggle('error', isError);
  els.overlay.classList.add('visible');
}
function hideOverlay() {
  els.overlay.classList.remove('visible');
}

// Events
function bindEvents() {
  [els.search, els.country, els.category, els.language].forEach((el) => {
    el.addEventListener('input', renderAll);
    el.addEventListener('change', renderAll);
  });

  els.favoritesToggle.addEventListener('click', () => {
    const pressed = els.favoritesToggle.getAttribute('aria-pressed') === 'true';
    els.favoritesToggle.setAttribute('aria-pressed', String(!pressed));
    renderAll();
  });

  // Delegated card clicks
  document.querySelector('.container').addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      toggleFav(favBtn.dataset.fav);
      favBtn.classList.toggle('favorited');
      renderAll();
      return;
    }
    const card = e.target.closest('.channel-card');
    if (card) {
      const ch = channels.find((c) => c.id === card.dataset.id);
      if (ch) openPlayer(ch);
    }
  });

  els.modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closePlayer));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayer();
  });
}

async function init() {
  loadFavorites();
  setupTheme();
  bindEvents();

  const allGrids = Object.values(els.grids);
  allGrids.forEach((g) => (g.innerHTML = '<div class="col-span-full text-center text-muted p-10 border border-dashed border-edge rounded-xl">Loading channels from iptv-org…</div>'));

  try {
    // Country + language metadata and the channel list in parallel.
    const countriesPromise = fetch(COUNTRIES_URL)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        (list || []).forEach((c) => {
          countryData[c.code] = { name: c.name, flag: c.flag, languages: c.languages || [] };
        });
      })
      .catch((err) => console.warn('Could not load country data:', err));

    const languagesPromise = fetch(LANGUAGES_URL)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        (list || []).forEach((l) => {
          langName[l.code] = l.name;
        });
      })
      .catch((err) => console.warn('Could not load language data:', err));

    const [m3uRes] = await Promise.all([fetch(M3U_URL), countriesPromise, languagesPromise]);
    if (!m3uRes.ok) throw new Error(`channels: ${m3uRes.statusText}`);
    channels = parseM3U(await m3uRes.text());

    // Surface channels that have a known country first; "International"
    // (no country metadata in the playlist) sinks to the bottom.
    channels.sort((a, b) => (a.country === 'INT') - (b.country === 'INT'));

    if (!channels.length) throw new Error('No channels were loaded.');
    populateFilters();
    renderAll();
  } catch (err) {
    console.error(err);
    allGrids.forEach((g) => {
      g.innerHTML = `<div class="col-span-full text-center text-muted p-10 border border-dashed border-edge rounded-xl">Could not load channels: ${err.message}</div>`;
    });
  }
}

window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG' && e.target.src.includes('effectivecpmnetwork')) return true;
  if (e.message && e.message.includes('Cannot read') && e.filename && !e.filename.includes('freetv')) return true;
  return false;
}, true);

init();
