const fs = require('fs');

async function benchmark() {
  const m3uRes = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u');
  const text = await m3uRes.text();
  const visitorCountry = 'BD';

  const t0 = performance.now();
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
    if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) continue;

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const id = tvgIdMatch ? tvgIdMatch[1] : '';
    const lastComma = line.lastIndexOf(',');
    let rawName = lastComma !== -1 ? line.slice(lastComma + 1).trim() : '';

    const isGeo = /\[geo-blocked\]/i.test(line) || /\[geo-blocked\]/i.test(rawName);
    const ccMatch = id.match(/\.([a-zA-Z]{2})(@|$)/);
    const country = ccMatch ? ccMatch[1].toUpperCase() : 'INT';

    if (isGeo && visitorCountry && country !== 'INT' && country !== visitorCountry) continue;

    rawName = rawName.replace(/\[geo-blocked\]/gi, '').trim();
    channels.push({ id, name: rawName, country, streamUrl, logo: '' });
  }
  const tParse = performance.now();
  console.log('Parse time:', (tParse - t0).toFixed(2), 'ms for', channels.length, 'channels');

  // Test caching JSON stringify & parse
  const cacheObj = { timestamp: Date.now(), visitorCountry, channels };
  const str = JSON.stringify(cacheObj);
  console.log('Cache payload size:', (str.length / 1024).toFixed(1), 'KB');

  const t1 = performance.now();
  const restored = JSON.parse(str);
  const t2 = performance.now();
  console.log('Instant restore from cache time:', (t2 - t1).toFixed(2), 'ms!');
}

benchmark().catch(console.error);
