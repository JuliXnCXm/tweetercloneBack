const { UserSchema, User, UserCredentials } = require("../models/User");
const Photo = require("../models/Photo");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const bcrypt = require("bcrypt");
const TokenController = require("./TokenController");

class UserController {

    updateUser = (req, res) => {
        const objToken = new TokenController();
        let token = objToken.getToken(req, res);
        let user = req.body;
        if (user.password || user.password !== "" || user.password !== undefined) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
            user.password = hash;
            return this.findAndUpdate(req, res, req.params.id, user, token);
            });
        });
        } else {
        return this.findAndUpdate(res, res, req.params.id, req.body, token);
        }
    };

    findAndUpdate = (req, res, id, user, token) => {
        User.findByIdAndUpdate(id, user, { new: true }, (err, userUpdated) => {
        if (err) {
            return res.status(500).send({
            message: "Error al actualizar el usuario",
            });
        } else {
            if (!userUpdated) {
            return res.status(404).send({
                message: "No se ha podido actualizar el usuario",
            });
            } else {
            token = jwt.sign({ user: userUpdated }, config.privateKey, {
                expiresIn: moment().add(14, "days").unix(),
            });
            return res.status(200).send({
                message: "user updated",
                token: token,
            });
            }
        }
        });
    };

    deleteUser = (req, res) => {
        let id = req.query.user_id;
        User.find({ _id: id })
        .then((dataDeleted) => {
            if (dataDeleted) {
            this.rollbackUserCreation(
                res,
                dataDeleted.user_info[0].user_id,
                "User deleted"
            );
            } else {
            res.status(404).send({
                message: "User could not be deleted",
            });
            }
            console.log(dataDeleted);
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).send({
            message: "Error while trying delete user",
            });
        });
    };

    getUsers = (req, res) => {
        User.find()
        .then((data) => {
            if (data && data.length > 0) {
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
            return res.status(500).send({
            message: err.message,
            });
        });
    };

    getUserShow = (req, res) => {
        let username = req.params.screenname;
        User.findOne({ 'user_info.0.screenname': username }, (err, user) => {
            if (err) {
                res.status(500).send({
                message: "Error al devolver los datos",
                });
            } else {
                if (!user) {
                res.status(404).send({
                    message: "No hay usuarios",
                });
                } else {
                res.status(200).send({
                    message: "Usuario devuelto",
                    user,
                });
                }
            }
        });
    };

    logout = (req, res) => {
        res.removeHeader("Authorization");
        return res.redirect("/");
    };

    usernnameChecker = async (req, res) => {
        let username = req.body;
        let usernameExist = await User.findOne({
            "user_info.0.screenname": username,
        });
        if (usernameExist) {
            return res.status(406).send({
                message: "Username already taked"
            });
        } else {
            return res.status(200).send({
                message: "Username available"
            });
        }
    }
}

module.exports = UserController;
