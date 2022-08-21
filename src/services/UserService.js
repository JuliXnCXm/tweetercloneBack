const UserController = require('../controllers/UserController')

class UserService {

    constructor() {
        this.objUserController = new UserController
    }

    updateUser = (req, res) => {
        return this.objUserController.updateUser(req, res)
    }

    findAndUpdate = (req, res) => {
        return this.objUserController.findAndUpdate(req, res)
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

    logout = (req, res) => {
        return this.objUserController.logout(req, res)
    }

    usernnameChecker = (req, res) => {
        return this.objUserController.usernnameChecker(req, res)
    }
}

module.exports = UserService