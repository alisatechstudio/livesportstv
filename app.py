import os
import json
import re
import time
import urllib.request
import urllib.error
from flask import Flask, render_template, jsonify, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='/static')

M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u'
COUNTRIES_URL = 'https://iptv-org.github.io/api/countries.json'
LANGUAGES_URL = 'https://iptv-org.github.io/api/languages.json'
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
CACHE_TTL = 3600
SITE_URL = 'https://livesportstv.store'
SITE_NAME = 'AlisaTV'

os.makedirs(CACHE_DIR, exist_ok=True)

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
    filepath = os.path.join(CACHE_DIR, key + '.cache')
    if os.path.exists(filepath) and (time.time() - os.path.getmtime(filepath)) < CACHE_TTL:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return False
    return False


def set_cached(key, data):
    filepath = os.path.join(CACHE_DIR, key + '.cache')
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


@app.route('/')
def index():
    channels_data = get_cached('channels')
    if channels_data is False:
        m3u_text = fetch_url(M3U_URL)
        if m3u_text is not False:
            countries_data = get_cached('countries')
            if countries_data is False:
                countries_text = fetch_url(COUNTRIES_URL)
                if countries_text is not False:
                    countries_data = json.loads(countries_text) if countries_text else []
                    set_cached('countries', countries_data)
            if countries_data is None:
                countries_data = []

            langs_data = get_cached('languages')
            if langs_data is False:
                langs_text = fetch_url(LANGUAGES_URL)
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
    return render_template('index.html', channels_json=channels_json, channels_data=channels_data)


@app.route('/api/channels')
def api_channels():
    channels_data = get_cached('channels')
    if channels_data is not False:
        return jsonify(channels_data)

    m3u_text = fetch_url(M3U_URL)
    if m3u_text is False:
        return jsonify({'error': 'Failed to fetch channel data'}), 502

    countries_data = get_cached('countries')
    if countries_data is False:
        countries_text = fetch_url(COUNTRIES_URL)
        if countries_text is not False:
            countries_data = json.loads(countries_text) if countries_text else []
            set_cached('countries', countries_data)
    if countries_data is None:
        countries_data = []

    langs_data = get_cached('languages')
    if langs_data is False:
        langs_text = fetch_url(LANGUAGES_URL)
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
    return jsonify(result)


@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)


@app.route('/freetv.css')
def serve_css():
    return send_from_directory(app.static_folder, 'css/freetv.css')


@app.route('/freetv.js')
def serve_js():
    return send_from_directory(app.static_folder, 'js/freetv.js')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)