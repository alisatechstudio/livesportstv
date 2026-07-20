let channels = [];
let favoriteChannelIds = [];
let currentlyPlayingId = null;
const FAVORITES_KEY = 'iptvFavorites';
const THEME_KEY = 'iptvTheme';
const M3U_STREAMS_URL = 'https://api.allorigins.win/raw?url=https://iptv-org.github.io/iptv/index.m3u';

const countryFilter = document.getElementById('countryFilter');
const sportFilter = document.getElementById('sportFilter');
const favoritesFilter = document.getElementById('favoritesFilter');
const searchInput = document.getElementById('searchInput');
const channelGrid = document.getElementById('channelGrid');
const totalChannels = document.getElementById('totalChannels');
const totalCountries = document.getElementById('totalCountries');
const totalSports = document.getElementById('totalSports');
const player = document.getElementById('iptvPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerDescription = document.getElementById('playerDescription');
const playerCountry = document.getElementById('playerCountry');
const playerSport = document.getElementById('playerSport');
const themeToggle = document.getElementById('themeToggle');

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

  countries.forEach((country) => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
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
  playerCountry.textContent = formatBadge(channel.country);
  playerSport.textContent = formatBadge(channel.sport);

  // Set initial loading state
  playerDescription.textContent = 'Connecting to stream...';

  // Update the visual indicator for the playing channel
  if (currentlyPlayingId !== channel.id) {
    const oldPlayingCard = document.querySelector(`.card.playing`);
    if (oldPlayingCard) {
      oldPlayingCard.classList.remove('playing');
    }
    const newPlayingCard = document.querySelector(`button[data-channel-id="${channel.id}"]`)?.closest('.card');
    if (newPlayingCard) {
      newPlayingCard.classList.add('playing');
    }
    currentlyPlayingId = channel.id;
  }

  if (player.hls) {
    player.hls.destroy();
  }

  if (!channel.streamUrl) {
    player.removeAttribute('src');
    playerDescription.textContent = 'No stream URL available for this channel.';
    return;
  }

  // Use HLS.js directly and handle its errors for robustness
  const hls = new Hls({
    // Add a timeout for manifest loading to avoid indefinite waiting
    manifestLoadTimeout: 5000,
  });
  player.hls = hls;

  hls.on(Hls.Events.MANIFEST_PARSED, function () {
    // Stream manifest loaded successfully, update description
    playerDescription.textContent = channel.description;
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

  if (!filtered.length) {
    channelGrid.innerHTML = '<div class="empty-state">No channels match those filters yet. Try another country or sport.</div>';
    return;
  }

  channelGrid.innerHTML = filtered
    .map(
      (channel) => {
        const isFavorited = favoriteChannelIds.includes(channel.id);
        const isPlaying = channel.id === currentlyPlayingId;
        return `
        <article class="card ${isPlaying ? 'playing' : ''}">
          <div class="meta-row">
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-channel-id="${channel.id}" aria-label="Toggle Favorite">★</button>
            <span class="badge">${channel.country}</span>
            <span class="badge">${channel.sport}</span>
          </div>
          <h3>${channel.name}</h3>
          <p>${channel.description}</p>
          <div class="meta-row"><span class="badge">${channel.language}</span></div>
          <div class="card-footer">
            <span>${channel.status}</span>
            <span class="status-pill">●</span>
          </div>
          <button class="watch-btn" type="button" data-channel-id="${channel.id}">Watch Now</button>
        </article>
      ` }
    )
    .join('');

  channelGrid.querySelectorAll('.watch-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const channelId = button.dataset.channelId;
      event.currentTarget.blur(); // Remove focus from the button to prevent conflict
      const selected = channels.find((channel) => channel.id === channelId);
      if (selected) {
        loadChannel(selected);
      }
    });
  });

  channelGrid.querySelectorAll('.favorite-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click event if any
      const channelId = button.dataset.channelId;
      toggleFavorite(channelId);
    });
  });
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
      renderChannels();
      // Load the first channel by default and set its playing state
      currentlyPlayingId = channels[0].id;
      loadChannel(channels[0]);
    } else {
      channelGrid.innerHTML = '<div class="empty-state">Could not load any sports channels at this time.</div>';
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    channelGrid.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`;
  } finally {
    // Add event listeners after data is ready
    [countryFilter, sportFilter, searchInput, favoritesFilter].forEach((element) => {
      element.addEventListener('input', renderChannels);
      element.addEventListener('change', renderChannels);
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
channelGrid.innerHTML = '<div class="empty-state">Loading thousands of channels...</div>';
totalChannels.textContent = '...';
totalCountries.textContent = '...';
totalSports.textContent = '...';

setupTheme();
initializeApp();
