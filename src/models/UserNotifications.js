const { Schema, model, SchemaTypes } = require("mongoose");

const userNotifications = new Schema({
    user_id: { type: SchemaTypes.ObjectId },
    notification_description : { type: String},
    date_notifications: { type: Date },
    viewed : { type: Boolean , default: false}
});


module.exports = model("UserNotifications", userNotifications);