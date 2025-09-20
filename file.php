<?php
$code = $_GET['code'] ?? '';
$files = json_decode(file_get_contents(__DIR__ . '/files1.json'), true);

if (!$code || !isset($files[$code])) {
    http_response_code(404); echo 'Not found'; exit;
}
$filename = $files[$code];
$filepath = __DIR__ . '/c/' . $filename;
if (!file_exists($filepath)) {
    http_response_code(404); echo 'Not found'; exit;
}
$mime = mime_content_type($filepath);
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($filepath));
readfile($filepath);
exit;
?>
