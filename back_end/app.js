import express from "express";
import cors from "cors";
import sql from "./database.js";
import { CriarHash, CompararHash } from "./utilits.js";
import fileUpload from "express-fileupload";
const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));
function paraInteiro(valor) {
  const numero = Number.parseInt(valor, 10);
  return Number.isInteger(numero) ? numero : null;
}

// Rota para trazer todos os usuarios
app.get("/usuarios", async (req, res) => {
  const usuarios = await sql`
    SELECT * FROM usuarios
  
  `;

  return res.status(200).json(usuarios);
});
app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const usuarios = await sql`SELECT * FROM usuarios where id_usuario = ${id}`;
  return res.status(200).json(usuarios[0]);
});

//Mostrando pedidos
app.get("/pedidos/:nivel/:id_usuario", async (req, res) => {
  const { nivel, id_usuario } = req.params;
  try {
    let pedidos;
    if (nivel == 2) {
      pedidos = await sql`
        SELECT *
        FROM pedidos
        ORDER BY id_pedido DESC
      `;
    } else {
      pedidos = await sql`
        SELECT *
        FROM pedidos
        WHERE id_usuarios = ${id_usuario}
        ORDER BY id_pedido DESC
      `;
    }

    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).json(pedidos);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Erro ao buscar pedidos");
  }
});
//Mostrando pedidos
app.get("/pedidos", async (req, res) => {
  const pedidos =
    await sql`SELECT id_pedido, id_usuarios, tipoeletronico, nome, telefone, modelo, valor, comentario  FROM pedidos`;
  console.log("aqui");
  return res.status(200).json(pedidos);
});

app.get("/pedidos/:id", async (req, res) => {
  const { id } = req.params;

  const pedidos = await sql`SELECT * FROM pedidos WHERE id_pedido = ${id}`;

  console.log(pedidos);
  return res.status(200).json(pedidos[0]);
});

// Login de usuário
app.post("/usuarios/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario =
      await sql`select id_usuario,nome,nivel,senha from usuarios where email = ${email}`;
    if (usuario[0].length !== 0) {
      const senhaValida = await CompararHash(senha, usuario[0].senha);
      if (senhaValida) {
        return res.status(200).json({
          id_usuario: usuario[0].id_usuario,
          nome: usuario[0].nome,
          nivel: usuario[0].nivel,
          email: usuario[0].email,
        });
      }
      return res.status(401).json("Senha incorreta");
    }
  } catch (error) {
    console.log("Erro em : " + error);
    return res.status(401).json("Erro ao cadastrar usuário");
  }
});

// Cadastro de usuário Admin

app.post("/admin/cadastro", async (req, res) => {
  try {
    const { nome, email, senha, endereco } = req.body;
    if (!nome || !email || !senha || !endereco) {
      return res.status(400).json("preencha todos os campos");
    }
    if (nome.length < 5) {
      return res.status(400).json("Preencha odos os campos!!");
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json("Email inválido. Ex: usuario@gmail.com");
    }
    if (!senhaRegex.test(senha)) {
      return res
        .status(400)
        .json(
          "A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 mzinúscula e 1 número.",
        );
    }

    const hash = await CriarHash(senha, 10);

    await sql`insert into usuarios( nome,endereco,email,senha,nivel) values (${nome}, ${endereco}, ${email}, ${hash},2)`;

    if (res.status(200)) {
      return res.status(200).json("Usuário criado com sucesso");
    }
  } catch {
    return res.status(500).json("Erro ao cadastrar usuário");
  }
});

app.post("/cadastro/user", async (req, res) => {
  try {
    const { nome, email, senha, endereco } = req.body;
    console.log("estou aqui");

    if (!nome || !email || !senha || !endereco) {
      return res.status(400).json("preencha todos os campos");
    }
    if (nome.length < 5) {
      return res.status(400).json("Preencha odos os campos!!");
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json("Email inválido. Ex: usuario@gmail.com");
    }
    if (!senhaRegex.test(senha)) {
      return res
        .status(400)
        .json(
          "A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 minúscula e 1 número.",
        );
    }

    const hash = await CriarHash(senha, 10);
    await sql`INSERT INTO usuarios(nome, email, senha, nivel, endereco)values(${nome},${email},${hash}, 1 ,${endereco})`;
    return res.status(201).json("Usuário criado com sucesso");
  } catch (error) {
    console.log("error ao cadastrar nova conta" + error);
    return res.status(500).json("Erro ao cadastrar usuário");
  }
});

// routes.post("/posts", async (req, res) => {
//   const { titulo, texto } = req.body;
//   const { name, data, mimetype } = req.files.imagem;

//   console.log(req.files.imagem.size);

