<?php
header('Access-Control-Allow-Origin: *');
$data = json_decode(file_get_contents("php://input"), true);
if (!$data['to'] || !$data['link']) die('ERR');
$f = __DIR__ . '/push_' . $data['to'] . '.txt';
file_put_contents($f, $data['link']);
echo 'OK';
