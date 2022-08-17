const { UserSchema,User, UserCreate} = require("../models/User");
const Photo = require("../models/Photo");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const path = require("path");
const bcrypt = require("bcrypt");
const TokenController = require("./TokenController");
const fs = require("fs");

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
        let id = req.params.id;
        User.findByIdAndRemove(id, (err, userRemoved) => {
        if (err) {
            res.status(500).send({
            message: "Error al eliminar el usuario",
            });
        } else {
            if (!userRemoved) {
            res.status(404).send({
                message: "No se ha podido eliminar el usuario",
            });
            res.redirect("/");
            } else {
            res.status(200).send({
                message: "user deleted",
            });
            }
        }
        });
    };

    getUser = (req, res) => {
        const objToken = new TokenController();
        let user = objToken.verifyToken(req, res);
        User.findById(user.user._id, (err, user) => {
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

    login = (req, res) => {
        let user = req.body;
        UserCreate.findOne({ email: user.email }, (err, data) => {
            if (!data) {
                res.status(404).send({
                message: "Error al obtener usuario o usuario no encontrado",
            });
            bcrypt.compare(user.password, data.password, (err, result) => {
                if (!!result) {
                    let token = jwt.sign({ user: data }, config.privateKey, {
                        expiresIn: moment().add(14, "days").unix(),
                    });
                    res.status(200).send({
                        message: "Usuario autenticado",
                        token: token,
                    });
                }
                boom.unauthorized("Contraseña incorrecta");
            });
        }});
    };

    register = (req, res) => {
        let user = req.body;
        const { error, value } = UserSchema.validate(user);
        if (error) {
                res.status(400).send({
                message: "Error al registrar",
                info: error,
                });
            }
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(value.password, salt, (err, hash) => {
                let userExist = this.login(req, res) ? true : false
                console.log(userExist)
                if (!!userExist) {
                    res.status(401).send({
                        message: "Error user already exists",
                    });
                }
                UserCreate.create(user, (err, user) => {
                    if (err) {
                        res.status(401).send({
                        message: "Error al registrar usuario",
                        });
                    }
                    let token = jwt.sign(
                        { user: user },
                        config.privateKey,
                        {expiresIn: moment().add(14, "days").unix(),
                    });
                    res.status(201).json({
                        message: "Usuario creado",
                        token: token,
                    });
                });
            // User.findOne({ email: user.email }, (err, data) => {
            //     if (
            //     !data ||
            //     data === null ||
            //     data === undefined ||
            //     Object.keys(data).length > 4
            //     ) {
            //     User.create(user, (err, user) => {
            //         if (err) {
            //             res.status(401).send({
            //                 message: "Error al registrar usuario",
            //             });
            //         }
            //         let token = jwt.sign({ user: user }, config.privateKey, {
            //             expiresIn: moment().add(14, "days").unix(),
            //         });
            //         res.status(201).json({
            //             message: "Usuario creado",
            //             token: token,
            //         });
            //     });
            //     } else {
            //     res.status(401).send({
            //         message: "Error user already exists",
            //     });
                // }
            // });
            });
        });
    };
}

module.exports = UserController;
