const mongoose = require('mongoose');
const { cloud_db } = require("../database/Url");

class Conndb {
    constructor() {
        this.connection()
    }
    connection() {
        console.log('Connecting to database...');
        mongoose.connect(cloud_db, {
        });
        this.conn = mongoose.connection;
        this.conn.on('error', () => console.error.bind(console, 'connection error'));

        this.conn.once('open', () => console.info('Connection to Database is successful'));
    }
}

module.exports = Conndb ;