module.exports = {
    add: function (pool, req, callback) {
        pool.getConnection(function (err, connection) {
                if (!err) {
                    connection.query('INSERT INTO clients VALUES(NULL, "' + req.body.name + '", ' + req.body.phone + ', \'' + req.body.birthday + '\', 1, 0, "' + req.body.username + '", "' + req.body.password + '", "' + req.body.salt + '")', callback);
                    connection.release();
                } else
                    callback(err);
            }
        );
    },

    getById: function (pool, id, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM clients WHERE id = ' + id, callback);
                connection.release();
            } else
                callback(err);
        });
    },

    getByUsername: function (pool, username, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM clients WHERE username = "' + username + '"', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    update: function (pool, req, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('UPDATE clients SET name = "' + req.body.name + '", birthday  = "' + req.body.birthday + '", phone = "' + req.body.phone + '" WHERE id = ' + req.user[0]["id"], callback);
                connection.release();
            } else
                callback(err);
        });
    },

    delete: function (pool, id, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('DELETE FROM clients WHERE id =' + id + '; DELETE FROM auth WHERE id =' + id, callback);
                connection.release();
            }
            else
                callback(err);
        });
    }
};
