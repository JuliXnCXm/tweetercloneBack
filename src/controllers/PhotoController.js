const Photo = require("../models/Photo");
const { User } = require("../models/User");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { config } = require("../config/config");
const path = require("path");
const bcrypt = require("bcrypt");
const TokenController = require("./TokenController");
const fs = require("fs");

class PhotoController {
    getPhoto = async (req, res) => {
        let { photoname } = req.params;
        const photo = await Photo.find({ photoname: photoname });
        res.sendFile(path.join(__dirname, `/../storage/img/${photoname}`));
    };

    createPhoto = async (req, res, user) => {
        Photo.create(
        {
            photoname: req.file.originalname,
            path: `storage/img/${req.file.filename}`,
            photourl: `${config.url}user/${req.file.originalname}`,
            mimetype: req.file.mimetype,
            created: new Date(),
            user_id: user.user._id,
        },
        (err, photo) => {
            if (!err) {
            photo.save();
            User.findByIdAndUpdate(
                user.user._id,
                { picture: photo.photourl },
                { new: true },
                (err, userUpdated) => {
                if (!err) {
                    return res.status(201).send({
                    message: "Photo updated",
                    user: userUpdated,
                    });
                }
                }
            );
            } else {
            return res.status(500).json({ message: "error", err });
            }
        }
        );
    };

    addPhoto = (req, res) => {
        const objToken = new TokenController();
        let user = jwt.decode(objToken.getToken(req, res), config.privateKey);
        Photo.deleteOne({ user_id: user.user._id }, (err, photoRemoved) => {
        if (Object.keys(photoRemoved).length > 1) {
            fs.unlink(
            path.join(__dirname, `/../storage/img/${photoRemoved.photoname}`),
            (err) => {
                if (!err) {
                return this.createPhoto(req, res, user);
                }
            }
            );
        } else {
            return this.createPhoto(req, res, user);
        }
        });
    };
}


module.exports = PhotoController