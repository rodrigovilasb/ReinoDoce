<?php
function getPDO() {
    $host = "localhost";
    $port = "3306";
    $user = "root";
    $senha = "root";
    $banco = "reinodoce";
    
    try {
        $conn = new PDO('mysql:host='.$host.';port='.$port.';dbname='.$banco, $user, $senha);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch(PDOException $e) {
        throw new Exception('Erro de conexão com banco: ' . $e->getMessage());
    }
}
?>
