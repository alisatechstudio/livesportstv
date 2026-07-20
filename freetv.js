// FreeTV clone — uses the public iptv-org data
const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';
const FAV_KEY = 'freetvFavorites';
const THEME_KEY = 'freetvTheme';

// Country data sourced from iptv-org/database via their public API.
// Maps ISO alpha-2 code -> { name, flag (emoji) }
let countryData = {};

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

    out.push({
      id: id || name,
      name: name.trim(),
      category,
      country,
      logo,
      streamUrl: next,
    });
  }
  return out;
}

function populateFilters() {
  // Reset both selects before (re)populating.
  els.country.innerHTML = '<option value="all">All countries</option>';
  els.category.innerHTML = '<option value="all">All categories</option>';

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
  const logoEl = logo
    ? `<img class="card-logo" src="${logo}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'card-logo card-logo-fallback\\' style=\\'background:linear-gradient(135deg,#6d5efc,#38e1ff)\\'>${initials}</div>'">`
    : `<div class="card-logo card-logo-fallback" style="background:linear-gradient(135deg,#6d5efc,#38e1ff)">${initials}</div>`;

  return `
    <article class="channel-card" data-id="${channel.id}">
      <button class="fav-btn ${fav ? 'favorited' : ''}" data-fav="${channel.id}" aria-label="Toggle favorite">★</button>
      <div class="card-top">
        ${logoEl}
        <div class="card-name">${channel.name}</div>
      </div>
      <div class="card-meta">
        <span class="card-country">
          <img class="flag" src="${flagUrl}" alt="" onerror="this.style.display='none'"> ${getCountryName(channel.country)}
        </span>
        <span class="status"><span class="dot"></span> Live</span>
      </div>
    </article>`;
}

function renderGrid(grid, list) {
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">No channels match your filters right now.</div>';
    return;
  }
  grid.innerHTML = list.map(cardHtml).join('');
}

function getFilters() {
  return {
    q: els.search.value.trim().toLowerCase(),
    country: els.country.value,
    category: els.category.value,
    favOnly: els.favoritesToggle.getAttribute('aria-pressed') === 'true',
  };
}

function filtered(f) {
  return channels.filter((c) => {
    if (f.favOnly && !isFav(c.id)) return false;
    if (f.country !== 'all' && c.country !== f.country) return false;
    if (f.category !== 'all' && categoryFor(c) !== f.category) return false;
    if (f.q) {
      const hay = `${c.name} ${getCountryName(c.country)} ${categoryFor(c)}`.toLowerCase();
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
  const focused = f.q || f.country !== 'all' || f.category !== 'all' || f.favOnly;

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
  els.desc.textContent = `${categoryFor(channel)} • ${getCountryName(channel.country)}`;
  els.countryEl.textContent = getCountryName(channel.country);
  els.categoryEl.textContent = categoryFor(channel);
  els.flag.src = `https://flagcdn.com/24x18/${channel.country.toLowerCase()}.png`;
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
  [els.search, els.country, els.category].forEach((el) => {
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
  allGrids.forEach((g) => (g.innerHTML = '<div class="empty-state">Loading channels from iptv-org…</div>'));

  try {
    // Country metadata (names + flag emoji) and the channel list in parallel.
    const countriesPromise = fetch(COUNTRIES_URL)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        (list || []).forEach((c) => {
          countryData[c.code] = { name: c.name, flag: c.flag };
        });
      })
      .catch((err) => console.warn('Could not load country data:', err));

    const [m3uRes] = await Promise.all([fetch(M3U_URL), countriesPromise]);
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
      g.innerHTML = `<div class="empty-state">Could not load channels: ${err.message}</div>`;
    });
  }
}

init();
