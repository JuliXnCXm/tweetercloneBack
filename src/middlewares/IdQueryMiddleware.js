
const IdQueryMiddleware = (req, res, next) => {
    if (!req.query.user_id) return next(new Error("User Id must be provided"));
}
module.exports = IdQueryMiddleware;
