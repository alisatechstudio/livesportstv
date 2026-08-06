<?php
define('M3U_URL', 'https://iptv-org.github.io/iptv/index.m3u');
define('COUNTRIES_URL', 'https://iptv-org.github.io/api/countries.json');
define('LANGUAGES_URL', 'https://iptv-org.github.io/api/languages.json');
define('CACHE_DIR', __DIR__ . '/../cache');
define('CACHE_TTL', 3600);
define('SITE_URL', 'https://livesportstv.store');
define('SITE_NAME', 'AlisaTV');

function get_cached($key) {
    $file = CACHE_DIR . '/' . $key . '.cache';
    if (file_exists($file) && (time() - filemtime($file)) < CACHE_TTL) {
        return json_decode(file_get_contents($file), true);
    }
    return false;
}

function set_cached($key, $data) {
    $file = CACHE_DIR . '/' . $key . '.cache';
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function fetch_url($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'AlisaTV/1.0',
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($httpCode !== 200 || $response === false) {
        return false;
    }
    return $response;
}