const { User, UserCredentials } = require("../models/User");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const TokenController = require("./TokenController");
const UserNotifications = require( "../models/UserNotifications" );
const ConnDB = require("../database/Conndb");
const ObjectId = require("mongoose").Types.ObjectId;


class FollowsController {

    followUser = async (req, res) => {
        const connection = new ConnDB()
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;

        let user = await User.findById({ _id: userAuthenticated._id });

        let userIdToFollow = req.query.user_id
        let userToFollow = await User.findById({ _id: userIdToFollow });

        let toFollowObj = (String)(new ObjectId(userIdToFollow)) == userToFollow._id ? {
            user_id_envolved: userIdToFollow,
            data: {
                userIdFollowing: userIdToFollow,
                userIdFollower: user._id,
                pendingRequest: userToFollow.user_info.public_user === true ? false : true
            }
        } : undefined

        let notification_description = toFollowObj.pendingRequest
        ? `${user.user_info.screenname} request to follow you`
        : `${user.user_info.screenname} has started to follow you`;


        let alreadyFollowing = userToFollow.followers.filter(el => el.user_id_envolved.toString() === user._id.toString()).length

        let alreadyFollower =  user.following.filter(el => el.user_id_envolved.toString() == userIdToFollow ).length

        if (toFollowObj !== undefined && alreadyFollower === 0 && alreadyFollowing === 0) {
            const session = await connection.conn.startSession();
            try {
                session.startTransaction();

                await User.findByIdAndUpdate(
                { _id: user._id },
                {
                    $set: {
                    following: [...user.following, toFollowObj],
                    "user_info.followings_count": user.following.length + 1,
                    },
                },
                {
                    new: true,
                    session,
                }
                );
                await User.findByIdAndUpdate(
                { _id: userToFollow._id },
                {
                    $set: {
                    followers: [
                        ...userToFollow.followers,
                        { ...toFollowObj, user_id_envolved: user._id },
                    ],
                    "user_info.followers_count": userToFollow.followers.length + 1,
                    },
                },
                { session }
                );
                await session.commitTransaction();
                res.status(200).send({ message: "ok" });
            } catch (err) {
                console.log(err);
                await session.abortTransaction();
                res.status(500).send({ message: "error in request" });
            }
            session.endSession();
            } else {
            console.log("error")
            res.status(500).send({
                message: "Invalid User",
            });
        }
    }

    unFollowUser = async (req, res) => {

        const connection = new ConnDB()
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;
        let user = await User.findById({ _id: userAuthenticated._id });

        let userIdToUnFollow = req.query.user_id;
        let userToUnFollow = await User.findById({ _id: userIdToUnFollow });


        const session = await connection.conn.startSession();
        try {
            session.startTransaction();
            await User.findByIdAndUpdate(
                { _id: user._id },
                { $set: {
                    following: user.following.filter(followed => followed.data.userIdFollowing.toString() !== userIdToUnFollow),
                    followings_count: user.following.length - 1
                }},
                { session })
            await User.findByIdAndUpdate(
                { _id : userToUnFollow._id },
                { $set: {
                    followers: userToUnFollow.followers.filter(follower => follower.data.userIdFollower.toString() !== user._id.toString()),
                    followers_count: userToUnFollow.followers.length - 1
                }},
                { session })
            await session.commitTransaction();
            res.status(200).send({"message": "ok"})
        } catch (error) {
            console.log('error');
            console.log(error);
            await session.abortTransaction();
        }
        session.endSession();
    };

