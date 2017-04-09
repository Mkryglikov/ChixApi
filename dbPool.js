const mysql = require('mysql');
const db = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'database',
    dateStrings: true,
    multipleStatements: true
};
module.exports = mysql.createPool(db);