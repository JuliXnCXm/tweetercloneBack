const {Schema , model, SchemaTypes} = require("mongoose")

const tweetSchema = Schema({
    created_at:  {type: Date, default: Date.now},
    author_id: {type: String , required: true},
    public_tweet: { type: Boolean, default: true , required:true},
    description: String,
    favorited: { type: Array, default: [] },
    favorites_count: { type: Number, default: 0 },
    retweeted: { type: Array, default: [] },
    retweet_count: { type: Number, default: 0 },
    bookmarks: {type: Array , default:[] },
    bookmarks_count: { type: Number, default: 0},
    comments: {type: Array , default:[] },
    comments_count: { type: Number, default: 0},
    hashtags: { type: Array, default: [] },
    mediaType: { type: String },
    mediaSource: { type: Array, default: []},
    mediaEmbeddedURL: { type: {}, default: {} },
    },
    {
        collection: "tweet",
    }
);

module.exports = model("Tweet", tweetSchema);