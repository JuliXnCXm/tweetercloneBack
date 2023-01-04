const MediaController = require( "../controllers/MediaController" );

class MediaService {
    constructor() {
        this.objMediaController = new MediaController()
    }

    getMedia = (req, res) => {
        return this.objMediaController.getMedia(req, res);
    };


    getMediaURL = (req, res) => {
        return this.objMediaController.getMediaURL(req, res);
    }
}

module.exports = MediaService;
