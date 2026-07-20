let channels = [];
let favoriteChannelIds = [];
let currentlyPlayingId = null;
const FAVORITES_KEY = 'iptvFavorites';
const THEME_KEY = 'iptvTheme';
const M3U_STREAMS_URL = 'https://iptv-org.github.io/iptv/index.m3u';

const countryFilter = document.getElementById('countryFilter');
const sportFilter = document.getElementById('sportFilter');
const favoritesFilter = document.getElementById('favoritesFilter');
const searchInput = document.getElementById('searchInput');
const channelSelect = document.getElementById('channelSelect');
const totalChannels = document.getElementById('totalChannels');
const totalCountries = document.getElementById('totalCountries');
const totalSports = document.getElementById('totalSports');
const player = document.getElementById('iptvPlayer');
const videoFrame = player.parentElement;
const playerTitle = document.getElementById('playerTitle');
const playerDescription = document.getElementById('playerDescription');
const playerCountry = document.getElementById('playerCountry');
const playerSport = document.getElementById('playerSport');
const themeToggle = document.getElementById('themeToggle');

// Use the browser's Intl API to get full country names from codes.
const countryNameProvider = new Intl.DisplayNames(['en'], { type: 'region' });

function getCountryName(code) {
  if (!code) return 'Unknown';
  try {
    // For valid codes like 'US', this returns 'United States'.
    return countryNameProvider.of(code);
  } catch (e) {
    // For invalid codes like 'INT' or 'XX', .of() throws a RangeError.
    // In this case, we just return the original code.
    return code;
  }
}

function formatBadge(text) {
  return text || 'N/A';
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '🌙'; // Set icon for switching to dark
  } else {
    document.body.classList.remove('light-theme');
    themeToggle.textContent = '☀️'; // Set icon for switching to light
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  const newTheme = isLight ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, newTheme);
  applyTheme(newTheme);
}

function getFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteChannelIds));
}

function toggleFavorite(channelId) {
  const index = favoriteChannelIds.indexOf(channelId);
  if (index > -1) favoriteChannelIds.splice(index, 1);
  else favoriteChannelIds.push(channelId);
  saveFavorites();
  renderChannels();
}

async function geolocateAndSetFilter() {
  // Multiple free, CORS-friendly IP geolocation services (no API key required).
  // We try each in order and stop at the first that returns a valid country code.
  const geoEndpoints = [
    { url: 'https://get.geojs.io/v1/ip/geo.json', code: (d) => d.country_code },
    { url: 'https://ipwho.is/', code: (d) => d.country_code },
    { url: 'https://ipapi.co/json/', code: (d) => d.country_code },
  ];

  for (const endpoint of geoEndpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(endpoint.url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const locationData = await response.json();
      const userCountryCode = endpoint.code(locationData);

      if (userCountryCode) {
        const countryExists = Array.from(countryFilter.options).some(opt => opt.value === userCountryCode);
        if (countryExists) {
          countryFilter.value = userCountryCode;
          console.log(`Automatically filtering for user's country: ${userCountryCode}`);
        }
        return;
      }
    } catch (error) {
      console.warn(`Geolocation endpoint failed: ${endpoint.url}`, error);
    }
  }

  console.warn('Geolocation could not be determined; showing all countries by default.');
}

function parseM3U(m3uContent) {
  const lines = m3uContent.split('\n');
  const parsedChannels = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) {
      continue;
    }

    const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
    // Ensure the next line is a valid HLS stream URL
    if (!nextLine || nextLine.startsWith('#') || !nextLine.endsWith('.m3u8')) {
      continue;
    }

    const groupTitleMatch = line.match(/group-title="([^"]*)"/);
    const category = groupTitleMatch ? groupTitleMatch[1] : '';

    // Filter for sports channels during parsing
    if (category.toLowerCase() !== 'sports') {
      continue;
    }

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const id = tvgIdMatch ? tvgIdMatch[1] : `ch-${parsedChannels.length}`;

    const nameMatch = line.match(/,(.+)$/);
    const name = nameMatch ? nameMatch[1] : 'Unknown Channel';

    // Best-effort country code extraction from tvg-id (e.g., "Channel.us")
    const countryCodeMatch = id.match(/\.([a-zA-Z]{2})$/);
    const country = countryCodeMatch ? countryCodeMatch[1].toUpperCase() : 'INT';

    parsedChannels.push({ id: id || name, name, country, sport: 'Sports', language: 'Unknown', quality: 'SD/HD', description: `A public stream for ${name}.`, status: 'Public Stream', streamUrl: nextLine });
  }
  return parsedChannels;
}

