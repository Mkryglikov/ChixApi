module.exports = {
    add: function (pool, req, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                console.log(req.body.total);
                connection.query('INSERT INTO orders VALUES(NULL,' + req.user[0]["id"] + ',' + (req.body.desk == 0 ? 'NULL' : req.body.desk) + ',\'' + req.body.tobacco + '\', \'' + req.body.extra + '\', \'' + req.body.date + '\', \'' + req.body.time + '\', NULL, ' + req.body.total + ', 0)', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    getAll: function (pool, clientId, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM orders WHERE client_id = '
                    + clientId + ' ORDER BY date DESC', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    getById: function (pool, userId, orderId, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM orders WHERE id = ' + orderId + ' AND client_id = ' + userId + ' ORDER BY date DESC', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    getActive: function (pool, clientId, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM orders WHERE client_id = ' + clientId + ' AND completed = 0 ORDER BY date DESC', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    update: function (pool, req, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('UPDATE orders SET desk=' + req.body.desk + ', tobacco="' + req.body.tobacco + '", extra="' + req.body.extra + '", date="' + req.body.date + '", in_time="' + req.body.time + '", total=' + req.body.total + ' WHERE id = ' + req.params.id, callback);
                connection.release();
            } else
                callback(err);
        });
    },

    delete: function (pool, id, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('DELETE FROM orders WHERE id =\'' + id + '\'', callback);
                connection.release();
            } else
                callback(err);
        });
    }
};
