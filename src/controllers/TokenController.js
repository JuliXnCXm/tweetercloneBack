const { config } = require("../config/config");
const jwt = require("jsonwebtoken");

class TokenController {
    constructor() {
        this.verifyToken = this.verifyToken.bind(this);
    }

    verifyToken(req, res) {
        let token = this.getToken(req);
        let tokenBody = this.decodeToken(req).user
        if (tokenBody.user_info.screenname != null) {
            let isValid = this.validateToken(
                req,
                tokenBody.user_info.screenname
            );
            if (isValid) {
                return token;
            }
            } else {
            res.status(401).send({
                message: "Token is not valid",
            });
            return res.redirect("/");
        }
    }

    decodeToken = (req) => {
        let token = this.getToken(req);
        let tokenDecoded = jwt.verify(token, config.privateKey);
        return tokenDecoded;
    }

    validateToken = (req, decodeUsername) => {
        return req.headers.username === decodeUsername;
    };

    getToken(req) {
        let token = null;
        let authorization = req.headers.authorization;
        if (authorization && authorization.split(" ")[0] === "Bearer") {
            token = authorization.split(" ")[1];
        }
        return token;
    }
}

module.exports = TokenController;
