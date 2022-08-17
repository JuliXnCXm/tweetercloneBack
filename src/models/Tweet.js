const {Schema , model} = require("mongoose")
const User = require("./User")

const tweetSchema = Schema(
    {
        created_at: Date,
        id: String,
        text: String,
        user: User,
        reply_count: Number,
        favorite_count: Number,
        retweet_count: Number,
        hashtags: {type: Array, "default": []},
        favorited: Boolean,
        retweeted: Boolean,
    },
    {
        collection: "tweet"
    }
)

module.exports = model("Tweet", tweetSchema);