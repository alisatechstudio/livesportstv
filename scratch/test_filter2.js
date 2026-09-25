async function test() {
  const m3uRes = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u');
  const text = await m3uRes.text();
  const visitorCountry = 'BD'; // test visitor from Bangladesh

  const lines = text.split('\n');
  let channels = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;
    let streamUrl = '';
    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j].trim();
      if (candidate.startsWith('#EXTINF:')) break;
      if (candidate && !candidate.startsWith('#')) { streamUrl = candidate; break; }
    }
    // Remove non-streaming: must have streamUrl, must be http/https
    if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) continue;

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const id = tvgIdMatch ? tvgIdMatch[1] : '';
    const lastComma = line.lastIndexOf(',');
    let rawName = lastComma !== -1 ? line.slice(lastComma + 1).trim() : '';

    const isGeo = /\[geo-blocked\]/i.test(line) || /\[geo-blocked\]/i.test(rawName);

    // Country extraction
    const ccMatch = id.match(/\.([a-zA-Z]{2})(@|$)/);
    const country = ccMatch ? ccMatch[1].toUpperCase() : 'INT';

    // Filter out geo-blocked channels not matching visitor's location!
    if (isGeo && visitorCountry && country !== 'INT' && country !== visitorCountry) {
      continue; // Geo-blocked for this visitor!
    }

    // Clean name
    rawName = rawName.replace(/\[geo-blocked\]/gi, '').trim();

    channels.push({ id, name: rawName, country, streamUrl, isGeo });
  }

  console.log(`With visitorCountry = ${visitorCountry}:`);
  console.log('Active streaming channels available:', channels.length);
  console.log('Sample channels:', channels.slice(0, 5).map(c => ({ id: c.id, name: c.name, country: c.country })));
}
test().catch(console.error);
