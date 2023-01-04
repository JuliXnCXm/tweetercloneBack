const {Router} = require('express')
const FollowsService = require('../services/FollowsService')
const IdQueryMiddleware = require('../middlewares/IdQueryMiddleware')
const TokenHandlerMiddleware = require("../middlewares/TokenHandlerMiddleware.js")


class FollowsRouter {
    constructor() {
        this.router = Router();
        this.#config();
    }

    #config() {
        const followsService = new FollowsService()
        this.router.use(TokenHandlerMiddleware);
        this.router.post("/retrievefollows", followsService.getFollows);
        this.router.get("/show/pendingRequest", followsService.showPendingRequest);
        this.router.get("/peoplerecomendation", followsService.peopleShouldFollow);
        this.router.put("/update/pendingRequest", followsService.updatePendingRequest);
        this.router.put("/unfollow",followsService.unFollowUser
        );
        this.router.put("/follow", followsService.followUser);
    }
}

module.exports = FollowsRouter;
