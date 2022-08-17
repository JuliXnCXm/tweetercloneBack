const joi = require("joi");
const { Schema, model, Mongoose } = require("mongoose");


//schema for validation
const UserSchema = joi.object().keys({
    email: joi.string().email().required(),
    password: joi
        .string()
        .regex(new RegExp("^[a-zA-Z0-9]{8,32}$"))
        .optional()
        .allow(""),
    name: joi.string().optional().allow(""),
    lastname: joi.string().optional().allow(""),
    description: joi.string().optional().allow(""),
    phone: joi.number().optional().allow("").min(10).max(10),
    createdAt: joi.date(),
    picture: joi.any().optional().allow(""),
});

//schema minimum info user

const UserSchemaBase = new Schema({
    _id: {
        type: String
    },
    name: {
        type: String,
    },
    lastname: {
        type: String,
    },
    screenname: {
        type: String,
    },
    description: {
        type: String,
    },
    phone: {
        type: Number,
    },
    picture: {
        type: Schema.Types.Mixed,
    },
    followers_count: {type : Number, default:0},
    favorites_count: {type: Number, default:0},
    verified: {type : Boolean, default: false},
    statuses_count: {type: Number, default:0 },
})

//schema for create user

const createUser = Schema(
    {
        email: {
        type: String,
        },
        password: {
        type: String,
        },
        user_info: {
        type: [UserSchemaBase],
        },
    },
    { Collection: "users" }
    );

    //schema retrieve user
    const UserModel = Schema({
    user_info: {
        type: [UserSchemaBase],
    },
    following: { type: [UserSchemaBase], default: [] },
    createdAt: Date,
    updatedAt: Date,
    });

const UserCreate = model("UserCreate", createUser);
const User = model("User", UserModel)

module.exports = {
    UserSchema,
    User,
    UserCreate,
};