//   const [postagem] = await sql`
//     WITH nova_postagem AS (
//       INSERT INTO postagens (titulo, texto) VALUES (${titulo}, ${texto}) RETURNING id
//     )
//     INSERT INTO imagens_postagens (name, data, mimetype, id_postagem)
//     SELECT ${name}, ${data}, ${mimetype}, id FROM nova_postagem
//     RETURNING id_postagem
//   `;

//   return res.status(201).json({ id: postagem.id_postagem });
// });

app.post("/cad_pedidos", async (req, res) => {
  console.log("Content-Type recebido:", req.headers["content-type"]);
  console.log("req.files:", req.files);
  console.log("req.body:", req.body);
   try {
    const { nome, tipoeletronico, descricao, modelo, telefone } = req.body;

    const id_usuario = paraInteiro(req.body.id_usuario);
    if (id_usuario === null) {
      return res
        .status(400)
        .json("Usuário inválido. Faça login novamente para publicar.");
    }

    if (!req.files || !req.files.imagem) {
      return res.status(400).json("A imagem é obrigatória");
    }

    const { name, data, mimetype } = req.files.imagem;
    await sql`
      INSERT INTO pedidos (
        id_usuarios,
        nome,
        descricao,
        tipoeletronico,
        modelo,
        telefone,
        nome_imagem,
        data,
        mimetype
      )
      VALUES (
        ${id_usuario},
        ${nome},
        ${descricao},
        ${tipoeletronico},
        ${modelo},
        ${telefone},
        ${name},
        ${data},
        ${mimetype}
      )
    `;

    return res.status(201).json("Pedido criado com sucesso");
  } catch (error) {
    console.log(error);
    return res.status(500).json("Erro ao criar pedido");
  }
});

// Deletar produto
app.delete("/deletar_user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json("Erro ao deletar usuario!!");
    }
    await sql`delete from usuarios where id_usuario = ${id} `;
    return res.status(200).json("Usuário deletado");
  } catch (error) {
    res.status(409).json("Usuário não pode ser deletado");
  }
});
//deletar pedido
app.delete("/deletar_pedido/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.query;

    const pedido =
      await sql`select id_usuarios from pedidos where id_pedido = ${id}`;

    if (pedido.length === 0) {
      return res.status(404).json("Pedido não encontrado");
    }

    if (String(pedido[0].id_usuarios) !== String(id_usuario)) {
      return res.status(403).json("Você só pode apagar os seus pedidos");
    }

    await sql`delete from pedidos where id_pedido = ${id} and id_usuarios = ${id_usuario}`;
    return res.status(200).json("Pedido deletado");
  } catch (error) {
    console.log(error);
    return res.status(409).json("Pedido não pode ser deletado");
  }
});

// Alterar Curso

app.put("/alterar/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, tipoeletronico, modelo, telefone, valor } = req.body;

  await sql`UPDATE pedidos SET nome=${nome}, descricao=${descricao}, tipoeletronico=${tipoeletronico}, modelo=${modelo}, telefone=${telefone}, valor=${valor} WHERE id_pedido = ${id};`;
  return res.status(201).json("alterado");
});

app.put("/alt_user/:id", async (req, res) => {
  const { id } = req.params;
  console.log(req.params);
  const { nome, email, endereco } = req.body;

  if (!nome || !email || !endereco) {
    return res.status(400).json("preencha todos os campos");
  }
  if (nome.length < 5) {
    return res.status(400).json("Preencha odos os campos!!");
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json("Email inválido");
  }

  console.log(req.body);
  await sql`UPDATE usuarios SET nome=${nome}, endereco=${endereco}, email=${email} WHERE id_usuario = ${id};`;
  return res.status(201).json("alterado");
});

app.put("/imagem/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params);

    //Quando criar o objeto que sera enviado no front-end, ajuste para que os nomes "batam" com esses
    if (!req.files || !req.files.imagem) {
      return res.status(400).send("No file uploaded.");
    }
    console.log(req.files);

    const { name, data, mimetype } = req.files.imagem;

    await sql`update usuarios set nome_imagem=${name}, data=${data}, mimetype=${mimetype} where id_usuario = ${id}`;

    return res.status(201).json({ msg: "imagem cadastrada!" });
  } catch (error) {
    console.log("Erro a criar a imagem" + error);
  }
});

app.put("/enviar_comentario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params);
    const { comentario } = req.body;

    await sql`update pedidos set comentario=${comentario} where id_pedido = ${id}`;
    return res.status(201).json("Comentario enviado com sucesso");
  } catch (error) {
    console.log("error ao enviar o comentario " + error);
    return res.status(500).json("Erro no comentario");
  }
});

app.get("/imagem/:id", async (req, res) => {
  const { id } = req.params;
  const data = await sql`
    SELECT data FROM usuarios where id_usuario = ${id}
  `;

  console.log(data);

  return res.status(200).json(data[0].data);
});
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000 🚀");
});
