<?php
header('Content-Type: application/json; charset=utf-8');

// carrega função de conexão
require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Payload inválido.']);
    exit;
}

$cliente = $input['cliente'] ?? null;
$itens = $input['itens'] ?? [];
$total = $input['total'] ?? 0.0;

if (!$cliente || !is_array($itens) || count($itens) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Dados do pedido incompletos.']);
    exit;
}

$pdo = null;

try {
    $pdo = getPDO();
    $pdo->beginTransaction();

    // 1) Inserir endereço (guardamos o campo endereco inteiro em logradouro)
    $stmtEnd = $pdo->prepare("INSERT INTO Endereco (logradouro, cep) VALUES (:logradouro, :cep)");
    $stmtEnd->execute([
        ':logradouro' => $cliente['endereco'] ?? '',
        ':cep' => $cliente['cep'] ?? ''
    ]);
    $id_end = $pdo->lastInsertId();

    // 2) Inserir cliente (schema exige cpf_cnpj_cli NOT NULL UNIQUE) -> usamos placeholder único
    $placeholderCpf = 'WEB' . time(); // garante unicidade; substitua por CPF real se tiver
    $stmtCli = $pdo->prepare("INSERT INTO Cliente (nome_cli, cpf_cnpj_cli, telefone_cli, email_cli, id_end) VALUES (:nome, :cpf, :telefone, :email, :id_end)");
    $stmtCli->execute([
        ':nome' => $cliente['nome'] ?? '',
        ':cpf' => $placeholderCpf,
        ':telefone' => $cliente['telefone'] ?? '',
        ':email' => $cliente['email'] ?? '',
        ':id_end' => $id_end
    ]);
    $id_cli = $pdo->lastInsertId();

    // 3) Criar Pedido_Venda
    $stmtPed = $pdo->prepare("INSERT INTO Pedido_Venda (id_cli, data_pedido, status_pedido) VALUES (:id_cli, CURDATE(), 'faturado')");
    $stmtPed->execute([':id_cli' => $id_cli]);
    $id_pedv = $pdo->lastInsertId();

    // 4) Inserir itens do pedido (busca produto por nome; se não existir, cria)
    $stmtFindProd = $pdo->prepare("SELECT id_prod FROM Produto WHERE nome_prod = :nome LIMIT 1");
    $stmtCreateProd = $pdo->prepare("INSERT INTO Produto (nome_prod, descricao_prod, preco_venda, unidade) VALUES (:nome, :desc, :preco, :unidade)");
    $stmtPedItem = $pdo->prepare("INSERT INTO Pedido_Venda_Item (id_pedv, id_prod, quantidade, preco_unit, subtotal) VALUES (:id_pedv, :id_prod, :quantidade, :preco_unit, :subtotal)");
    $stmtEst = $pdo->prepare("INSERT INTO Estoque (id_prod, tipo_mov, quantidade, data_mov, origem_mov, observacao) VALUES (:id_prod, 'saida', :quantidade, CURDATE(), :origem, :obs)");

    $valorTotalCalc = 0.0;
    foreach ($itens as $it) {
        $nomeProd = $it['nome'];
        $quantidade = (int)$it['quantidade'];
        $preco_unit = (float)$it['preco_unit'];

        // procura produto
        $stmtFindProd->execute([':nome' => $nomeProd]);
        $prod = $stmtFindProd->fetch();

        if ($prod) {
            $id_prod = $prod['id_prod'];
        } else {
            // cria produto mínimo
            $stmtCreateProd->execute([
                ':nome' => $nomeProd,
                ':desc' => '',
                ':preco' => $preco_unit,
                ':unidade' => 'un'
            ]);
            $id_prod = $pdo->lastInsertId();
        }

        $subtotal = $preco_unit * $quantidade;
        $valorTotalCalc += $subtotal;

        $stmtPedItem->execute([
            ':id_pedv' => $id_pedv,
            ':id_prod' => $id_prod,
            ':quantidade' => $quantidade,
            ':preco_unit' => $preco_unit,
            ':subtotal' => $subtotal
        ]);

        // registra saída de estoque
        $stmtEst->execute([
            ':id_prod' => $id_prod,
            ':quantidade' => $quantidade,
            ':origem' => 'Venda Web',
            ':obs' => "Pedido $id_pedv"
        ]);
    }

    // 5) Inserir Nota_Fiscal
    $numero_nf = rand(100000, 999999);
    $serie_nf = 'A';
    $stmtNF = $pdo->prepare("INSERT INTO Nota_Fiscal (numero_nf, serie_nf, id_cli, id_pedv, data_emissao, valor_total, status_nf) VALUES (:numero_nf, :serie_nf, :id_cli, :id_pedv, NOW(), :valor_total, 'emitida')");
    $stmtNF->execute([
        ':numero_nf' => $numero_nf,
        ':serie_nf' => $serie_nf,
        ':id_cli' => $id_cli,
        ':id_pedv' => $id_pedv,
        ':valor_total' => $valorTotalCalc
    ]);
    $id_nf = $pdo->lastInsertId();

    // 6) Inserir itens da nota
    $stmtNFItem = $pdo->prepare("INSERT INTO Nota_Fiscal_Item (id_nf, id_prod, quantidade, preco_unit, subtotal) VALUES (:id_nf, :id_prod, :quantidade, :preco_unit, :subtotal)");
    // obter os itens do pedido inseridos (ou reutilizar array acima)
    foreach ($itens as $it) {
        $nomeProd = $it['nome'];
        $quantidade = (int)$it['quantidade'];
        $preco_unit = (float)$it['preco_unit'];

        $stmtFindProd->execute([':nome' => $nomeProd]);
        $prod = $stmtFindProd->fetch();
        $id_prod = $prod ? $prod['id_prod'] : null;
        $subtotal = $preco_unit * $quantidade;

        if ($id_prod) {
            $stmtNFItem->execute([
                ':id_nf' => $id_nf,
                ':id_prod' => $id_prod,
                ':quantidade' => $quantidade,
                ':preco_unit' => $preco_unit,
                ':subtotal' => $subtotal
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'id_pedv' => (int)$id_pedv,
        'id_nf' => (int)$id_nf,
        'numero_nf' => (int)$numero_nf,
        'serie_nf' => $serie_nf,
        'valor_total' => (float)$valorTotalCalc
    ]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log('Erro checkout: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Erro: ' . $e->getMessage()]);
}
exit;
?>
