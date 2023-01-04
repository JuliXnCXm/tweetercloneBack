const { Router } = require( "express" );
const MediaService = require("../services/MediaService");

class MediaRouter {

    constructor() {
        this.router = Router()
        this.#config()
    }

    #config() {
        const mediaService =  new MediaService()
        this.router.get("/:mediaName", mediaService.getMedia);
        this.router.post("/external/metadata", mediaService.getMediaURL);
    }
}

module.exports = MediaRouter;