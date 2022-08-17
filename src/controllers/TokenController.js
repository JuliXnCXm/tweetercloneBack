const { config } = require("../config/config");
const jwt = require("jsonwebtoken");

class TokenController {
    constructor() {
        this.verifyToken = this.verifyToken.bind(this);
    }

    verifyToken(req, res, next) {
        let token = this.getToken(req);
        let decode = jwt.verify(token, config.privateKey);
        if (decode.user != null) {
        return decode;
        } else {
        res.status(401).send({
            message: "Token is not valid",
        });
        }
    }

    getToken(req, res, next) {
        let token = null;
        let authorization = req.headers.authorization;
        if (authorization && authorization.split(" ")[0] === "Bearer") {
        token = authorization.split(" ")[1];
        }
        return token;
    }
    }

module.exports = TokenController;
