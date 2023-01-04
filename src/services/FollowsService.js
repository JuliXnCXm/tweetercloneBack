const FollowsController = require("../controllers/FollowsController");

class FollowsService {

    constructor() {
        this.objFollows = new FollowsController();
    }

    followUser = (req, res) => {
        return this.objFollows.followUser(req, res)
    };

    unFollowUser = (req, res) => {
        return this.objFollows.unFollowUser(req, res)
    };

    peopleShouldFollow = (req, res) => {
        return this.objFollows.peopleShouldFollow(req, res);
    };

    getFollows = (req, res) => {
        return this.objFollows.getFollows(req, res)
    }

    updatePendingRequest = (req, res) => {
        return this.objFollows.updatePendingRequest(req, res)
    }

    showPendingRequest = (req, res) => {
        return this.objFollows.showPendingRequest(req, res)
    }
}

module.exports = FollowsService
