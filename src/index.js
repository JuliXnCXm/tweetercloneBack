const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
// const cookieParser = require("cookie-parser");
//imports
const { config } = require('./config/config');
const connDB = require("./database/Conndb");
const TweeterRouter = require("./routers/TweeterRouter");


class Server {

    constructor() {
        this.app = express();
        this.objConn =  new connDB();
    }

    #config() {
        this.app.use(morgan("dev"));
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(cookieParser());
        //static files
        this.app.use(express.static(path.join(__dirname, "storage")));

        //router
        const tweetRouter = new TweeterRouter;
        this.app.use("/api/tweets", tweetRouter)

        this.app.listen(config.port, () => {
            console.log(`Server is listening on port ${config.port}`);
        });
    }
}