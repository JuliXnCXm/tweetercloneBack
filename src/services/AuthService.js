const AuthController = require("../controllers/AuthController");

class AuthService {

    constructor() {
        this.objAuthController = new AuthController();
    }

    register = (req, res) => {
        return this.objAuthController.register(req, res);
    };

    login = (req, res) => {
        return this.objAuthController.login(req, res);
    };

    logout = (req, res) => {
        return this.objAuthController.logout(req, res);
    }
}

module.exports = AuthService;