function populateFilters() {
  const countries = [...new Set(channels.map((channel) => channel.country))].sort();
  const sports = [...new Set(channels.map((channel) => channel.sport))].sort();

  // Create objects with code and full name, then sort alphabetically by name
  const countryOptions = countries
    .map(code => ({ code, name: getCountryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  countryOptions.forEach(({ code, name }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    countryFilter.appendChild(option);
  });

  sports.forEach((sport) => {
    const option = document.createElement('option');
    option.value = sport;
    option.textContent = sport;
    sportFilter.appendChild(option);
  });
}

function loadChannel(channel) {
  playerTitle.textContent = channel.name;
  playerCountry.textContent = getCountryName(channel.country);
  playerSport.textContent = formatBadge(channel.sport);

  // Set initial loading state
  playerDescription.textContent = 'Connecting to stream...';
  videoFrame.classList.add('loading');

  // Update the visual indicator for the playing channel in the dropdown
  if (currentlyPlayingId !== channel.id) {
    currentlyPlayingId = channel.id;
    if (channelSelect.value !== channel.id) {
      channelSelect.value = channel.id;
    }
  }

  if (player.hls) {
    player.hls.destroy();
  }

  if (!channel.streamUrl) {
    player.removeAttribute('src');
    playerDescription.textContent = 'No stream URL available for this channel.';
    videoFrame.classList.remove('loading');
    return;
  }

  // Use HLS.js directly and handle its errors for robustness
  const hls = new Hls({
    // Add a timeout for manifest loading to avoid indefinite waiting
    manifestLoadTimeout: 15000,
  });
  player.hls = hls;

  hls.on(Hls.Events.MANIFEST_PARSED, function () {
    // Stream manifest loaded successfully, update description
    playerDescription.textContent = channel.description;
    videoFrame.classList.remove('loading');
  });

  hls.on(Hls.Events.ERROR, function (event, data) {
    if (data.fatal) {
      console.error('HLS.js fatal error:', data);
      let errorMessage = 'This stream appears to be offline or is unavailable.';

      // Provide more specific feedback for 403 Forbidden errors
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && data.response?.code === 403) {
        errorMessage = 'Access to this stream is forbidden (403). It may be region-locked or protected.';
      }

      playerDescription.textContent = errorMessage;
      videoFrame.classList.remove('loading');
      hls.destroy();
    }
  });

  hls.loadSource(channel.streamUrl);
  hls.attachMedia(player);
  player.play().catch(() => {});
}

function renderChannels() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const countryValue = countryFilter.value;
  const sportValue = sportFilter.value;
  const showFavorites = favoritesFilter.checked;

  const filtered = channels.filter((channel) => {
    const isFavorite = favoriteChannelIds.includes(channel.id);
    if (showFavorites && !isFavorite) return false;

    const matchesCountry = countryValue === 'all' || channel.country === countryValue;
    const matchesSport = sportValue === 'all' || channel.sport === sportValue;
    const searchText = `${channel.name} ${channel.country}`.toLowerCase();
    const matchesSearch = searchValue === '' || searchText.includes(searchValue);
    return matchesCountry && matchesSport && matchesSearch;
  });

  totalChannels.textContent = filtered.length;
  totalCountries.textContent = [...new Set(filtered.map((channel) => channel.country))].length;
  totalSports.textContent = [...new Set(filtered.map((channel) => channel.sport))].length;

  // Preserve the currently selected channel across re-renders when possible.
  const previousSelection = channelSelect.value;

  channelSelect.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = filtered.length
    ? '-- Choose a channel --'
    : 'No channels match those filters';
  channelSelect.appendChild(placeholder);

  if (!filtered.length) {
    channelSelect.disabled = true;
    return filtered;
  }

  channelSelect.disabled = false;

  filtered.forEach((channel) => {
    const option = document.createElement('option');
    option.value = channel.id;
    option.textContent = `${channel.name} (${getCountryName(channel.country)})`;
    if (channel.id === currentlyPlayingId) option.selected = true;
    channelSelect.appendChild(option);
  });

  // If the previous selection is still in the list, keep it selected;
  // otherwise fall back to the currently playing channel.
  if (filtered.some((c) => c.id === previousSelection)) {
    channelSelect.value = previousSelection;
  } else if (currentlyPlayingId && filtered.some((c) => c.id === currentlyPlayingId)) {
    channelSelect.value = currentlyPlayingId;
  }

  return filtered;
}

async function initializeApp() {
  favoriteChannelIds = getFavorites();
  try {
    const response = await fetch(M3U_STREAMS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel list: ${response.statusText}`);
    }
    const m3uContent = await response.text();

    channels = parseM3U(m3uContent);

    if (channels.length > 0) {
      populateFilters();

      channelSelect.innerHTML = '<option value="">Detecting your location to filter channels...</option>';
      await geolocateAndSetFilter();

      const initialChannels = renderChannels();

      if (initialChannels.length > 0) {
        // Load the first channel from the (potentially filtered) list
        currentlyPlayingId = initialChannels[0].id;
        loadChannel(initialChannels[0]);
      } else {
        // This handles the case where auto-filtering results in no channels
        playerTitle.textContent = 'No channels for your location';
        playerDescription.textContent = 'Try selecting "All countries" from the filter above.';
        playerCountry.textContent = '';
        playerSport.textContent = '';
      }
    } else {
      channelSelect.innerHTML = '<option value="">Could not load any sports channels at this time.</option>';
      channelSelect.disabled = true;
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    channelSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
    channelSelect.disabled = true;
  } finally {
    // Add event listeners after data is ready
    [countryFilter, sportFilter, searchInput, favoritesFilter].forEach((element) => {
      element.addEventListener('input', renderChannels);
      element.addEventListener('change', renderChannels);
    });

    // Load a channel when the user picks one from the dropdown
    channelSelect.addEventListener('change', () => {
      const selected = channels.find((channel) => channel.id === channelSelect.value);
      if (selected) {
        loadChannel(selected);
      }
    });
  }
}

function setupTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', toggleTheme);
}

// Show a loading message while fetching data
channelSelect.innerHTML = '<option value="">Loading thousands of channels...</option>';
channelSelect.disabled = true;
totalChannels.textContent = '...';
totalCountries.textContent = '...';
totalSports.textContent = '...';

setupTheme();
initializeApp();
