const { UserSchema, User, UserCredentials } = require("../models/User");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const bcrypt = require("bcryptjs");
const boom = require("@hapi/boom");
const ConnDB = require("../database/Conndb");
const data  =  require("./MOCK_DATA.json")
class AuthController {

    register = async (req, res) => {
        const connection = new ConnDB()
        let user = req.body;
        const { error, value } = UserSchema.validate(user);
        if (error) {
            console.log(error)
            return res.status(400).send({
                message: "Invalid Schema : Error while registering user",
                info: error,
            });
        }

        const session = await connection.conn.startSession()
        try {
            session.startTransaction();
            // encrypt user password
            const salt = bcrypt.genSaltSync(10);
            user.password = bcrypt.hashSync(user.password, salt);

            // create user in userCredentials collection
            let userCreated = await UserCredentials.create([user], {session})
            let userInserted = await User.create([new User({
                user_info: {
                    user_id: userCreated[0]._id,
                    screenname: userCreated[0].email.split('@')[0],
                    name: userCreated[0].name,
                    lastname: userCreated[0].lastname,
                    description: userCreated[0].description,
                },
                following: undefined,
                followers: undefined,
                bookmarks: undefined,
                retweeted: undefined,
                favorited: undefined,
                favorited_comments: undefined,
                comments: undefined,
            })],{
                following: 0,
                followers: 0,
                bookmarks: 0,
                retweeted:0,
                favorited_comments:0,
                favorited: 0,
                comments: 0
            }, {session})
            if (userInserted && userInserted !== undefined && userInserted !== null) {
                let token = jwt.sign({ user: userInserted[0] }, config.privateKey, {
                    expiresIn: moment().add(14, "days").unix(),
                });
                await session.commitTransaction();
                res.status(201).json({
                    message: "Usuario creado",
                    token: token,
                    username: userInserted[0].user_info.screenname
                });
            }
        } catch (err) {
            await session.abortTransaction();
            if (err.name === "MongoServerError" && err.code === 11000) {
                return res
                .status(422)
                .send({ success: false, message: "User already exist!" });
            } else {
                res.status(500).json({
                    message: "Server Error: Error while trying to create user",
                });
            }
        }
        session.endSession();
    };

    login = async (req, res) => {
        const connection = new ConnDB();
        let user = req.body;
        let userCredentials = await UserCredentials.findOne({"email": user.email}).then((user) => {if (user && user !== null) return user});

        if (userCredentials !== null ) {
            User.findOne({ "user_info.user_id": userCredentials._id },  {
                following: 0,
                followers: 0 ,
                bookmarks: 0,
                retweeted:0,
                favorited: 0,
                favorited_comments: 0,
                comments: 0,
            })
            .then((data) => {
                bcrypt.compare(user.password, userCredentials.password, (err, result) => {
                    if (!!result) {
                        console.log(data)
                        let token = jwt.sign({ user: data }, config.privateKey, {
                        expiresIn: moment().add(14, "days").unix(),
                        });
                        return res.status(200)
                        .send({
                            message: "Usuario autenticado",
                            token: token,
                            username: data.user_info.screenname
                        });
                    } else {
                        return res.status(401)
                        .send({
                            message: "Error wrong credentials"
                        });
                    }
                });
            })
            .catch((err) => {
                console.log(err);
                res.status(404).send({
                    message: "Error al obtener usuario o usuario no encontrado",
                    info: err
                });
            });
        } else {
            res.status(404)
            .send({
                message: "Error , User does not exists"
            })
        }
    };
}

module.exports = AuthController;
