const {Router} = require('express')
const UserService = require('../services/UserService')
const TweetService = require('../services/TweetService')

class TweeterRouter {

    constructor() {
        this.router =  Router();
        this.#config()
    }

    #config() {
        const userService = new UserService()
        const tweetService = new TweetService()

        this.router.post("/user", userService.findAndUpdate)
        this.router.post("/login", userService.login)
        this.router.post("/register", userService.register)
        this.router.get("/", (req, res) => {
            console.log("hello world");
        })
    }

}

module.exports = TweeterRouter

