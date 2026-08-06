import os
import json
import re
import time
import urllib.request
import urllib.error
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.conf import settings


CATEGORY_MAP = {
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
}


def get_cached(key):
    filepath = settings.CACHE_DIR / (key + '.cache')
    if filepath.exists() and (time.time() - filepath.stat().st_mtime) < settings.CACHE_TTL:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return False
    return False


def set_cached(key, data):
    filepath = settings.CACHE_DIR / (key + '.cache')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))


def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'AlisaTV/1.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                return resp.read().decode('utf-8', errors='replace')
    except (urllib.error.URLError, urllib.error.HTTPError, OSError):
        pass
    return False


def parse_m3u(m3u_text, country_map, lang_name):
    lines = m3u_text.split('\n')
    channels = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line.startswith('#EXTINF:'):
            continue
        next_idx = i + 1
        if next_idx >= len(lines):
            continue
        next_line = lines[next_idx].strip()
        if not next_line or next_line.startswith('#') or not next_line.endswith('.m3u8'):
            continue

        group_match = re.search(r'group-title="([^"]*)"', line)
        category = group_match.group(1) if group_match else 'General'

        tvg_id_match = re.search(r'tvg-id="([^"]*)"', line)
        channel_id = tvg_id_match.group(1) if tvg_id_match else 'ch-' + str(len(channels))

        name_match = re.search(r',(.+)$', line)
        name = name_match.group(1).strip() if name_match else 'Unknown'

        logo_match = re.search(r'tvg-logo="([^"]*)"', line)
        logo = logo_match.group(1) if logo_match else ''

        cc_match = re.search(r'\.([a-zA-Z]{2})(@|$)', channel_id)
        country = cc_match.group(1).upper() if cc_match else 'INT'

        langs_for_country = country_map.get(country, {}).get('languages', []) or []
        languages = [
            lang_name.get(code, code)
            for code in langs_for_country
            if code in lang_name
        ]

        channels.append({
            'id': channel_id,
            'name': name,
            'category': category,
            'country': country,
            'languages': languages,
            'language': languages[0] if languages else 'Unknown',
            'logo': logo,
            'streamUrl': next_line,
        })

    channels.sort(key=lambda c: 0 if c['country'] != 'INT' else 1)

    return {
        'channels': channels,
        'count': len(channels),
        'countries': len(set(c['country'] for c in channels)),
        'categories': len(set(c['category'] for c in channels)),
    }


def index(request):
    channels_data = get_cached('channels')
    if channels_data is False:
        m3u_text = fetch_url(settings.M3U_URL)
        if m3u_text is not False:
            countries_data = get_cached('countries')
            if countries_data is False:
                countries_text = fetch_url(settings.COUNTRIES_URL)
                if countries_text is not False:
                    countries_data = json.loads(countries_text) if countries_text else []
                    set_cached('countries', countries_data)
            if countries_data is None:
                countries_data = []

            langs_data = get_cached('languages')
            if langs_data is False:
                langs_text = fetch_url(settings.LANGUAGES_URL)
                if langs_text is not False:
                    langs_data = json.loads(langs_text) if langs_text else []
                    set_cached('languages', langs_data)
            if langs_data is None:
                langs_data = []

            country_map = {}
            for c in countries_data:
                country_map[c.get('code', '')] = {
                    'name': c.get('name', ''),
                    'flag': c.get('flag', ''),
                    'languages': c.get('languages', []),
                }

            lang_name = {}
            for l in langs_data:
                lang_name[l.get('code', '')] = l.get('name', '')

            channels_data = parse_m3u(m3u_text, country_map, lang_name)
            set_cached('channels', channels_data)

    channels_json = json.dumps(channels_data.get('channels', []), ensure_ascii=False) if channels_data else '[]'
    return render(request, 'channels/index.html', {
        'channels_json': channels_json,
        'channels_data': channels_data,
        'site_name': settings.SITE_NAME,
        'site_url': settings.SITE_URL,
    })


def api_channels(request):
    channels_data = get_cached('channels')
    if channels_data is not False:
        return JsonResponse(channels_data)

    m3u_text = fetch_url(settings.M3U_URL)
    if m3u_text is False:
        return JsonResponse({'error': 'Failed to fetch channel data'}, status=502)

    countries_data = get_cached('countries')
    if countries_data is False:
        countries_text = fetch_url(settings.COUNTRIES_URL)
        if countries_text is not False:
            countries_data = json.loads(countries_text) if countries_text else []
            set_cached('countries', countries_data)
    if countries_data is None:
        countries_data = []

    langs_data = get_cached('languages')
    if langs_data is False:
        langs_text = fetch_url(settings.LANGUAGES_URL)
        if langs_text is not False:
            langs_data = json.loads(langs_text) if langs_text else []
            set_cached('languages', langs_data)
    if langs_data is None:
        langs_data = []

    country_map = {}
    for c in countries_data:
        country_map[c.get('code', '')] = {
            'name': c.get('name', ''),
            'flag': c.get('flag', ''),
            'languages': c.get('languages', []),
        }

    lang_name = {}
    for l in langs_data:
        lang_name[l.get('code', '')] = l.get('name', '')

    result = parse_m3u(m3u_text, country_map, lang_name)
    set_cached('channels', result)
    return JsonResponse(result)