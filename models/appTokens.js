module.exports = {
    getByToken: function (pool, token, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('SELECT * FROM app_tokens WHERE token = "' + token + '"', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    add: function (pool, client_id, app_id, token, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('INSERT INTO app_tokens VALUES (' + client_id + ', "' + app_id + '", "' + token + '", NULL)', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    removeByToken: function (pool, token, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('DELETE FROM app_tokens WHERE token = "' + token + '"', callback);
                connection.release();
            } else
                callback(err);
        });
    },

    removeByIds: function (pool, clientId, appId, callback) {
        pool.getConnection(function (err, connection) {
            if (!err) {
                connection.query('DELETE FROM app_tokens WHERE client_id=' + clientId + ' AND app_id="' + appId + '"', callback);
                connection.release();
            } else
                callback(err);
        });
    }
};