    getFollows = async (req, res) => {
        // init connection
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;

        // query request
        let usernameSearched = req.query.screenname;
        let isFollowing = req.query.isFollowing
        const skip = req.query.skip && /^\d+$/.test(req.query.skip)
        ? Number(req.query.skip)
        : 0;

        let user = await User.findOne({ "user_info.screenname": usernameSearched })

        let follows = isFollowing.toLowerCase() === "true"
            ? user.following
                .filter((follow) => follow.data.pendingRequest == false)
                .map((el) => el.data.userIdFollowing.toString())
            : user.followers
                .filter((follow) => follow.data.pendingRequest == false)
                .map((el) => el.data.userIdFollower.toString());

        User.find({'_id': {
            $in : follows,
        } }, undefined , {skip, limit: 10})
        .lean()
        .then((followsData) => {
            if (followsData.length > 0) {
                followsData = followsData
                .map(follow => ({...follow , isFollowByMe: follow.followers
                    .filter(el => (String)(new ObjectId(el.user_id_envolved)) == userAuthenticated._id).length !== 0}))
                res.status(200).send({
                    users: followsData
                })
            } else {
                res.status(404).send({
                    message: "Users following not found"
                })
            }
        }).catch((err) => {
            res.status(500).send({
                error: err,
            })
        })
    };

    peopleShouldFollow = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let userAuthenticated = objToken.decodeToken(req).user;
        let user = await User.findById({ _id: userAuthenticated._id });

        User.find({$and: [{ _id: { $nin: user.following.map(el => el.user_id_envolved)}},{_id: { $nin : user._id}}]})
        .sort({'user_info.followers_count': -1})
        .limit(3)
        .then((result) => {
                res.status(200).send({
                peopleShouldFollow: result,
                });
            })
        .catch((err) => {
                res.status(500).send({
                message: err.message,
                });
        });
    }

    updatePendingRequest = async (req, res) => {
        const connection = new ConnDB();
        const objToken = new TokenController();
        let user = objToken.decodeToken(req).user;
        let userForRequest = req.body

        const session = await connection.conn.startSession();

        try {
            session.startTransaction();

            let userUpdated = await User.findByIdAndUpdate(
                {_id: user._id},
                { $set : { followers: user.followers.map(follower => {
                if (follower.userIdFollowing === pendingRequest.userId) {
                    follower.pendingRequest = false
            }})}}, {
                new: true,
                session
            })

            await User.findByIdAndUpdate(
                {_id: userForRequest._id},
                {$set : { followers: userForRequest.followers.map(follower => {
                if (follower.userIdFollowing === pendingRequest.userId) {
                        return pendingRequest
            }})}}, {session})

            await UserNotifications.create([new UserNotifications(
                    {
                        user_id: userIdToFollow,
                        notification_description: notification_description,
                        date_notifications: Date.now()
                    })],
                    { session });

            await session.commitTransaction();
            this.tokenFactory(req, res, userUpdated)

        } catch (err) {
            res.status(500).send({
                error: err,
            })
        }
    }

    getNotifications = () => {
        const objToken = new TokenController();
        let user = objToken.decodeToken(req).user;
        UserNotifications.findById({ user_id: user._id })
        .then((data) => {
            if (data.length > 0) {
                res.status(200).send({
                    notifications: data
                })
            } else {
                res.status(404).send({
                    message: 'Notifications Not Founded'
                })
            }
        })
        .catch(err => console.error(err))
    }

    updateNotifications = () => {
        const objToken = new TokenController();
        let user = objToken.decodeToken(req).user;
        UserNotifications.findByIdandUpdate({ user_id: user._id })
        .then((data) => {
            if (data.length >  0) {
                res.status(200).send({
                    notifications: data
                })
            } else {
                res.status(404).send({
                    message: 'Notifications Not Founded'
                })
            }
        })
        .catch(err => console.error(err))
    }

    showPendingRequest = (req, res) => {
        const objToken = new TokenController();
        let user = objToken.decodeToken(req).user;
        User.findById({ _id: {
            $in : [user.pendingRequests.filter(pending => pending.pendingRequest == true)]}
        }).then((pendingRequests) => {
            if(pendingRequests.length > 0) {
                res.status(200).send({
                    pendingRequests: pendingRequests
                })
            } else {
                res.status(404).send({
                    message: "Pending requests not found"
                })
            }
        }).catch((err) => {
            res.status(500).send({
                error: err,
            })
        })
    }
}

module.exports = FollowsController;
