const multer = require("multer");
const path = require("path");
const TokenController = require( "../controllers/TokenController" );

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../storage/img"));
  },
  filename: (req, file, cb) => {
    const objToken = new TokenController()
    let userInfo = objToken.decodeToken(req).user;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix +"." + file.mimetype.split("/")[1]);
  },
});

const multi_upload = multer({ storage: storage })

module.exports = multi_upload;
