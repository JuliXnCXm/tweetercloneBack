const {Router} = require('express')
const UserService = require('../services/UserService')
const IdQueryMiddleware = require('../middlewares/IdQueryMiddleware')
const TokenHandlerMiddleware = require("../middlewares/TokenHandlerMiddleware.js");
const ScreennameQueryMiddleware = require("../middlewares/ScreennameQueryMiddleware.js")
class UsersRouter {

    constructor() {
        this.router = Router();
        this.#config();
    }

    #config() {
        const userService = new UserService();
        this.router.use(TokenHandlerMiddleware);
        this.router.get("/", userService.getUsers);
        this.router.get("/me", userService.getUserMe);
        this.router.get("/show",userService.getUserShow);
        this.router.get("/explore/people",userService.getExplorePeople);
        this.router.get("/logout", userService.logout);
        this.router.post("/usernamechecker", userService.usernameChecker);
        this.router.put("/update", userService.updateUser);
        this.router.put("/updatepictures", userService.updatePictures);
        this.router.delete("/delete", userService.deleteUser);
    }
}

module.exports = UsersRouter;

