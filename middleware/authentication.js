const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (typeof token === "undefined") {
    return res.status(401).send({ error: "Token não informado" });
  }

  jwt.verify(token, process.env.SECRET, (error, decoded) => {
    if (error) return res.status(401).send({ error: "Token invalido" });
    req.id = decoded.id;

    return next();
  });
};

module.exports = {
  verifyToken
};
