const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

const { Op } = require("sequelize");
const { Usuario } = require("../models/sequelize");

//todas as rotas definidas aqui já vão estar dentro da URL '/usuarios/'

//GET /usuarios
router.get("/", (req, res, next) => {
  const nome = req.query.nome;
  const email = req.query.email;

  const where = {};
  if (nome) {
    where.nome = {
      [Op.like]: "%" + nome + "%"
    };
  }
  if (email) {
    where.email = email;
  }

  Usuario.findAll({
    attributes: ["id", "nome", "email"],
    where
  })
    .then(usuarios => {
      res.status(200).json(usuarios);
    })
    .catch(error => {
      console.log(error);
      res.status(422).send();
    });
});

//GET /usuarios/id
router.get("/:usuarioId", (req, res, next) => {
  const usuarioId = req.params.usuarioId;

  Usuario.findByPk(usuarioId)
    .then(usuario => {
      if (usuario) {
        const usuarioJson = usuario.toJSON();
        //remover a senha antes de devolver o usuario
        delete usuarioJson.senha;
        res.status(200).json(usuarioJson);
      } else {
        res.status(404).send();
      }
    })
    .catch(error => {
      console.log(error);
      res.status(422).send();
    });
});

//DELETE /usuarios/id
router.delete("/:usuarioId", (req, res, next) => {
  const usuarioId = req.params.usuarioId;

  Usuario.destroy({
    where: {
      id: usuarioId
    }
  })
    .then(removidos => {
      if (removidos > 0) {
        // 204 - operacao que você executou deu certo, mas não tem nada como resposta
        res.status(204).send();
      } else {
        res.status(404).send();
      }
    })
    .catch(error => {
      console.log(error);
      //cai na função de tratamento de erro do express
      // next(error);
      res.status(422).send();
    });
});

//PUT /usuarios/id
router.put("/:usuarioId", (req, res, next) => {
  const usuarioId = req.params.usuarioId;
  const body = req.body;

  Usuario.findByPk(usuarioId)
    .then(usuario => {
      if (usuario) {
        //atualiza os dados do usuario
        //depois que o update é realizado
        return (
          usuario
            .update({
              nome: body.nome,
              email: body.email,
              nascimento: body.nascimento,
              senha: body.senha //criar uma rota especifica para altera a senha
            })
            //então manda o usuario atualizado
            .then(usuarioAtualizado => {
              const usuarioJson = usuarioAtualizado.toJSON();
              //remover a senha antes de devolver o usuario
              delete usuarioJson.senha;
              res.status(200).json(usuarioJson);
            })
        );
      } else {
        res.status(404).send();
      }
    })
    .catch(error => {
      console.log(error);
      res.status(422).send();
    });
});

//POST /usuarios
router.post("/", (req, res, next) => {
  const usuario = req.body;

  bcrypt
    .hash(usuario.senha, 10)
    .then(hash => {
      let senhaHash = hash;

      Usuario.create({
        nome: usuario.nome,
        email: usuario.email,
        nascimento: usuario.nascimento,
        senha: senhaHash
      })
        .then(usuarioCriado => {
          //usuario inserido com sucesso
          //é sempre uma boa pratica devolver o objeto criado
          //quando cria e da certo mandar status 201 e não o 200 de OK
          res.status(201).json(usuarioCriado);
        })
        .catch(error => {
          //falha ao inserir o usuario
          if (Array.isArray(error.errors)) {
            const sequelizeError = error.errors[0];
            if (
              sequelizeError.type === "unique violation" &&
              sequelizeError.path === "email"
            ) {
              res
                .status(422)
                .send("O email informado já existe no banco de dados.");
              return;
            }
          }
          res.status(422).send();
        });
    })
    .catch(error => res.status(500).send(error));
});

router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  Usuario.findOne({
    where: {
      email: email
    }
  })
    .then(usuario => {
      if (bcrypt.compare(senha, usuario.senha)) {
        res
          .status(200)
          .send({ usuario, token: generatedToken({ id: usuario.id }) });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(422).send();
    });
});

function generatedToken(params = {}) {
  return jwt.sign(params, process.env.SECRET);
}

module.exports = router;
