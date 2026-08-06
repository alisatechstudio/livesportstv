const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';
const COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json';
const LANGUAGES_URL = 'https://iptv-org.github.io/api/languages.json';
const FAV_KEY = 'livesportsFavorites';
const THEME_KEY = 'livesportsTheme';

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
let countryData = {};
let langName = {};
let favorites = [];

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
    return countryData[code].flag;
  }
  return `https://flagcdn.com/24x18/${String(code).toLowerCase()}.png`;
}

function categoryFor(channel) {
  const key = (channel.category || '').toLowerCase();
  return CATEGORY_MAP[key] || (channel.category ? channel.category : 'General');
}

function isSportChannel(channel) {
  const cat = categoryFor(channel).toLowerCase();
  return cat === 'sports' || cat === 'sport' || channel.name.toLowerCase().includes('sport');
}

function isNewsChannel(channel) {
  const cat = categoryFor(channel).toLowerCase();
  return cat === 'news' || cat === 'journalism' || channel.name.toLowerCase().includes('news');
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

function logoUrl(channel) {
  if (channel.logo) return channel.logo;
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
    <article class="channel-card group relative border border-edge bg-card rounded-xl p-3.5 cursor-pointer transition-all duration-160 flex flex-col gap-2.5 hover:-translate-y-0.75 hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)] hover:shadow-card hover:bg-card-hover" data-id="${channel.id}">
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
        <span class="inline-flex items-center gap-[5px] text-xs font-semibold text-emerald bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.3)] px-2 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-emerald"></span>Live</span>
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

  const sports = all.filter((c) => isSportChannel(c)).slice(0, 12);
  const news = all.filter((c) => isNewsChannel(c)).slice(0, 12);

  const focused = f.q || f.country !== 'all' || f.category !== 'all' || f.language !== 'all' || f.favOnly;

  els.grids.sports.parentElement.style.display = focused ? 'none' : '';
  els.grids.news.parentElement.style.display = focused ? 'none' : '';

  renderGrid(els.grids.sports, sports);
  renderGrid(els.grids.news, news);
  renderGrid(els.grids.all, all);
  els.allCount.textContent = `${all.length} channel${all.length === 1 ? '' : 's'}`;
}

function populateFilters() {
  els.country.innerHTML = '<option value="all">All countries</option>';
  els.category.innerHTML = '<option value="all">All categories</option>';
  els.language.innerHTML = '<option value="all">All languages</option>';

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

  document.querySelector('.container').addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      toggleFav(favBtn.dataset.fav);
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

async function fetchM3U() {
  try {
    const res = await fetch(M3U_URL);
    if (!res.ok) throw new Error(`M3U: ${res.statusText}`);
    return await res.text();
  } catch (err) {
    console.error('Failed to fetch M3U:', err);
    return null;
  }
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch:', url, err);
    return null;
  }
}

function parseM3U(m3uText) {
  const lines = m3uText.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;
    const nextIdx = i + 1;
    if (nextIdx >= lines.length) continue;
    const nextLine = lines[nextIdx].trim();
    if (!nextLine || nextLine.startsWith('#') || !nextLine.endsWith('.m3u8')) continue;

    const groupMatch = line.match(/group-title="([^"]*)"/);
    const category = groupMatch ? groupMatch[1] : 'General';

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const channelId = tvgIdMatch ? tvgIdMatch[1] : 'ch-' + result.length;

    const nameMatch = line.match(/,(.+)$/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const logo = logoMatch ? logoMatch[1] : '';

    const ccMatch = channelId.match(/\.([a-zA-Z]{2})(@|$)/);
    const country = ccMatch ? ccMatch[1].toUpperCase() : 'INT';

    result.push({
      id: channelId,
      name: name,
      category: category,
      country: country,
      languages: [],
      language: 'Unknown',
      logo: logo,
      streamUrl: nextLine,
    });
  }

  result.sort((a, b) => (a.country === 'INT') - (b.country === 'INT'));
  return result;
}

async function init() {
  loadFavorites();
  setupTheme();
  bindEvents();

  const allGrids = Object.values(els.grids);
  allGrids.forEach((g) => {
    g.innerHTML = '<div class="col-span-full text-center text-muted p-10 border border-dashed border-edge rounded-xl">Loading channels…</div>';
  });

  const m3uText = await fetchM3U();
  if (!m3uText) {
    allGrids.forEach((g) => {
      g.innerHTML = '<div class="col-span-full text-center text-muted p-10 border border-dashed border-edge rounded-xl">Could not load channel data. Please refresh.</div>';
    });
    return;
  }

  const [countriesData, langsData] = await Promise.all([
    fetchJSON(COUNTRIES_URL),
    fetchJSON(LANGUAGES_URL),
  ]);

  if (countriesData) {
    countriesData.forEach((c) => {
      countryData[c.code] = { name: c.name, flag: c.flag, languages: c.languages || [] };
    });
  }

  if (langsData) {
    langsData.forEach((l) => {
      langName[l.code] = l.name;
    });
  }

  channels = parseM3U(m3uText);

  channels.forEach((ch) => {
    const langsForCountry = (countryData[ch.country] || {}).languages || [];
    const languages = langsForCountry
      .map((code) => langName[code] || code)
      .filter(Boolean);
    ch.languages = languages;
    ch.language = languages[0] || 'Unknown';
  });

  populateFilters();
  renderAll();
}

window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG' && e.target.src.includes('effectivecpmnetwork')) return true;
  if (e.message && e.message.includes('Cannot read') && e.filename && !e.filename.includes('app')) return true;
  return false;
}, true);

init();