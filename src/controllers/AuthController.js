const { UserSchema, User, UserCredentials } = require("../models/User");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const bcrypt = require("bcrypt");

class AuthController {

    register = async (req, res) => {
        let user = req.body;
        const { error, value } = UserSchema.validate(user);
        if (error) {
        return res.status(400).send({
            message: "Error while registering user",
            info: error,
        });
        }
        let userExist = await this.userExist(req);
        bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(value.password, salt, (err, hash) => {
            if (!!userExist) {
            return res.status(401).send({
                message: "Error user already exists",
            });
            }
            user.password = hash;
            UserCredentials.create(user)
            .then((userCreated) => {
                if (userCreated) {
                this.insertUser(res, user, userCreated);
                } else {
                this.rollbackUserCreation(
                    res,
                    userCreated._id,
                    "Error while creating user"
                );
                }
            })
            .catch((err) => {
                return res.status(500).send({
                message: "Error while trying to create user",
                });
            });
        });
        });
    };

    login = async (req, res) => {
        let user = req.body;
        let userExists = await this.userExist(req);
        User.findOne({ email: user.email })
        .then((data) => {
            bcrypt.compare(user.password, data.password, (err, result) => {
            if (!!result) {
                let token = jwt.sign({ user: data }, config.privateKey, {
                expiresIn: moment().add(14, "days").unix(),
                });
                return res.status(200).send({
                message: "Usuario autenticado",
                token: token,
                });
            }
            boom.unauthorized("Contraseña incorrecta");
            });
        })
        .catch((err) => {
            res.status(404).send({
            message: "Error al obtener usuario o usuario no encontrado",
            });
        });
    };

    rollbackUserCreation = (res, userCreatedId, message) => {
        UserCredentials.findByIdAndRemove(userCreatedId)
        .then(() => {
            res.status(200).send({
            message: message,
            });
            return res.redirect("/");
        })
        .catch((error) => {
            res.status(500).send({
            message: error,
            });
            return res.redirect("/");
        });
    };

    insertUser = async (res, user, userCreated) => {
        let newUser = new User({
            user_info: {
                user_id: userCreated._id,
                screenname: user.name
            },
        });
        return await User.create(newUser)
            .then((dataUser) => {
                if (dataUser) {
                let token = jwt.sign({ user: dataUser }, config.privateKey, {
                    expiresIn: moment().add(14, "days").unix(),
                });
                return res.status(201).json({
                    message: "Usuario creado",
                    token: token,
                });
                }
            })
            .catch((err) => {
                this.rollbackUserCreation(
                res,
                userCreated._id,
                "Error al registrar Usuario"
                );
            });
    };

    userExist = async (req) => {
        let user = req.body;
        let userExist = await UserCredentials.findOne({ email: user.email });
        return userExist;
    };
}

module.exports = AuthController;
