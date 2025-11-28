CREATE DATABASE IF NOT EXISTS reinodoce;
USE reinodoce;


CREATE TABLE Endereco (
    id_end INT AUTO_INCREMENT PRIMARY KEY,
    logradouro VARCHAR(100),
    numero VARCHAR(10),
    bairro VARCHAR(50),
    cidade VARCHAR(50),
    estado CHAR(2),
    cep VARCHAR(10)
);

CREATE TABLE Cliente (
    id_cli INT AUTO_INCREMENT PRIMARY KEY,
    nome_cli VARCHAR(100) NOT NULL,
    cpf_cnpj_cli VARCHAR(18) NOT NULL UNIQUE,
    telefone_cli VARCHAR(20),
    email_cli VARCHAR(100),
    id_end INT,
    FOREIGN KEY (id_end) REFERENCES Endereco(id_end)
);

CREATE TABLE Fornecedor (
    id_forn INT AUTO_INCREMENT PRIMARY KEY,
    nome_forn VARCHAR(100) NOT NULL,
    cnpj_forn VARCHAR(18) NOT NULL UNIQUE,
    telefone_forn VARCHAR(20),
    email_forn VARCHAR(100),
    id_end INT,
    FOREIGN KEY (id_end) REFERENCES Endereco(id_end)
);

CREATE TABLE Funcionario (
    id_func INT AUTO_INCREMENT PRIMARY KEY,
    nome_func VARCHAR(100) NOT NULL,
    cargo_func VARCHAR(50),
    salario_func DECIMAL(10,2),
    telefone_func VARCHAR(20),
    email_func VARCHAR(100),
    id_end int,
    FOREIGN KEY (id_end) references Endereco(id_end)
);


CREATE TABLE Produto (
    id_prod INT AUTO_INCREMENT PRIMARY KEY,
    nome_prod VARCHAR(100) NOT NULL,
    categoria_prod VARCHAR(50),
    descricao_prod VARCHAR(255),
    preco_venda DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(20)
);

CREATE TABLE Lote (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_prod INT NOT NULL,
    codigo_lote VARCHAR(50),
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    qtd_atual INT NOT NULL,
    FOREIGN KEY (id_prod) REFERENCES Produto(id_prod)
);

CREATE TABLE Estoque (
    id_mov INT AUTO_INCREMENT PRIMARY KEY,
    id_prod INT NOT NULL,
    tipo_mov ENUM('entrada', 'saida') NOT NULL,
    quantidade INT NOT NULL,
    data_mov DATE NOT NULL,
    origem_mov VARCHAR(50),
    observacao VARCHAR(255),
    FOREIGN KEY (id_prod) REFERENCES Produto(id_prod)
);

CREATE TABLE Pedido_Venda (
    id_pedv INT AUTO_INCREMENT PRIMARY KEY,
    id_cli INT NOT NULL,
    data_pedido DATE NOT NULL,
    status_pedido ENUM('aberto','faturado','cancelado'),
    FOREIGN KEY (id_cli) REFERENCES Cliente(id_cli)
);

CREATE TABLE Pedido_Venda_Item (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_pedv INT NOT NULL,
    id_prod INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unit DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedv) REFERENCES Pedido_Venda(id_pedv),
    FOREIGN KEY (id_prod) REFERENCES Produto(id_prod)
);

CREATE TABLE Nota_Fiscal (
    id_nf INT AUTO_INCREMENT PRIMARY KEY,
    numero_nf INT NOT NULL,
    serie_nf VARCHAR(5) NOT NULL,
    id_cli INT NOT NULL,
    id_pedv INT,
    data_emissao DATETIME NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status_nf ENUM('emitida','cancelada') DEFAULT 'emitida',

    FOREIGN KEY (id_cli) REFERENCES Cliente(id_cli),
    FOREIGN KEY (id_pedv) REFERENCES Pedido_Venda(id_pedv)
);


CREATE TABLE Nota_Fiscal_Item (
    id_item_nf INT AUTO_INCREMENT PRIMARY KEY,
    id_nf INT NOT NULL,
    id_prod INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unit DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_nf) REFERENCES Nota_Fiscal(id_nf),
    FOREIGN KEY (id_prod) REFERENCES Produto(id_prod)
);

create table Usuario (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);