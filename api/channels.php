<?php
require_once __DIR__ . '/../includes/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=600');

$cached = get_cached('channels');
if ($cached !== false) {
    echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$m3uText = fetch_url(M3U_URL);
if ($m3uText === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch channel data']);
    exit;
}

$countries = get_cached('countries');
if ($countries === false) {
    $countriesText = fetch_url(COUNTRIES_URL);
    if ($countriesText !== false) {
        $countries = json_decode($countriesText, true) ?: [];
        set_cached('countries', $countries);
    } else {
        $countries = [];
    }
}

$langs = get_cached('languages');
if ($langs === false) {
    $langsText = fetch_url(LANGUAGES_URL);
    if ($langsText !== false) {
        $langs = json_decode($langsText, true) ?: [];
        set_cached('languages', $langs);
    } else {
        $langs = [];
    }
}

$countryMap = [];
foreach ($countries as $c) {
    $countryMap[$c['code']] = [
        'name' => $c['name'],
        'flag' => $c['flag'] ?? '',
        'languages' => $c['languages'] ?? [],
    ];
}

$langName = [];
foreach ($langs as $l) {
    $langName[$l['code']] = $l['name'];
}

$lines = explode("\n", $m3uText);
$channels = [];
for ($i = 0; $i < count($lines); $i++) {
    $line = trim($lines[$i]);
    if (strpos($line, '#EXTINF:') !== 0) continue;
    $next = isset($lines[$i + 1]) ? trim($lines[$i + 1]) : '';
    if (!$next || strpos($next, '#') === 0 || substr($next, -6) !== '.m3u8') continue;

    $group = [];
    preg_match('/group-title="([^"]*)"/', $line, $group);
    $category = $group[1] ?? 'General';

    $tvgId = [];
    preg_match('/tvg-id="([^"]*)"/', $line, $tvgId);
    $id = $tvgId[1] ?? 'ch-' . count($channels);

    $name = (preg_match('/,(.+)$/', $line, $m) ? $m[1] : 'Unknown');
    $logo = (preg_match('/tvg-logo="([^"]*)"/', $line, $m) ? $m[1] : '');

    $cc = [];
    preg_match('/\.([a-zA-Z]{2})(@|$)/', $id, $cc);
    $country = $cc ? strtoupper($cc[1]) : 'INT';

    $langsForCountry = ($countryMap[$country]['languages'] ?? []) ?: [];
    $languages = array_filter(array_map(function ($code) use ($langName) {
        return $langName[$code] ?? $code;
    }, $langsForCountry));

    $channels[] = [
        'id' => $id,
        'name' => trim($name),
        'category' => $category,
        'country' => $country,
        'languages' => array_values($languages),
        'language' => ($languages[0] ?? 'Unknown'),
        'logo' => $logo,
        'streamUrl' => $next,
    ];
}

usort($channels, function ($a, $b) {
    return ($a['country'] === 'INT') - ($b['country'] === 'INT');
});

$result = [
    'channels' => $channels,
    'count' => count($channels),
    'countries' => count(array_unique(array_column($channels, 'country'))),
    'categories' => count(array_unique(array_map(function ($c) {
        return $c['category'];
    }, $channels))),
];

set_cached('channels', $result);
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);