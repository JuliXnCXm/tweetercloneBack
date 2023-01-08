const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
// const cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
//imports
const UsersRouter = require("./routers/UsersRouter");
const TweetsRouter = require("./routers/TweetsRouter");
const AuthRouter = require("./routers/AuthRouter");
const IndexRouter = require("./routers/IndexRouter");
const FollowsRouter = require("./routers/FollowsRouter");
const { config } = require('./config/config');
const { default: helmet } = require( "helmet" );
const MediaRouter = require( "./routers/MediaRouter" );

class Server {

    constructor() {
        this.app = express();
        this.#config()
    }

    #config() {
        this.app.use(morgan("dev"));
        this.app.use(bodyParser.json())
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.json());
        this.app.use(cors())
        this.app.use(helmet());
        //static files
        this.app.use(express.static(path.join(__dirname, "storage")));

        this.app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header(
                "Access-Control-Allow-Headers",
                "Origin, X-Requested-With, Content-Type, Accept"
            );
            next();
        });

        //router
        const indexRouter = new IndexRouter();
        const tweetRouter = new TweetsRouter();
        const usersRouter = new UsersRouter();
        const authRouter = new AuthRouter();
        const followsRouter = new FollowsRouter();
        const mediaRouter = new MediaRouter()

        this.app.use("/", indexRouter.router);
        this.app.use("/api/tweets", tweetRouter.router);
        this.app.use("/api/users", usersRouter.router);
        this.app.use("/api/auth", authRouter.router);
        this.app.use("/api/follows", followsRouter.router);
        this.app.use("/api/media", mediaRouter.router);

        this.app.listen(config.port, () => {
            console.log(`Server is listening on port ${config.port}`);
        });
    }
}

new Server()