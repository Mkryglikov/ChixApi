const pool = require('./dbPool');
const security = require('./security');
const bcrypt = require('bcrypt');
const oauth2orize = require('oauth2orize');
const passport = require('passport');
const crypto = require('crypto');
const Clients = require('./models/clients');
const AppTokens = require('./models/appTokens');
const AppRefreshTokens = require('./models/appRefreshTokens');
const server = oauth2orize.createServer();

// Обмен юзернейма/пароля на access token.
server.exchange(oauth2orize.exchange.password(function (app, username, password, done) {
    Clients.getByUsername(pool, username, function (err, clients) {
        client = clients[0];
        if (err) return done(err);
        if (!client) return done(null, false);
        bcrypt.hash(password, client['salt'], function (err, hash) {
            if (err) {
                console.log(err);
                return done(null, false);
            } else if (hash == client['password']) {
                let tokenValue = crypto.randomBytes(32).toString('base64');
                let refreshTokenValue = crypto.randomBytes(32).toString('base64');

                AppTokens.removeByIds(pool, client['id'], app['id'], function (err) {
                    if (err) return done(err);
                    AppTokens.add(pool, client['id'], app['id'], tokenValue, function (err) {
                        if (err) return done(err);
                        AppRefreshTokens.remove(pool, client['id'], app['id'], function (err) {
                            if (err) return done(err);
                            AppRefreshTokens.add(pool, client['id'], app['id'], refreshTokenValue, function (err) {
                                if (err) return done(err);
                                done(null, tokenValue, refreshTokenValue, {'expires_in': security.tokenLife});

                            });
                        });
                    });
                });
            }
            else
                return done(null, false);
        });
    });
}));

// Обмен refreshToken на access token.
server.exchange(oauth2orize.exchange.refreshToken(function (app, refreshToken, done) {
    AppRefreshTokens.getByToken(pool, refreshToken, function (err, tokens) {
        let token = tokens[0];
        if (err) {
            return done(err);
        }
        if (!token) {
            console.log("\nNO TOKEN OAUTH2\n");
            return done(null, false);
        }

        Clients.getById(pool, token['client_id'], function (err, client) {
            client = client[0];
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }

            let tokenValue = crypto.randomBytes(32).toString('base64');
            let refreshTokenValue = crypto.randomBytes(32).toString('base64');

            AppTokens.removeByIds(pool, client['id'], app['id'], function (err) {
                if (err) return done(err);
                AppTokens.add(pool, client['id'], app['id'], tokenValue, function (err) {
                    if (err) return done(err);
                    AppRefreshTokens.remove(pool, client['id'], app['id'], function (err) {
                        if (err) return done(err);
                        AppRefreshTokens.add(pool, client['id'], app['id'], refreshTokenValue, function (err) {
                            if (err) return done(err);
                            done(null, tokenValue, refreshTokenValue, {'expires_in': security.tokenLife});
                        });
                    });
                });
            });
        });
    });
}));

exports.token = [
    passport.authenticate(['oauth2-client-password'], {session: false}),
    server.token(),
    server.errorHandler()
];