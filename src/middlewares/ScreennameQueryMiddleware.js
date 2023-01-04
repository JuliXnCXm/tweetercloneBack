
const ScreennameQueryMiddleware = (req, res, next) => {
    if (!req.query.screenname) return next(new Error("User Screenname must be provided"));
};
module.exports = ScreennameQueryMiddleware;
