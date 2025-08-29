<?php
session_start();
$_SESSION = [];
session_destroy();
setcookie(session_name(), '', time() - 3600, '/');
http_response_code(204); // No Content
