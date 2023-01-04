const UserController = require('../controllers/UserController')

class UserService {

    constructor() {
        this.objUserController = new UserController
    }

    getUsers = (req, res) => {
        return this.objUserController.getUsers(req, res)
    }

    deleteUser = (req, res) => {
        return this.objUserController.deleteUser(req, res)
    }

    getUserShow = (req, res) => {
        return this.objUserController.getUserShow(req, res)
    }

    getExplorePeople = (req, res) => {
        return this.objUserController.getExplorePeople(req, res)
    };

    getUserMe = (req, res) => {
        return this.objUserController.getUsersMe(req, res)
    }

    logout = (req, res) => {
        return this.objUserController.logout(req, res)
    }

    usernameChecker = (req, res) => {
        return this.objUserController.usernameChecker(req, res)
    }

    updateUser = (req, res) => {
        return this.objUserController.updateUser(req, res)
    }

    updatePictures = (req, res) => {
        return this.objUserController.updateUserPictures(req, res);
    }

}

module.exports = UserService