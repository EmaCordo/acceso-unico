<?php
// api/sistemas.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/db.php'; // reutiliza tu conexión PDO ($pdo)

// Parámetros
$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$page = max(1, (int) ($_GET['page'] ?? 1));
$pageSz = max(1, min(100, (int) ($_GET['pageSize'] ?? 25)));
$sort = $_GET['sort'] ?? 'sistemasid'; // columna
$dir = strtoupper($_GET['dir'] ?? 'ASC'); // ASC|DESC
$estado = isset($_GET['estado']) ? trim($_GET['estado']) : ''; // opcional: filtrar por estado

// Lista de columnas permitidas para ordenar
$whitelist = ['sistemasid', 'descripcion', 'hostingpublico', 'hostinglocal', 'estado'];
if (!in_array($sort, $whitelist, true)) {
    $sort = 'sistemasid';
}
if ($dir !== 'ASC' && $dir !== 'DESC') {
    $dir = 'ASC';
}

$offset = ($page - 1) * $pageSz;

try {
    // Filtros (búsqueda y estado)
    $whereParts = [];
    $params = [];
    if ($q !== '') {
        $whereParts[] = 'descripcion LIKE :q';
        $params[':q'] = "%$q%";
    }
    if ($estado !== '' && $estado !== 'all') {
        $whereParts[] = 'estado = :estado';
        $params[':estado'] = (int) $estado;
    }
    $whereSql = $whereParts ? ('WHERE ' . implode(' AND ', $whereParts)) : '';

    // Total para paginar
    $stmtCount = $pdo->prepare("SELECT COUNT(*) AS total FROM sistemas $whereSql");
    $stmtCount->execute($params);
    $total = (int) $stmtCount->fetchColumn();

    // Datos
    $sql = "SELECT sistemasid, descripcion, hostingpublico, hostinglocal, estado
            FROM sistemas
            $whereSql
            ORDER BY $sort $dir
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $k === ':estado' ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $pageSz, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $rows,
        'page' => $page,
        'pageSize' => $pageSz,
        'total' => $total,
        'sort' => $sort,
        'dir' => $dir,
        'query' => $q,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}