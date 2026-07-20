let channels = [];
let favoriteChannelIds = [];
let currentlyPlayingId = null;
const FAVORITES_KEY = 'iptvFavorites';
const THEME_KEY = 'iptvTheme';
const IPTV_CHANNELS_URL = 'https://iptv-org.github.io/iptv/channels.json';

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

async function loadChannel(channel) {
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

  try {
    // Check if the stream is online with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    const response = await fetch(channel.streamUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Stream check failed with status: ${response.status}`);
    }

    // If check is successful, load with HLS.js
    playerDescription.textContent = channel.description; // Restore original description
    const hls = new Hls();
    player.hls = hls;
    hls.loadSource(channel.streamUrl);
    hls.attachMedia(player);
    player.play().catch(() => {});
  } catch (error) {
    console.error('Failed to load stream:', error.message);
    player.removeAttribute('src');
    playerDescription.textContent = 'This stream appears to be offline or is unavailable.';
  }
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
    const searchText = `${channel.name} ${channel.language} ${channel.description}`.toLowerCase();
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
    button.addEventListener('click', async () => {
      const channelId = button.dataset.channelId;
      const selected = channels.find((channel) => channel.id === channelId);
      if (selected) {
        await loadChannel(selected);
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
    const response = await fetch(IPTV_CHANNELS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel list: ${response.statusText}`);
    }
    const data = await response.json();

    channels = data
      .filter((channel) => channel.category === 'Sports' && channel.status !== 'BROKEN')
      .map((channel) => ({
        id: channel.id, // Use the unique ID from the API
        name: channel.name,
        country: channel.countries[0]?.name || 'Unknown',
        sport: 'Sports', // The API provides a general "Sports" category
        language: channel.languages[0]?.name || 'Unknown',
        quality: channel.is_nsfw === false ? 'SD/HD' : 'Unknown',
        description: `A public stream for ${channel.name}.`,
        status: 'Public Stream',
        streamUrl: channel.url,
      }));

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
