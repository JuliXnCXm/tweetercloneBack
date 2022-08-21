const joi = require("joi");
const { Schema, model, Mongoose } = require("mongoose");


//schema for validation
const UserSchema = joi.object().keys({
    email: joi.string().email().required(),
    password: joi
        .string()
        .regex(new RegExp("^[a-zA-Z0-9]{8,32}$"))
        .required(),
    name: joi.string().required(),
    lastname: joi.string().required(),
    phone: joi.number().optional().allow("").min(10).default(123456790),
    createdAt: joi.date(),
});

//schema minimum info user

const UserSchemaBase = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
    },
    name: {
        type: String,
    },
    lastname: {
        type: String,
    },
    screenname: {
        type: String,
        set: v => v.toString(),
        unique: true
    },
    description: {
        type: String,
        default: "Write something about you",
    },
    phone: {
        type: Number,
    },
    picture: {
        type: String,
        default: "",
    },
    followers_count: {
        type: Number,
        default: 0,
    },
    favorites_count: {
        type: Number,
        default: 0,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    statuses_count: {
        type: Number,
        default: 0,
    },
},{_id: false});

//schema for create user

const createUser = Schema(
    {
        email: {
            type: String,
            unique: true
        },
        password: {
            type: String,
        },
        name: {
            type:String
        },
        lastname: {
            type:String
        },
        phone: {
            type:String
        },
        createdAt: Date,
    },
    { Collection: "userscredentials" }
);

//schema retrieve user
const UserModel = Schema({
    user_info: {
        type: [UserSchemaBase],
    },
    following: { type: [UserSchemaBase], default: [] },
    updatedAt: Date,
});

const UserCredentials = model("userscredentials", createUser);
const User = model("user", UserModel)

module.exports = {
    UserSchema,
    User,
    UserCredentials,
};
