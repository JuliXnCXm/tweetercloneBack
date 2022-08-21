const { config } = require("../config/config");
const jwt = require("jsonwebtoken");

class TokenController {
    constructor() {
        this.verifyToken = this.verifyToken.bind(this);
    }

    verifyToken(req, res) {
        let token = this.getToken(req);
        let decode = jwt.verify(token, config.privateKey);
        if (decode.user.user_info[0].screenname != null) {
            let isValid = this.validateToken(req, decode.user.user_info[0].screenname);
            if (isValid) {
                return token
            }
        } else {
            res.status(401).send({
                message: "Token is not valid",
            });
            return res.redirect('/')
        }
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
