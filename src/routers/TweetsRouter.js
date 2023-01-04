const { Router } = require('express')
const TweetService = require('../services/TweetService')
const TokenHandlerMiddleware = require("../middlewares/TokenHandlerMiddleware");

class TweetsRouter {

    constructor() {
        this.router = Router();
        this.#config()
    }

    #config() {

        const tweetService = new TweetService()
        this.router.use(TokenHandlerMiddleware)
        this.router.post('/create/tweet', tweetService.createTweet)
        this.router.get("/retrieve/home", tweetService.retrieveListTweets);
        this.router.get("/retrieve/bookmarks", tweetService.retrieveBookmarks);
        this.router.get("/retrieve/bookmarks_replies", tweetService.retrieveBookmarksReplies)
        this.router.get("/retrieve/bookmarks_media", tweetService.retrieveBookmarksMedia);
        this.router.get("/retrieve/bookmarks_likes", tweetService.retrieveBookmarksLikes); 
        this.router.get("/retrieve/top", tweetService.retrieveExploreTop);
        this.router.get("/retrieve/media", tweetService.retrieveExploreMedia);
        this.router.get("/retrieve/latest", tweetService.retrieveExploreLatest);
        this.router.get("/retrieve/user_tweets", tweetService.retrieveUserTweets);
        this.router.get("/retrieve/user_replies", tweetService.retrieveUserTweetsReplies);
        this.router.get("/retrieve/user_media", tweetService.retrieveUserMedia);
        this.router.get("/retrieve/user_likes", tweetService.retrieveUserLikes);
        this.router.put("/updateoptions" , tweetService.updateTweetOptions )
        this.router.get("/retrievetrending", tweetService.retrieveTrending)
        this.router.get("/comments", tweetService.getComments)
    }
}

module.exports = TweetsRouter;

