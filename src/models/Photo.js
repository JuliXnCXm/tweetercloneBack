const {Schema, model} = require('mongoose')

const photoSchema = Schema(
    {
        photoname: {
            type: String,
        },
        path: {
        type: String,
        },
        mimetype: {
        type: String,
        },
        photourl: {
            type: String,
        },
        user_id: {
            type: String,
        },
        createdAt: Date,
    },
    {
        collection: "photos"
    }
)

module.exports = model("Photo", photoSchema)