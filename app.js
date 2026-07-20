const channels = [
  {
    name: 'Goal Rush TV',
    country: 'United Kingdom',
    sport: 'Football',
    language: 'English',
    quality: 'HD',
    description: 'Fast-paced football coverage with match highlights and live commentary.',
    status: 'Live now'
  },
  {
    name: 'Arena Sport',
    country: 'Spain',
    sport: 'Basketball',
    language: 'Spanish',
    quality: 'HD',
    description: 'Basketball action from top domestic and international leagues.',
    status: 'Live now'
  },
  {
    name: 'Vibe Sports',
    country: 'Brazil',
    sport: 'Volleyball',
    language: 'Portuguese',
    quality: 'SD',
    description: 'A vibrant channel for volleyball, beach sports, and regional events.',
    status: 'Updated'
  },
  {
    name: 'Nile League',
    country: 'Egypt',
    sport: 'Football',
    language: 'Arabic',
    quality: 'HD',
    description: 'Regional football coverage with strong commentary and match recaps.',
    status: 'Live now'
  },
  {
    name: 'Urban Track',
    country: 'United States',
    sport: 'Athletics',
    language: 'English',
    quality: 'HD',
    description: 'Track, field, and sprint events from major competitions around the globe.',
    status: 'Live now'
  },
  {
    name: 'Rally Pulse',
    country: 'Germany',
    sport: 'Motorsport',
    language: 'German',
    quality: 'HD',
    description: 'Motorsport highlights, races, and behind-the-scenes features.',
    status: 'Live now'
  },
  {
    name: 'Champions Arena',
    country: 'India',
    sport: 'Cricket',
    language: 'Hindi',
    quality: 'HD',
    description: 'Cricket coverage with commentary tailored for passionate fans.',
    status: 'Updated'
  },
  {
    name: 'Pulse Net',
    country: 'Nigeria',
    sport: 'Boxing',
    language: 'English',
    quality: 'SD',
    description: 'Boxing and combat sports content from local and international events.',
    status: 'Live now'
  }
];

const countryFilter = document.getElementById('countryFilter');
const sportFilter = document.getElementById('sportFilter');
const searchInput = document.getElementById('searchInput');
const channelGrid = document.getElementById('channelGrid');
const totalChannels = document.getElementById('totalChannels');
const totalCountries = document.getElementById('totalCountries');
const totalSports = document.getElementById('totalSports');

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
        </article>
      `
    )
    .join('');
}

[countryFilter, sportFilter, searchInput].forEach((element) => {
  element.addEventListener('input', renderChannels);
  element.addEventListener('change', renderChannels);
});

populateFilters();
renderChannels();
