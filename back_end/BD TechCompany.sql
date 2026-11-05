create table usuarios(
id_usuario serial primary key,
nome_imagem varchar(100) unique,
data bytea,
mimetype varchar(100),
nome varchar(255) not null,
email varchar(255) not null unique,
senha varchar(255) not null,
nivel varchar(255) default 1,
endereco varchar(255) not null
);
select * from usuarios;
select * from pedidos;

update usuarios
set nivel = 3
where id_usuario = 1
ALTER TABLE pedidos
ALTER COLUMN id_usuarios SET NOT NULL;

create table pedidos(
id_pedido serial primary key,
id_usuarios INT REFERENCES usuarios(id_usuario),
nome varchar(255) not null,
descricao varchar(2000) not null,
tipoeletronico varchar(255) not null,
modelo varchar(255) not null,
telefone varchar(255) not null,
comentario varchar(2000),
valor numeric(10,2),
nome_imagem varchar(255) unique,
data bytea not null,
mimetype varchar(100) not null
);
