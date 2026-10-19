<?php
/*
 * TCMB kur köprüsü — arac-kutusu.html ile aynı klasöre koy.
 * Merkez Bankası'nın günlük kur dosyasını (today.xml) sunucunda okur ve sayfaya iletir.
 * Sonucu 10 dakika önbellekte tutar; TCMB'ye ulaşılamazsa son kaydı döndürür.
 */
header('Content-Type: application/xml; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=600');

$url   = 'https://www.tcmb.gov.tr/kurlar/today.xml';
$cache = sys_get_temp_dir() . '/tcmb_today_cache.xml';
$ttl   = 600; // saniye

if (is_file($cache) && (time() - filemtime($cache)) < $ttl) {
    readfile($cache);
    exit;
}

$xml = false;
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (AracKutusu kur okuyucu)',
    ]);
    $xml = curl_exec($ch);
    if (curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 200) $xml = false;
    curl_close($ch);
}
if ($xml === false && ini_get('allow_url_fopen')) {
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'user_agent' => 'Mozilla/5.0 (AracKutusu kur okuyucu)']]);
    $xml = @file_get_contents($url, false, $ctx);
}

if ($xml !== false && strpos($xml, '<Currency') !== false) {
    @file_put_contents($cache, $xml);
    echo $xml;
    exit;
}

if (is_file($cache)) { readfile($cache); exit; }

http_response_code(502);
echo '<error>TCMB kurlarına ulaşılamadı</error>';
