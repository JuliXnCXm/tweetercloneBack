const { config } = require("../config/config");

module.exports = {
    cloud_db: `mongodb+srv://${config.dbUser}:${config.dbPassword}@${config.dbHost}/${config.dbName}`,
};
