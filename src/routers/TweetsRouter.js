const { Router } = require('express')
const TweetService = require('../services/TweetService')
const IdQueryMiddleware = require('../middlewares/IdQueryMiddleware')
const TokenHandlerMiddleware = require("../middlewares/TokenHandlerMiddleware");

class TweetsRouter {

    constructor() {
        this.router = Router();
        this.#config()
    }

    #config() {

        const tweetService = new TweetService()
        this.router.use(TokenHandlerMiddleware);
        this.router.get("/")
    }
}

module.exports = TweetsRouter;

