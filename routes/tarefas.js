const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authentication");
const { Op } = require("sequelize");
const { Tarefa } = require("../models/sequelize");

//GET /tarefas
router.get("/", verifyToken, (req, res, next) => {
  const titulo = req.query.titulo;
  const concluido = req.query.concluido;
  const idUsuario = req.id;

  const where = {};
  if (idUsuario) {
    where.usuarioId = idUsuario;
  }
  if (titulo) {
    where.titulo = {
      [Op.like]: "%" + titulo + "%"
    };
  }
  if (concluido) {
    where.concluido = concluido;
  }

  Tarefa.findAll({
    attributes: ["id", "titulo", "descricao", "concluido", "usuarioId"],
    where
  })
    .then(tarefas => {
      res.status(200).json(tarefas);
    })
    .catch(error => {
      res.status(422).send();
    });
});

//GET /tarefas/id
router.get("/:tarefaId", verifyToken, (req, res, next) => {
  const tarefaId = req.params.tarefaId;

  Tarefa.findOne({
    where: {
      id: tarefaId
    }
  })
    .then(tarefa => {
      if (tarefa) {
        if (tarefa.usuarioId === req.id) {
          const tarefaJson = tarefa.toJSON();
          res.status(200).json(tarefaJson);
        } else {
          res.status(404).send("Tarefa não cadastrada para esse usuario");
        }
      } else {
        res.status(404).send("Tarefa não existe");
      }
    })
    .catch(error => {
      res.status(422).send();
    });
});

//DELETE /tarefas/id
router.delete("/:tarefaId", verifyToken, (req, res, next) => {
  const tarefaId = req.params.tarefaId;
  Tarefa.findOne({
    where: {
      id: tarefaId
    }
  }).then(tarefa => {
    if (tarefa) {
      if (tarefa.usuarioId === req.id) {
        Tarefa.destroy({
          where: {
            id: tarefaId
          }
        })
          .then(removidos => {
            if (removidos > 0) {
              res.status(204).send();
            } else {
              res.status(404).send();
            }
          })
          .catch(error => {
            res.status(422).send();
          });
      } else {
        res.status(404).send("Tarefa não pertence a esse usuario");
      }
    } else {
      res.status(404).send("Tarefa não existe");
    }
  });
});

//PUT /tarefas/id
router.put("/:tarefaId", verifyToken, (req, res, next) => {
  const tarefaId = req.params.tarefaId;
  const body = req.body;

  Tarefa.findOne({
    where: {
      id: tarefaId
    }
  })
    .then(tarefa => {
      if (tarefa) {
        if (tarefa.usuarioId === req.id) {
          return tarefa
            .update({
              titulo: body.titulo,
              descricao: body.descricao,
              concluido: body.concluido
            })
            .then(tarefaAtualizada => {
              const tarefaJson = tarefaAtualizada.toJSON();
              res.status(200).json(tarefaJson);
            });
        } else {
          res.status(404).send("Tarefa não cadastrada para esse usuario");
        }
      } else {
        res.status(404).send("Tarefa não encontrada");
      }
    })
    .catch(error => {
      res.status(422).send();
    });
});

//PUT /tarefas/id
router.put("/:tarefaId/concluido", verifyToken, (req, res, next) => {
  const tarefaId = req.params.tarefaId;

  Tarefa.findOne({
    where: {
      id: tarefaId
    }
  })
    .then(tarefa => {
      if (tarefa) {
        if (tarefa.usuarioId === req.id) {
          return tarefa
            .update({
              concluido: true
            })
            .then(tarefaAtualizada => {
              const tarefaJson = tarefaAtualizada.toJSON();
              res.status(200).json(tarefaJson);
            });
        } else {
          res.status(404).send("Tarefa não cadastrada para esse usuario");
        }
      } else {
        res.status(404).send("Tarefa não encontrada");
      }
    })
    .catch(error => {
      res.status(422).send();
    });
});

//DEL /tarefas/id
router.delete("/:tarefaId/concluido", verifyToken, (req, res, next) => {
  const tarefaId = req.params.tarefaId;

  Tarefa.findOne({
    where: {
      id: tarefaId
    }
  })
    .then(tarefa => {
      if (tarefa) {
        if (tarefa.usuarioId === req.id) {
          return tarefa
            .update({
              concluido: false
            })
            .then(tarefaAtualizada => {
              const tarefaJson = tarefaAtualizada.toJSON();
              res.status(200).json(tarefaJson);
            });
        } else {
          res.status(404).send("Tarefa não cadastrada para esse usuario");
        }
      } else {
        res.status(404).send("Tarefa não encontrada");
      }
    })
    .catch(error => {
      res.status(422).send();
    });
});

//POST /tarefas
router.post("/", verifyToken, (req, res, next) => {
  const tarefa = req.body;

  Tarefa.create({
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    concluido: tarefa.concluido,
    usuarioId: req.id
  })
    .then(tarefaCriada => {
      res.status(201).json(tarefaCriada);
    })
    .catch(error => {
      if (Array.isArray(error.errors)) {
        const sequelizeError = error.errors[0];
        if (
          sequelizeError.type === "unique violation" &&
          sequelizeError.path === "titulo"
        ) {
          res.status(422).send("Tarefa já cadastrada com esse titulo");
          return;
        }
      }
      res.status(422).send;
    });
});

module.exports = router;
