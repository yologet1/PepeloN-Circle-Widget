<?php
header('Access-Control-Allow-Origin: *');
$id = $_GET['to'] ?? '';
$f = __DIR__ . '/push_' . $id . '.txt';
if (!file_exists($f)) { echo ''; exit; }
echo file_get_contents($f);
unlink($f);
