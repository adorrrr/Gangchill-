<?php
$urls = [
    'settings' => 'http://127.0.0.1:8000/api/settings',
    'stocks' => 'http://127.0.0.1:8000/api/stocks',
    'investments' => 'http://127.0.0.1:8000/api/investments',
    'blog' => 'http://127.0.0.1:8000/api/blog',
    'single_blog' => 'http://127.0.0.1:8000/api/blog/ilish-mousum-2026-chandpur-theke-dhaka-bazar'
];

foreach ($urls as $name => $url) {
    $res = @file_get_contents($url);
    $status = $http_response_header[0] ?? 'No response';
    $len = strlen((string)$res);
    $json = json_decode((string)$res, true);
    $success = isset($json['success']) ? ($json['success'] ? 'true' : 'false') : 'N/A';
    echo "[$name] $status | success=$success | len=$len\n";
    if ($name === 'single_blog' && isset($json['data']['content'])) {
        $contentType = gettype($json['data']['content']);
        $blockCount = is_array($json['data']['content']) ? count($json['data']['content']) : 'not array';
        echo "   -> content type: $contentType, blockCount: $blockCount\n";
    }
}
