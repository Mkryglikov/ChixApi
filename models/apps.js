module.exports = {
    getById: function (pool, id, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM apps WHERE id = "' + id + '"', callback);
                connection.release();
            } else
                callback(err);
        });
    },
    add: function (pool, id, secret, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('INSERT INTO apps VALUES ("' + id + '", "' + secret + '"); SELECT * FROM apps WHERE id = "' + id + '"', callback);
                connection.release();
            } else
                callback(err);
        });
    }
};