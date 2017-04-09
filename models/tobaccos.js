module.exports = {
    getAll: function (pool, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM tobacco', callback);
                connection.release();
            } else
                callback(err);
        })
    }
};
