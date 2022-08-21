const { Router } = require("express");
const AuthService = require("../services/AuthService");
const IdQueryMiddleware = require("../middlewares/IdQueryMiddleware");


class AuthRouter {

    constructor() {
        this.router = Router();
        this.#config();
    }

    #config() {

        const authService = new AuthService();

        this.router.post("/login", authService.login);
        this.router.post("/register", authService.register);
    }
}

module.exports = AuthRouter;
