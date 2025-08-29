<?php
// src/api/login.php
header('Content-Type: application/json; charset=utf-8');

// --- CORS (ajustá el origen si querés restringir) ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
header('Vary: Origin');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- include db.php (ajustá ruta si fuera necesario) ---
require_once __DIR__ . '/db.php';

try {
    // Acepta JSON o x-www-form-urlencoded
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $nickname = trim($input['nickname'] ?? ($input['lp'] ?? ''));
    $password = (string) ($input['password'] ?? '');

    if ($nickname === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'nickname y password son obligatorios.']);
        exit;
    }

    // Traer usuario
    $stmt = $pdo->prepare("
    SELECT usuariosid, efectivosid, nickname, password, estado, datos, passwordestado, correoemail
    FROM usuarios
    WHERE nickname = ?
    LIMIT 1
  ");
    $stmt->execute([$nickname]);
    $u = $stmt->fetch();

    if (!$u) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario o contraseña inválidos.']);
        exit;
    }
    if ((int) $u['estado'] !== 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Usuario inactivo.']);
        exit;
    }

    $stored = (string) $u['password'];
    $estado = isset($u['passwordestado']) ? (string) $u['passwordestado'] : null;

    if (!verify_password_compat($password, $stored, $estado)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario o contraseña inválidos.']);
        exit;
    }

    // (Opcional) Rehash a bcrypt/argon2 al iniciar sesión si el guardado es legado
    // define('ENABLE_REHASH_LEGACY', false);
    if (!preg_match('/^\$(2[aby]|argon2(id|i))\$/', $stored)) {
        // if (defined('ENABLE_REHASH_LEGACY') && ENABLE_REHASH_LEGACY) {
        //   $newHash = password_hash($password, PASSWORD_DEFAULT);
        //   $upd = $pdo->prepare("UPDATE usuarios SET password = ?, passwordestado = ? WHERE usuariosid = ?");
        //   $upd->execute([$newHash, 'bcrypt', (int)$u['usuariosid']]);
        // }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login OK',
        'user' => [
            'usuariosid' => (int) $u['usuariosid'],
            'efectivosid' => (int) $u['efectivosid'],
            'nickname' => $u['nickname'],
            'correoemail' => $u['correoemail'],
            'datos' => $u['datos'],
            'passwordestado' => $u['passwordestado'],
        ],
    ]);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    exit;
}

/**
 * Verifica password soportando:
 * - bcrypt/argon2 (password_verify)
 * - MD5 (32 hex)
 * - SHA1 (40 hex)
 * - SHA512 (128 hex) o Base64 (88 chars, termina en ==)
 * - Texto plano (legado)
 * Usará passwordestado si viene (sha512, 512, md5, sha1, bcrypt, argon2, plain)
 */
function verify_password_compat(string $input, string $stored, ?string $estado): bool
{
    $storedTrim = trim($stored);

    // Si passwordestado está definido, respetarlo
    if ($estado !== null && $estado !== '') {
        $alg = strtolower(trim((string) $estado));
        if (strpos($alg, 'bcrypt') !== false || preg_match('/^\$(2[aby])\$/', $storedTrim)) {
            return password_verify($input, $storedTrim);
        }
        if (strpos($alg, 'argon2') !== false || preg_match('/^\$argon2(id|i)\$/', $storedTrim)) {
            return password_verify($input, $storedTrim);
        }
        if ($alg === 'sha512' || $alg === '512' || $alg === 'sha-512') {
            return verify_sha512($input, $storedTrim);
        }
        if ($alg === 'sha1' || $alg === '160' || $alg === 'sha-1') {
            return verify_sha1($input, $storedTrim);
        }
        if ($alg === 'md5' || $alg === '128') {
            return verify_md5($input, $storedTrim);
        }
        if ($alg === 'plain' || $alg === 'texto' || $alg === '0') {
            return hash_equals($storedTrim, $input);
        }
        // si el valor es desconocido, caemos a detección por patrón
    }

    // Detección automática por patrón
    // bcrypt / argon2
    if (preg_match('/^\$(2[aby]|argon2(id|i))\$/', $storedTrim)) {
        return password_verify($input, $storedTrim);
    }
    // SHA512 hex (128 chars) o base64 (88 chars, termina ==)
    if (preg_match('/^[a-f0-9]{128}$/i', $storedTrim) || preg_match('/^[A-Za-z0-9+\/]{86}==$/', $storedTrim)) {
        return verify_sha512($input, $storedTrim);
    }
    // SHA1 hex (40 chars)
    if (preg_match('/^[a-f0-9]{40}$/i', $storedTrim)) {
        return verify_sha1($input, $storedTrim);
    }
    // MD5 hex (32 chars)
    if (preg_match('/^[a-f0-9]{32}$/i', $storedTrim)) {
        return verify_md5($input, $storedTrim);
    }
    // Texto plano (legado)
    return hash_equals($storedTrim, $input);
}

function verify_md5(string $input, string $stored): bool
{
    return hash_equals(strtolower($stored), md5($input));
}
function verify_sha1(string $input, string $stored): bool
{
    return hash_equals(strtolower($stored), sha1($input));
}
function verify_sha512(string $input, string $stored): bool
{
    // Hex de 128 chars
    if (preg_match('/^[a-f0-9]{128}$/i', $stored)) {
        $calc = hash('sha512', $input); // hex minúscula
        return hash_equals(strtolower($stored), $calc);
    }
    // Base64 de 88 chars que termina con ==
    if (preg_match('/^[A-Za-z0-9+\/]{86}==$/', $stored)) {
        $calcB64 = base64_encode(hash('sha512', $input, true)); // hash binario -> base64
        return hash_equals($stored, $calcB64);
    }
    // formato desconocido
    return false;
}
