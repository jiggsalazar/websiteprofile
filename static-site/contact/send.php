<?php
declare(strict_types=1);

// Fixed recipient and fixed upstream URL: never an arbitrary email/HTTP relay.
function contact_payload(array $input): ?array {
    $limits = ['name' => 120, 'email' => 254, 'service' => 120,
               'subject' => 180, 'message' => 10000, '_honey' => 200];
    $fields = [];
    foreach ($limits as $key => $limit) {
        if (isset($input[$key]) && !is_string($input[$key])) return null;
        $fields[$key] = trim($input[$key] ?? '');
        if (strlen($fields[$key]) > $limit) return null;
    }
    if ($fields['name'] === '' || $fields['message'] === '' ||
        !filter_var($fields['email'], FILTER_VALIDATE_EMAIL) ||
        preg_match('/[\r\n]/', $fields['email'] . $fields['subject'] . $fields['name'])) return null;
    return $fields;
}

function contact_response(int $code, bool $success, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['success' => $success, 'message' => $message]);
}

function contact_rate_allowed(string $ip): bool {
    // No message contents or raw IP addresses are written to disk.
    // One bounded file, outside the web directory, avoids unbounded per-IP files.
    $dir = sys_get_temp_dir() . '/madebyjigg-contact';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) return false;
    $file = @fopen($dir . '/rate-limits.json', 'c+');
    if (!$file || !flock($file, LOCK_EX)) { if ($file) fclose($file); return false; }
    $now = time();
    $data = json_decode(stream_get_contents($file), true) ?: [];
    foreach ($data as $key => $entry) {
        if ($entry['until'] <= $now) unset($data[$key]);
    }
    $key = hash('sha256', $ip);
    $entry = $data[$key] ?? ['count' => 0, 'until' => $now + 600];
    $allowed = $entry['count'] < 5 && (isset($data[$key]) || count($data) < 2000);
    if ($allowed) { $entry['count']++; $data[$key] = $entry; }
    rewind($file);
    ftruncate($file, 0);
    $written = fwrite($file, json_encode($data));
    fflush($file);
    flock($file, LOCK_UN);
    fclose($file);
    return $allowed && $written !== false;
}

function contact_main(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        contact_response(405, false, 'Use the contact form to send a message.');
        return;
    }
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== 'https://madebyjigg.com') {
        contact_response(403, false, 'Please submit from madebyjigg.com.');
        return;
    }
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) {
        contact_response(413, false, 'Message is too long.');
        return;
    }
    // Read a bounded body even if the server did not provide Content-Length.
    $raw = file_get_contents('php://input', false, null, 0, 32769);
    if ($raw === false || strlen($raw) > 32768) {
        contact_response(413, false, 'Message is too long.');
        return;
    }
    parse_str($raw, $input);
    $fields = contact_payload($input);
    if (!$fields) { contact_response(422, false, 'Please check your name, email and message.'); return; }
    if ($fields['_honey'] !== '') { contact_response(422, false, 'Submission not accepted.'); return; }
    if (!contact_rate_allowed($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
        header('Retry-After: 600');
        contact_response(429, false, 'Please wait before submitting again, or use email or Messenger.');
        return;
    }
    if (!function_exists('curl_init')) {
        contact_response(503, false, 'Email service is temporarily unavailable.');
        return;
    }
    unset($fields['_honey']);
    $payload = array_merge($fields, [
        '_subject' => $fields['subject'] ?: 'New website inquiry from ' . $fields['name'],
        '_replyto' => $fields['email'], '_captcha' => 'false', '_template' => 'table',
        '_url' => 'https://madebyjigg.com/contact/'
    ]);
    $curl = curl_init('https://formsubmit.co/ajax/jiggsalazar89@gmail.com');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_REFERER => 'https://madebyjigg.com/',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false
    ]);
    $body = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    $result = is_string($body) ? json_decode($body, true) : null;
    $accepted = $code >= 200 && $code < 300 && is_array($result) &&
        (($result['success'] ?? null) === true || ($result['success'] ?? null) === 'true');
    contact_response($accepted ? 200 : 502, $accepted,
        $accepted ? 'Message submitted successfully.' : 'We could not confirm email submission. Please use email or Messenger.');
}

// Allows validation tests without sending real messages.
if (!defined('CONTACT_FORM_TEST')) contact_main();
