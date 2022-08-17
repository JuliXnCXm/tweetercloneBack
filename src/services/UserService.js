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

    deleteUser = (req, res) => {
        return this.objUserController.deleteUser(req, res)
    }

    getUser = (req, res) => {
        return this.objUserController.getUser(req, res)
    }

    register = (req, res) => {
        return this.objUserController.register(req, res)
    }
    login = (req, res) => {
        return this.objUserController.login(req, res)
    }
}

module.exports = UserService