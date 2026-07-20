const channels = [
  {
    name: 'ESPN',
    country: 'United States',
    sport: 'Football',
    language: 'English',
    quality: 'HD',
    description: 'Major American sports network with live football, UFC, and global sports coverage.',
    status: 'Official channel',
    websiteUrl: 'https://www.espn.com/watch/'
  },
  {
    name: 'Sky Sports',
    country: 'United Kingdom',
    sport: 'Football',
    language: 'English',
    quality: 'HD',
    description: 'Premier football and live sports coverage across the UK and Europe.',
    status: 'Official channel',
    websiteUrl: 'https://www.sky.com/watch/sky-sports'
  },
  {
    name: 'beIN Sports',
    country: 'Qatar',
    sport: 'Football',
    language: 'Arabic',
    quality: 'HD',
    description: 'Global football and live sports broadcaster for the Middle East and North Africa.',
    status: 'Official channel',
    websiteUrl: 'https://www.bein.com/en/'
  },
  {
    name: 'SuperSport',
    country: 'South Africa',
    sport: 'Football',
    language: 'English',
    quality: 'HD',
    description: 'Leading African sports broadcaster covering football, rugby, and cricket.',
    status: 'Official channel',
    websiteUrl: 'https://www.supersport.com/'
  },
  {
    name: 'DAZN',
    country: 'Germany',
    sport: 'Boxing',
    language: 'German',
    quality: 'HD',
    description: 'Premium sports streaming service with major boxing and football events.',
    status: 'Official channel',
    websiteUrl: 'https://www.dazn.com/'
  },
  {
    name: 'Star Sports',
    country: 'India',
    sport: 'Cricket',
    language: 'Hindi',
    quality: 'HD',
    description: 'Prominent Indian sports broadcaster for cricket and major international events.',
    status: 'Official channel',
    websiteUrl: 'https://www.hotstar.com/in/sports'
  },
  {
    name: 'Eurosport',
    country: 'France',
    sport: 'Cycling',
    language: 'French',
    quality: 'HD',
    description: 'European sports network focused on cycling, tennis, and winter sports.',
    status: 'Official channel',
    websiteUrl: 'https://www.eurosport.com/'
  },
  {
    name: 'NBC Sports',
    country: 'United States',
    sport: 'Basketball',
    language: 'English',
    quality: 'HD',
    description: 'Live coverage of basketball, football, and major US sports events.',
    status: 'Official channel',
    websiteUrl: 'https://www.nbcsports.com/'
  },
  {
    name: 'Canal+ Sport',
    country: 'France',
    sport: 'Football',
    language: 'French',
    quality: 'HD',
    description: 'French sports broadcaster featuring football, motorsport, and rugby coverage.',
    status: 'Official channel',
    websiteUrl: 'https://www.canalplus.com/'
  },
  {
    name: 'Fox Sports',
    country: 'Brazil',
    sport: 'Football',
    language: 'Portuguese',
    quality: 'HD',
    description: 'Brazilian sports service with football and regional live programming.',
    status: 'Official channel',
    websiteUrl: 'https://www.foxsports.com/'
  }
];

const countryFilter = document.getElementById('countryFilter');
const sportFilter = document.getElementById('sportFilter');
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

function formatBadge(text) {
  return text || 'Live';
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
  playerDescription.textContent = `${channel.description} • ${channel.language} • ${channel.quality}`;
  playerCountry.textContent = formatBadge(channel.country);
  playerSport.textContent = formatBadge(channel.sport);

  if (channel.websiteUrl) {
    window.open(channel.websiteUrl, '_blank', 'noopener,noreferrer');
  }

  if (channel.streamUrl && window.Hls && Hls.isSupported()) {
    if (player.hls) {
      player.hls.destroy();
    }

    const hls = new Hls();
    player.hls = hls;
    hls.loadSource(channel.streamUrl);
    hls.attachMedia(player);
    player.play().catch(() => {});
  } else {
    player.removeAttribute('src');
    player.load();
  }
}

function renderChannels() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const countryValue = countryFilter.value;
  const sportValue = sportFilter.value;

  const filtered = channels.filter((channel) => {
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
      (channel) => `
        <article class="card">
          <div class="meta-row">
            <span class="badge">${channel.country}</span>
            <span class="badge">${channel.sport}</span>
          </div>
          <h3>${channel.name}</h3>
          <p>${channel.description}</p>
          <div class="meta-row">
            <span class="badge">${channel.language}</span>
            <span class="badge">${channel.quality}</span>
          </div>
          <div class="card-footer">
            <span>${channel.status}</span>
            <span class="status-pill">●</span>
          </div>
          <button class="watch-btn" type="button" data-channel="${channel.name}">Open source</button>
        </article>
      `
    )
    .join('');

  channelGrid.querySelectorAll('.watch-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = channels.find((channel) => channel.name === button.dataset.channel);
      if (selected) {
        loadChannel(selected);
      }
    });
  });
}

[countryFilter, sportFilter, searchInput].forEach((element) => {
  element.addEventListener('input', renderChannels);
  element.addEventListener('change', renderChannels);
});

populateFilters();
renderChannels();
loadChannel(channels[0]);
