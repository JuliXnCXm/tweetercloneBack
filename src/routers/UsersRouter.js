const {Router} = require('express')
const UserService = require('../services/UserService')
const IdQueryMiddleware = require('../middlewares/IdQueryMiddleware')
const TokenHandlerMiddleware = require("../middlewares/TokenHandlerMiddleware.js");
class UsersRouter {

    constructor() {
        this.router = Router();
        this.#config();
    }

    #config() {
        const userService = new UserService();
        this.router.use(TokenHandlerMiddleware);
        this.router.get("/logout", userService.logout);
        this.router.get("/show/:screenname", userService.getUserShow);
        this.router.post("/usernameChecker", userService.usernnameChecker);
        this.router.get("/lookup", userService.getUsers);
        this.router.delete("/delete",IdQueryMiddleware, userService.deleteUser);
    }
}

module.exports = UsersRouter;

