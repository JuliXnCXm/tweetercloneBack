var Meta = require("html-metadata-parser");
const path = require("path");

class MediaController {

    getMedia = (req, res) => {
        let { mediaName } = req.params;
        req.headers["Access-Control-Allow-Origin"] = "*";
        req.headers["Cross-Origin-Resource-Policy"] = "cross-origin";
        res.set("Access-Control-Allow-Origin", ["*"]);
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
        res.sendFile(path.join(__dirname, `/../storage/img/${mediaName}`));
    };

    getMediaURL = async (req, res) => {
        let {mediaURL} = req.body
        var result = await Meta.parser(mediaURL)
        try {
            if (Object.keys(result.og).length > 0 && Object.keys(result.images).length>0) {
                if (result) {
                    res.status(200).send(result)
                }
                else {
                    res.status(404).send("Url could not be found")
                }
            }
        } catch (e) {
            res.status(500).send("Server error ")
        }
    };
}

module.exports = MediaController;