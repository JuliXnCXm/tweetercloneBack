const { User, UserCredentials } = require("../models/User");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const bcrypt = require("bcryptjs");
const TokenController = require("./TokenController");
const _ = require("lodash");
const ConnDB = require("../database/Conndb");
const uploadPicture = require( "../utils/Storage").single("userPicture");
const uploadBackground = require( "../utils/Storage").single("userBackground");
const ObjectId = require("mongoose").Types.ObjectId;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

class UserController {

    updateUser = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;
        let userInfo = await User.findById({ _id: userAuthenticated._id });
        let newUserData = req.body;
        let changeAuth = req.query.changeAuth
        if (changeAuth === 'true') {
            if (newUserData.password || newUserData.password !== "" || newUserData.password !== undefined) {
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUserData.password, salt, (err, hash) => {
                        newUserData.password = hash;
                        return this.findAndUpdate(
                            req,
                            res,
                            newUserData,
                            userInfo,
                            changeAuth
                        );
                    });
                });
            }
        } else {
            return this.findAndUpdate(
                req,
                res,
                req.body,
                userInfo,
                changeAuth
            );
        }
    };

    findAndUpdate = (req, res, newUserData, userInfo, changeAuth) => {

        let userToUpdate = _.merge(userInfo.user_info, newUserData);
        console.log(newUserData);

        if (changeAuth === "true") {
            UserCredentials.findByIdAndUpdate(userInfo.user_info.user_id, { $set : {...userToUpdate}}, { new: true }, (err,userUpdated) => {
                this.userUpdatedHandler(res, err, userUpdated)
            })
        } else {
            User.findByIdAndUpdate(
                userInfo._id, {user_info : userToUpdate},{ new: true }, (err,userUpdated) => {
                    let userDataForToken = {}
                    userDataForToken["user_info"] = userUpdated.user_info
                    userDataForToken["_id"] = userUpdated._id
                    this.userUpdatedHandler(res, err, userDataForToken);
            });
        }
    }

    updateUserPictures = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;
        let user =  await User.findById({_id: userAuthenticated._id})
        let uploadToggle =  req.query.uploadToggle

        let uploadObject = await uploadToggle === "picture" ? uploadPicture : uploadBackground
        uploadObject(req, res, async (err) => {
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
            const userMediaUploaded = await req.file

            let queryToUpdate = uploadToggle === "picture" ?
            { 'user_info.picture' : `${config.url}/api/media/${userMediaUploaded.filename}`}
            :
            { 'user_info.background_profile' : `${config.url}/api/media/${userMediaUploaded.filename}`}

            User.findByIdAndUpdate(userAuthenticated._id, queryToUpdate,{ new: true })
            .then(userUpdated => {
                if (userUpdated || userUpdated !== null) {
                    if (uploadToggle === "picture") {
                        if (!user.user_info.picture.includes("default_profile")) {
                            let filepath = path.join(
                                __dirname,
                                `/../storage/img/${user.user_info.picture.split("/").at(-1)}`
                                );
                            fs.unlinkSync(filepath);
                        }
                    } else {
                        if (user.user_info.background_profile !== "") {
                            let filepath = path.join(
                                __dirname,
                                `/../storage/img/${user.user_info.background_profile.split("/").at(-1)}`
                                );
                            fs.unlinkSync(filepath);
                        }
                    }
                    let userDataForToken = {};
                    userDataForToken["user_info"] = userUpdated.user_info;
                    userDataForToken["_id"] = userUpdated._id;
                    this.userUpdatedHandler(res, err, userDataForToken)
                }
                else {
                    let filepath = path.join(
                        __dirname,
                        `/../storage/img/${userMediaUploaded.filename}`
                    );
                    fs.unlinkSync(filepath);
                    res.status(400).send({ error: { message: err.message } })
                }
            })
            .catch(err => {
                console.log(err)
                let filepath = path.join(
                    __dirname,
                    `/../storage/img/${userMediaUploaded.filename}`
                );
                fs.unlinkSync(filepath);
                res.status(500).send({ error: { message: err.message } })
            })
        })
    }

    userUpdatedHandler = (res, err, userUpdated) => {
        let token = null
        if (!err) {
            if (userUpdated !== null || userUpdated !== undefined) {
                token = jwt.sign({ user: userUpdated }, config.privateKey, {
                    expiresIn: moment().add(14, "days").unix(),
                });
                return res.status(201).send({
                    message: "user updated",
                    token: token,
                    username: userUpdated.user_info.screenname
                });
            } else {
                if (!userUpdated) {
                    return res.status(404).send({
                        message: "No se ha podido actualizar el usuario",
                    });
                }
            }
        } else {
            return res.status(500).send({
                message: "Error al actualizar el usuario",
            });
        }
    }

    deleteUser = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let user = objToken.decodeToken(req).user;

        const session = await connection.conn.startSession()
        try {
            session.startTransaction();
            await User.findByIdAndDelete({ _id: user._id },{ session })
            await UserCredentials.findByIdAndDelete({_id:user.user_info.user_id},{session})
            await session.commitTransaction();
            res.status(200).json({
                message: "User deleted successfully",
            });
        } catch (err) {
            await session.abortTransaction();
            res.status(500).json({
                message: "Server Error: Error while trying to delete user",
            });
        }
    };

    getUsers = (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;

        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        User.find({_id: {$nin: userAuthenticated._id}}, undefined , { skip, limit: 5 })
        .lean()
        .then((data) => {
            if (data && data.length > 0) {
                data = data
                .map(user => ({...user , isFollowByMe: user.followers
                    .filter(el => (String)(new ObjectId(el.user_id_envolved)) == userAuthenticated._id).length == 0 ? false :  true}))
                return res.status(200).send({
                    message: "Users retrieved successfully",
                    data: data,
                });
            }
            return res.status(404).send({
            message: "No users were retrieved",
            });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).send({
            message: err,
            });
        });
    };

    getUsersMe = (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let user = objToken.decodeToken(req).user;
        User.findById({ _id: user._id })
        .then((user) => {
            if (user) {
                res.status(200).send({
                    message: "User retrieved successfully",
                    user: user,
                });
            } else {
            return res.status(404).send({
                message: "User not found",
            });
            }
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
    };

    getUserShow = (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let username = req.query.screenname;
        let userAuthenticated = objToken.decodeToken(req).user;

        User.findOne({ "user_info.screenname": username })
        .lean()
        .then(user => {
            if (!user) {
                res.status(404).send({
                    message: "No hay usuarios",
                });
            } else {
                user["isFollowByMe"] = user.followers
                        .filter(el => (String)(new ObjectId(el.user_id_envolved)) == userAuthenticated._id).length == 0 ? false :  true
                res.status(200).send({
                    message: "Usuario devuelto",
                    user,
                });
            }
        }).catch((err) => {
            res.status(500).send({
                message: "Server Error: err",
            });
        })
    };

    getExplorePeople = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;
        let user = await User.findById({ _id: userAuthenticated._id });
        const queryFilterPeople = req?.query?.queryFilterPeople;

        const skip =
            req.query.skip && /^\d+$/.test(req.query.skip)
            ? Number(req.query.skip)
            : 0;

        let query = !queryFilterPeople  ?
            {
                $and: [
                    { _id:
                        {
                            $nin: user.following.map(el => el.user_id_envolved).concat([user._id])
                        }
                    },
                ]
            }
            :
            {
                $and: [
                    {
                        _id: { $nin: user.following.map(el => el.user_id_envolved).concat([user._id])}
                    },
                    {
                        $or: [
                            {
                                'user_info.name': { $regex: queryFilterPeople , $options: "$i" }
                            },
                            {
                                'user_info.lastname': { $regex: queryFilterPeople , $options: "$i" }
                            },
                            {
                                'user_info.screenname': { $regex: queryFilterPeople , $options: "$i" }
                            },
                            {
                                'user_info.description': { $regex: queryFilterPeople , $options: "$i" }
                            },
                        ]
                    }
                ]
            }

            User.find(query, undefined, {
            skip,
            limit: 10,
        })
        .then((data) => {
            if (data) {
                return res.status(200).send({
                    message: "Users retrieved",
                    users: data
                })
            }
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send({
            message: err
            })
        })
    }

    logout = (req, res) => {
        res.removeHeader("Authorization");
        return res.redirect("/");
    };

    usernameChecker = async (req, res) => {
        let { username } = req.body;
        let usernameExist = await User.findOne({
        'user_info.screenname': username,
        });
        console.log(username)

        console.log(usernameExist)
        if (usernameExist) {
            return res.status(406).send({
                message: "Username already taked",
            });
            } else {
            return res.status(200).send({
                message: "Username available",
            });
        }
    };

}

module.exports = UserController;
