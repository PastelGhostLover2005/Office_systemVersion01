<?php
// supplies.php (replace your current file)
date_default_timezone_set('UTC');
$logfile = __DIR__ . "/debug.log";

// log request (append)
$rawInput = file_get_contents("php://input");
file_put_contents($logfile, "[".date('Y-m-d H:i:s')."] REQUEST_URI: ".($_SERVER['REQUEST_URI'] ?? '').
    " GET:".print_r($_GET, true).
    " INPUT_RAW: ". $rawInput . PHP_EOL, FILE_APPEND);

header("Content-Type: application/json; charset=utf-8");

try {
    $pdo = new PDO("mysql:host=localhost;port=3307;dbname=office_inventory", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $action = $_GET['action'] ?? '';

    if ($action === 'list') {
        $stmt = $pdo->query("SELECT * FROM supplies ORDER BY supply_id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    // for other actions, parse JSON body
    $data = json_decode($rawInput, true);
    if ($data === null && $action !== 'list') {
        http_response_code(400);
        $err = ["success" => false, "error" => "Invalid JSON input or empty body", "raw" => $rawInput];
        echo json_encode($err);
        file_put_contents($logfile, "[".date('Y-m-d H:i:s')."] INVALID_JSON: ". $rawInput . PHP_EOL, FILE_APPEND);
        exit;
    }

    if ($action === 'add') {
        if (!isset($data['item_name']) || !isset($data['quantity'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Missing item_name or quantity"]);
            exit;
        }
        $stmt = $pdo->prepare("INSERT INTO supplies (item_name, quantity) VALUES (?, ?)");
        $stmt->execute([$data['item_name'], $data['quantity']]);
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'edit') {
        if (!isset($data['supply_id'], $data['item_name'], $data['quantity'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Missing supply_id, item_name or quantity"]);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE supplies SET item_name = ?, quantity = ? WHERE supply_id = ?");
        $stmt->execute([$data['item_name'], $data['quantity'], $data['supply_id']]);
        echo json_encode(["success" => true]);
        exit;
    }

    if ($action === 'delete') {
        if (!isset($data['supply_id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Missing supply_id"]);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM supplies WHERE supply_id = ?");
        $stmt->execute([$data['supply_id']]);
        echo json_encode(["success" => true]);
        exit;
    }

    echo json_encode(["success" => false, "error" => "Invalid action"]);
} catch (Exception $e) {
    http_response_code(500);
    $msg = $e->getMessage();
    file_put_contents($logfile, "[".date('Y-m-d H:i:s')."] EXCEPTION: ".$msg.PHP_EOL, FILE_APPEND);
    echo json_encode(["success" => false, "error" => $msg]);
}
