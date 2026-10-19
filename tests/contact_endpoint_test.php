<?php
declare(strict_types=1);
define('CONTACT_FORM_TEST', true);
require __DIR__ . '/../static-site/contact/send.php';

function expect(bool $ok, string $label): void {
    if (!$ok) throw new RuntimeException($label);
}
$valid = ['name' => 'Visitor', 'email' => 'visitor@example.com', 'message' => 'Hello'];
expect(contact_payload($valid) !== null, 'Accept valid visitor input');
expect(contact_payload(array_merge($valid, ['email' => "visitor@example.com\r\nBcc: other@example.com"])) === null, 'Reject header injection');
expect(contact_payload(array_merge($valid, ['subject' => "Quote\nBcc: other@example.com"])) === null, 'Reject subject injection');
expect(contact_payload(array_merge($valid, ['email' => 'invalid'])) === null, 'Reject invalid email');
expect(contact_payload(array_merge($valid, ['message' => str_repeat('a', 10001)])) === null, 'Bound message size');
expect(contact_payload(array_merge($valid, ['name' => ['array']])) === null, 'Reject unexpected arrays');
expect(contact_payload(array_merge($valid, ['message' => '  '])) === null, 'Reject empty message');

$_SERVER = ['REQUEST_METHOD' => 'GET'];
ob_start(); contact_main(); $body = json_decode(ob_get_clean(), true);
expect(http_response_code() === 405 && $body['success'] === false, 'GET cannot send email');
$_SERVER = ['REQUEST_METHOD' => 'POST', 'HTTP_ORIGIN' => 'https://other.example'];
ob_start(); contact_main(); $body = json_decode(ob_get_clean(), true);
expect(http_response_code() === 403 && $body['success'] === false, 'Reject other origins');
$_SERVER = ['REQUEST_METHOD' => 'POST', 'HTTP_ORIGIN' => 'https://madebyjigg.com', 'CONTENT_LENGTH' => '50000'];
ob_start(); contact_main(); $body = json_decode(ob_get_clean(), true);
expect(http_response_code() === 413 && $body['success'] === false, 'Reject excessive body before parsing');
echo "Contact endpoint validation passed\n";
