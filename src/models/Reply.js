const { Schema, model, SchemaTypes } = require("mongoose");

const replySchema = Schema(
    {
        created_at: { type: Date, default: Date.now },
        tweet_id: { type: String, required: true },
        author_id: { type: String, required: true},
        description: String,
        favorited: { type: Array, default: [] },
        favorites_count: { type: Number, default: 0 },
        hashtags: { type: Array, default: [] },
        mediaType: { type: String },
        mediaSource: { type: Array, default: [] },
        mediaEmbeddedURL: { type: {}, default: {} },
    },
    {
        collection: "reply",
    }
);

module.exports = model("Reply", replySchema);
