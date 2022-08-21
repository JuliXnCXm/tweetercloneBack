const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
// const cookieParser = require("cookie-parser");

//imports
const UsersRouter = require("./routers/UsersRouter");
const TweetsRouter = require("./routers/TweetsRouter");
const AuthRouter = require("./routers/AuthRouter");
const { config } = require('./config/config');
const connDB = require("./database/Conndb");


class Server {

    constructor() {
        this.objConn =  new connDB();
        this.app = express();
        this.#config()
    }

    #config() {
        this.app.use(morgan("dev"));
        this.app.use(cors());
        this.app.use(express.json());
        //static files
        this.app.use(express.static(path.join(__dirname, "storage")));

        //router
        const tweetRouter = new TweetsRouter();
        const usersRouter = new UsersRouter();
        const authRouter = new AuthRouter();

        this.app.use("/api/tweets", tweetRouter.router);
        this.app.use("/api/users", usersRouter.router);
        this.app.use("/api/auth", authRouter.router);

        // this.app.use(indexRouter);

        this.app.listen(config.port, () => {
            console.log(`Server is listening on port ${config.port}`);
        });
    }
}

new Server()