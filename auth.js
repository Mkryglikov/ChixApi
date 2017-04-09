const pool = require('./dbPool');
const security = require('./security');
const passport = require('passport');
const Oauth2AppStrategy = require('passport-oauth2-client-password').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const Clients = require('./models/clients');
const Apps = require('./models/apps');
const AppTokens = require('./models/appTokens');

passport.use(new Oauth2AppStrategy(function (appId, appSecret, done) {
        Apps.getById(pool, appId, function (err, apps) {
            app = apps[0];
            if (err) {
                console.log(err);
                return done(err);
            }
            if (!app) {
                return done(null, false);
            }
            if (app["secret"] != appSecret) {
                return done(null, false);
            }

            return done(null, app);
        });
    }
));

passport.use(new BearerStrategy(function (appToken, done) {
        AppTokens.getByToken(pool, appToken, function (err, tokens) {
            if (err) {
                console.log(err);
                return done(err);
            }
            if (!tokens[0]) {
                console.log(appToken);
                console.log("\nNO TOKEN AUTH\n");
                return done(null, false);
            }

            if (Math.round((Date.now() - Date.parse(tokens[0]["created"])) / 1000) > security.tokenLife) {
                AppTokens.removeByToken(pool, tokens[0], function (err) {
                    if (err) {
                        console.log(err);
                        return done(err);
                    }
                });
                return done(null, false, {message: 'Token expired'});
            }

            Clients.getById(pool, tokens[0]['client_id'], function (err, client) {
                if (err) {
                    console.log(err);
                    return done(err);
                }
                if (!client) {
                    console.log("NO CLIENT");
                    return done(null, false, {message: 'Unknown user'});
                }
                done(null, client);
            });
        });
    }
));