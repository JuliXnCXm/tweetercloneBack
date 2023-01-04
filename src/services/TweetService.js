const TweetController = require("../controllers/TweetController");

class TweetService {
    constructor() {
        this.objTweetController = new TweetController();
    }

    createTweet = (req, res) => {
        return this.objTweetController.createTweet(req, res)
    };

    retrieveTrending = (req, res) => {
        return this.objTweetController.retrieveTrending(req, res)
    };

    retrieveListTweets = (req, res) => {
        return this.objTweetController.retrieveListTweets(req, res)
    };

    retrieveBookmarks = (req, res) => {
        return this.objTweetController.retrieveBookmarks(req, res)
    };

    retrieveBookmarksReplies = (req, res) => {
        return this.objTweetController.retrieveBookmarksReplies(req, res);
    };

    retrieveBookmarksMedia = (req, res) => {
        return this.objTweetController.retrieveBookmarksMedia(req, res);
    };
    retrieveBookmarksLikes = (req, res) => {
        return this.objTweetController.retrieveBookmarksLikes(req, res);
    };
    retrieveExploreTop = (req, res) => {
        return this.objTweetController.retrieveExploreTop(req, res);
    };
    retrieveExploreMedia = (req, res) => {
        return this.objTweetController.retrieveExploreMedia(req, res);
    };
    retrieveExploreLatest = (req, res) => {
        return this.objTweetController.retrieveExploreLatest(req, res);
    };
    retrieveUserTweets = (req, res) => {
        return this.objTweetController.retrieveUserTweets(req, res);
    };

    retrieveUserTweetsReplies = (req, res) => {
        return this.objTweetController.retrieveUserTweetsReplies(req, res);
    };

    retrieveUserMedia = (req, res) => {
        return this.objTweetController.retrieveUserMedia(req, res)
    };

    retrieveUserLikes = (req, res) => {
        return this.objTweetController.retrieveUserLikes(req, res);
    };

    updateTweetOptions = (req, res) => {
        return this.objTweetController.updateTweetOptions(req, res);
    };

    getComments = (req, res) => {
        return this.objTweetController.getComments(req, res);
    };

    searchTweets = () => {};
}

module.exports = TweetService
