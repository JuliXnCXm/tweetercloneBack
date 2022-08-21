
const TokenController = require("../controllers/TokenController");

module.exports = ( req, res, next ) =>
{
    const objTokenController = new TokenController();
    let token = objTokenController.verifyToken( req, res );
    if ( token )
        res.setHeader( 'Authorization', `Bearer: ${ token }` );
    else
        next( new Error( 'Token required' ), res.redirect( "/" ) );
    next();
};
