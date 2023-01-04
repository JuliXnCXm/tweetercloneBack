const TokenController = require("./TokenController");
const _ = require("lodash");
const ConnDB = require("../database/Conndb");
const Tweet = require( "../models/Tweet" );
const multi_upload = require( "../utils/Storage" ).array("media", 4)
const multer = require( "multer" );
const ObjectId = require("mongoose").Types.ObjectId;
const { config } = require("../config/config");
const path = require("path");
const fs = require("fs");
const { User } = require( "../models/User" );
const Reply = require( "../models/Reply" );

class TweetController {

    createTweet = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;
        const tweetId = req?.query?.tweetId;
        let tweet = tweetId ? await Tweet.findById(tweetId) : null;
        let user = await User.findById(userAuthenticated._id)

        multi_upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
                return;
            } else if (err) {
                if (err.name == 'ExtensionError') {
                    res.status(413).send({ error: { message: err.message } }).end();
                } else {
                    res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
                }
                return;
            }

            let tweetData = JSON.parse(req.body.tweetData);
            let hashtags = JSON.parse(req.body.hashtags);
            let mediaEmbeddedURL = req.body.mediaEmbeddedURL;
            const mediaUploaded = await req.files

            if (mediaUploaded?.length > 0) {
                for (let i = 0; i < Array.from(mediaUploaded).length; i++) {
                    mediaUploaded[i]["photourl"] = `${config.url}/api/media/${mediaUploaded[i].filename}`;
                    mediaUploaded[i]["path"] = `storage/img/${mediaUploaded[i].filename}`;
                }
            }

            const session = await connection.conn.startSession();
            try {
                session.startTransaction()
                if (tweet !== null) {
                    let reply = await Reply.create([new Reply({
                        tweet_id: tweet._id,
                        author_id: user._id,
                        description: tweetData.description,
                        hashtags: hashtags,
                        mediaType: (mediaUploaded.length > 0 || mediaEmbeddedURL !== "" ) ? (mediaUploaded.length > 0 ? "upload" : "embedded") : "No media",
                        mediaSource : mediaUploaded,
                        mediaEmbeddedURL: mediaEmbeddedURL
                    })], {new: true, session})
                    await Tweet.findByIdAndUpdate(tweet._id,{ $set: {
                        comments: [...tweet.comments ,reply[0]._id],
                        comments_count: tweet.comments.length + 1 }}
                        , {session})
                    await User.findByIdAndUpdate(user._id, { $set: {
                            comments: [...user.comments , reply[0]._id],
                        }},{session})
                } else {
                    await Tweet.create([new Tweet({
                    author_id: user._id,
                    description: tweetData.description,
                    public_tweet: tweetData.publicTweet,
                    hashtags: hashtags,
                    mediaType: (mediaUploaded.length > 0 || mediaEmbeddedURL !== "" ) ? (mediaUploaded.length > 0 ? "upload" : "embedded") : "No media",
                    mediaSource : mediaUploaded,
                    mediaEmbeddedURL: mediaEmbeddedURL
                })], {session})
                }

                await session.commitTransaction();
                res.status(201).send({
                    message: "Success"
                })
            } catch (err) {
                console.log(err)
                if (mediaUploaded?.length > 0) {
                    for (let i = 0; i < Array.from(mediaUploaded).length; i++) {
                        let filepath = path.join(__dirname,`/../storage/img/${mediaUploaded[i].filename}`)
                        fs.unlinkSync(filepath)
                    }
                }
                await session.abortTransaction();
                res.status(500).send({ message: "error in request" });
            }
            session.endSession();
        })
    };

    updateTweetOptions = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuhthenticated = objToken.decodeToken(req).user;

        let tweet_id = req.query.tweet_id
        let updateType = req.query.update_type
        let isReply = req?.query?.isReply
        let updateProcess = req.query.update_process
        let user = await User.findById(userAuhthenticated._id)
        let tweet = !isReply ? await Tweet.findById(tweet_id) : await Reply.findById(tweet_id);

        const toggleType = (owner) => {
            let objOwner = owner === "tweet" ? tweet : user
            let referenceId = owner === "tweet" ? user._id : tweet._id

            if (updateProcess === "add") {
                switch (updateType) {
                    case "like":
                        return owner !== "tweet" ?
                            {
                                $set: {
                                    favorited: [...objOwner.favorited ,referenceId],
                                    "user_info.favorites_count": objOwner.user_info.favorites_count + 1
                                }
                            }
                        :
                            {
                                $set: {
                                    favorited: [...objOwner.favorited ,referenceId],
                                    favorites_count: objOwner.favorites_count + 1
                                }
                            }
                    case "retweet":
                        return owner !== "tweet" ?
                            {
                                $set: {
                                    retweeted: [...objOwner.retweeted,referenceId],
                                    "user_info.retweeted_count": objOwner.user_info.retweeted_count + 1
                                }
                            }
                        :
                            {
                                $set: {
                                    retweeted: [...objOwner.retweeted,referenceId],
                                    retweet_count: objOwner.retweet_count + 1
                                }
                            }
                    case "bookmarks":
                        return owner !== "tweet" ?
                            {
                                $set: {
                                    bookmarks: [...objOwner.bookmarks, referenceId],
                                    "user_info.bookmarks_count": objOwner.user_info.bookmarks_count + 1
                                }
                            }
                        :
                            {
                                $set: {
                                    bookmarks: [...objOwner.bookmarks, referenceId],
                                    bookmarks_count: objOwner.bookmarks_count + 1
                                }
                            }
                    default:
                        return
                }
            } else {
                switch (updateType) {
                    case "like":
                        return owner !== "tweet" ?
                            {
                                $set: {
                                    favorited: objOwner.favorited.filter(id => referenceId.toString() !== id.toString()),
                                    "user_info.favorites_count": objOwner.user_info.favorites_count - 1
                                }
                            }
                        :
                            {
                                $set: {
                                    favorited: objOwner.favorited.filter(id => referenceId.toString() !== id.toString()),
                                    favorites_count: objOwner.favorites_count - 1
                                }
                            }
                    case "retweet":
                        return owner !== "tweet" ?
                            {
                                $set: {
                                    retweeted: objOwner.retweeted.filter(id => referenceId.toString() !== id.toString()),
                                    "user_info.retweeted_count": objOwner.user_info.retweeted_count - 1
                                }
                            }
                        :
                            {
                                $set: {
                                    retweeted: objOwner.retweeted.filter(id => referenceId.toString() !== id.toString()),
                                    retweet_count:objOwner.retweet_count - 1
                                }
                            }
                    case "bookmarks":
                        return owner !== "tweet" ?
                            {
                                $set: {
                                    bookmarks: objOwner.bookmarks.filter(id => referenceId.toString() !== id.toString()),
                                    "user_info.bookmarks_count": objOwner.user_info.bookmarks_count - 1
                                }
                            }
                        :
                            {
                                $set: {
                                    bookmarks: objOwner.bookmarks.filter(id => referenceId.toString() !== id.toString()),
                                    bookmarks_count: objOwner.bookmarks_count - 1
                                }
                            }
                    default:
                        return
                }
            }
        }

        const session = await connection.conn.startSession();
        try {
            session.startTransaction()
            if (!isReply) {
                await Tweet.findByIdAndUpdate(tweet._id, toggleType("tweet"), {session})
                await User.findByIdAndUpdate(user._id, toggleType("user"), {session})
            } else {
                await Reply.findByIdAndUpdate(tweet._id, toggleType("tweet"), {session});
                await User.findByIdAndUpdate(user._id,
                    updateProcess === "add" ?
                    { $set: {
                        favorited_comments: [...user.favorited_comments , tweet._id]}}
                    :
                    { $set: {
                        favorited_comments: user.favorited_comments.filter(id => tweet._id.toString() !== id.toString()),}}
                , {session})
            }
            await session.commitTransaction();
            res.status(204).send({
                message: "Success"
            })
        } catch (err) {
            console.log(err);
            await session.abortTransaction();
            res.status(500).send({ message: "error in request" });
        }
        session.endSession();
    };

    retrieveTrending = (req, res) => {
        const connection = new ConnDB();
        Tweet.aggregate([
            {$unwind: "$hashtags"},
            { $group: {
            _id: { hashtag: '$hashtags' }
            , count: { $sum: 1 }
        },
        },
        { $sort: {"count": -1}}
        ]).limit(3)
        .then((result) => {
            res.status(200).send({
                trending: result
            })
        }).catch((err) => {
            res.status(500).send({
                message: err.message
            })
        })
    };

    tweetsAdditionalAttrs = (tweets , userId) => {

        const all_tweets = tweets.map(async tweet => {
            let author = await User.findById(tweet.author_id, 'user_info.picture user_info.name user_info.lastname user_info.screenname').lean()
            return {
            ...tweet,
            author_data: author.user_info,
            isFavoriteByMe: tweet.favorited.filter(el => el.toString() === userId.toString()).length !== 0,
            isRetweetedByMe: tweet.retweeted.filter(el => el.toString() === userId.toString()).length !== 0,
            isSavedByMe: tweet.bookmarks.filter(el => el.toString() === userId.toString()).length !== 0
        }});

        return Promise.all(all_tweets)
    }

    retrieveListTweets = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        Tweet.find({ $or : [{author_id: { $in : user.following.map(el => el.user_id_envolved)}}, {author_id: user._id}]}, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs (tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveBookmarks = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const queryRegex = queryFilter ? new RegExp(queryFilter, "i") : undefined

        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        Tweet.find({ _id: { $in: user.bookmarks } }, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveBookmarksReplies = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });

        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        Tweet.find({
            $and: [
                    {
                        _id: { $in : user.bookmarks}
                    },
                    {
                        retweet_count: { $gt : 0 }
                    }
                ]
            }
            , undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveBookmarksMedia = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const queryRegex = queryFilter ? new RegExp(queryFilter, "i") : undefined
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        Tweet.find({ $and : [
                    {_id : {$in : user.bookmarks}},
                    { mediaType: { $ne : "No media"}}
                ]}, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveBookmarksLikes = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        Tweet.find(
            {
                $and: [
                    {
                        _id: { $in : user.bookmarks }
                    },
                    {
                        favorites_count: { $gt : 0 }
                    },
                ]
            }
        , undefined , { skip, limit: 5 })
        .lean()
        .sort({favorite_count: -1})
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveExploreTop = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

            let query = !queryFilter ?
                {
                    $and: [
                        {
                            author_id: {
                                $nin : user.following.map(el => el.user_id_envolved)
                            }
                        },
                        {
                            author_id: { $nin : user._id}
                        }
                    ]
                }
                :
                { $and: [
                    {
                        author_id: {
                            $nin : user.following.map(el => el.user_id_envolved)
                        }
                    },
                    {
                        author_id: { $nin : user._id}
                    },
                    {
                        description:  {$regex: queryFilter, $options: "$i" }
                    }
                ]}

        Tweet.find(query, undefined , { skip, limit: 5 })
        .lean()
        .sort({favorite_count: -1, retweeted_count: -1})
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveExploreMedia = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        let query = !queryFilter ?
            {
                $and: [
                    {
                        mediaType: { $ne: "No media" }
                    },
                    {
                        author_id: { $nin : user.following.map(el => el.user_id_envolved)
                        }
                    },
                    {
                        author_id: {$nin : user._id}
                    }
                ]
            }
            :
            {
                $and: [
                    {
                        mediaType: { $ne: "No media" }
                    },
                    {
                        author_id: {
                            $nin : user.following.map(el => el.user_id_envolved)}
                    }, {
                            author_id: {$nin : user._id}
                    },
                    {
                        $or: [
                            {
                                'mediaSource.originalname': { $regex: queryFilter, $options: "$i"}
                            },
                            {
                                'description': {$regex: queryFilter, $options: "$i"}
                            }
                        ]
                    }
                ]
            }

        Tweet.find( query, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveExploreLatest = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter

        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        let query = !queryFilter ?
            {
                $and: [
                    {
                        author_id: {
                            $nin : user.following.map(el => el.user_id_envolved)
                        }
                    },
                    {
                        author_id: { $nin : user._id}
                    }
                ]
            }
            :
            {
                $and: [
                    {
                        author_id: { $nin : user.following.map(el => el.user_id_envolved)}
                    },
                    {
                        author_id: { $nin : user._id}
                    },
                    {
                        description: {$regex: queryFilter, $options: "$i" }
                    }
                ]
            }

        Tweet.find(query, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveUserTweets = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const userSearched = req?.query?.userSearched
        const queryRegex = queryFilter ? new RegExp(queryFilter, "i") : undefined
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        const userInSearch = userSearched !== undefined && (await User.findOne({"user_info.screenname": userSearched}))

        Tweet.find({$or :[
                    {author_id : userInSearch._id},
                    {_id: { $in : userInSearch.retweeted}},
                ]}, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveUserTweetsReplies = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const userSearched = req?.query?.userSearched
        const queryRegex = queryFilter ? new RegExp(queryFilter, "i") : undefined
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        const userInSearch = userSearched !== undefined && (await User.findOne({"user_info.screenname": userSearched}))

        Tweet.find({ $and : [
                    {$or :[
                        {author_id : userInSearch._id},
                        {_id: { $in : userInSearch.retweeted}},
                    ]},
                    {retweet_count: { $gt : 0 }}
                ]}, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveUserMedia = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const userSearched = req?.query?.userSearched
        const queryRegex = queryFilter ? new RegExp(queryFilter, "i") : undefined
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        const userInSearch = userSearched !== undefined && (await User.findOne({"user_info.screenname": userSearched}))

        Tweet.find({ $and : [
                {$or :[
                    {author_id : userInSearch._id},
                    {_id: { $in : userInSearch.retweeted}},
                ]},
                { mediaType: { $ne : "No media"}}
            ]}, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    retrieveUserLikes = async (req, res) => {

        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilter = req?.query?.queryFilter
        const userSearched = req?.query?.userSearched
        const queryRegex = queryFilter ? new RegExp(queryFilter, "i") : undefined
        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        const userInSearch = userSearched !== undefined && (await User.findOne({"user_info.screenname": userSearched}))

        Tweet.find({ $and : [
                {$or :[
                    {author_id : userInSearch._id},
                    {_id: { $in : userInSearch.retweeted}},
                ]},
                {_id: { $in : userInSearch.favorited}},
            ]}, undefined , { skip, limit: 5 })
        .lean()
        .sort({ created_at: -1 })
        .then(async tweets => {
            if (tweets && tweets.length > 0) {
                const all_tweets = await this.tweetsAdditionalAttrs(tweets, user._id)
                return res.status(200).send({
                    message: "Tweets retrieved successfully",
                    tweets: all_tweets,
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };

    getComments = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user
        let tweetId =  req.query.tweetId
        let user = await User.findById({ _id: userAuthenticated._id });

        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        Reply.find({tweet_id : tweetId}, undefined, {skip, limit: 5})
        .lean()
        .sort({created_at: -1})
        .then(async replies => {
            if (replies && replies.length > 0) {
                let replies_data = replies.map(async reply => {
                    let author = await User.findById(reply.author_id, 'user_info.picture user_info.name user_info.lastname ').lean()
                    return {...reply, author_data: author.user_info }
                })
                let all_replies = await Promise.all(replies_data)

                all_replies = all_replies
                .map(reply => ({...reply , isFavoriteByMe: reply.favorited.filter(favorited => String(favorited) == user._id.toString()).length !== 0}))

                return res.status(200).send({
                    message: "Replies retrieved successfully",
                    replies: all_replies
                });
            }
            return res.status(404).send({
                message: "No Tweets Found"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).send({
                message: "Server error: " + err.message
            })
        })
    };
}

module.exports = TweetController;
