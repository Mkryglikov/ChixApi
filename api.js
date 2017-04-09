'use strict';
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const async = require('async');
const bodyParser = require('body-parser');
const Sugar = require('sugar');
const spdy = require('spdy');
const fs = require('fs');
const busboy = require('connect-busboy');
const compression = require('compression');
const pool = require('./dbPool');
const Oauth2 = require('./oauth2');
const Orders = require('./models/orders');
const Clients = require('./models/clients');
const Tobaccos = require('./models/tobaccos');
const Extras = require('./models/extras');

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(compression());
app.use(passport.initialize());
app.use(express.static(__dirname + '/public'));

require('./auth');

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/mkryglikov.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/mkryglikov.ru/fullchain.pem')
};

app.post('/login', Oauth2.token);

app.get('/verifytoken', passport.authenticate('bearer', {session: false}), function (req, res) {
    res.sendStatus(200);
});

app.post('/client', function (req, res) {
    if (req.body.name && req.body.phone && req.body.birthday && req.body.username && req.body.password) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.body.password, salt, function (err, hash) {
                if (!err) {
                    req.body.password = hash;
                    req.body.salt = salt;
                    Clients.add(pool, req, function (err) {
                        if (!err)
                            res.sendStatus(200);
                        else {
                            console.log(err);
                            res.sendStatus(500);
                        }
                    })
                } else {
                    res.sendStatus(500);
                    console.log(err);
                }
            });
        });
    } else {
        res.status(400);
        res.send('Set username, password, name, phone and birthday');
    }
});

app.get('/client', passport.authenticate('bearer', {session: false}), function (req, res) {
    Clients.getById(pool, req.user[0]["id"], function (err, rows) {
        if (!err) {
            delete rows[0]["password"];
            delete rows[0]["salt"];
            res.status(200);
            res.json(rows[0]);
        } else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

app.put('/client', passport.authenticate('bearer', {session: false}), function (req, res) {
    Clients.update(pool, req, function (err) {
        if (!err) {
            res.sendStatus(200);
        } else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

app.post('/clientAvatar', passport.authenticate('bearer', {session: false}), busboy(), function (req, res) { //fixme костыль
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        let fstream;
        fstream = fs.createWriteStream(__dirname + "/public/avatars/" + req.user[0]["id"].toString() + ".jpg");
        file.pipe(fstream);
        fstream.on('close', function () {
            res.sendStatus(200);
        });
    });
});

app.delete('/client', passport.authenticate('bearer', {session: false}), function (req, res) {
    Clients.delete(pool, req.user[0]["id"], function (err) {
        if (!err)
            res.status(200);
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});


app.post('/orders', passport.authenticate('bearer', {session: false}), function (req, res) {
    async.parallel({
        tobaccosSum: function (callback) {
            if (req.body.tobacco) {
                req.body.tobacco = (req.body.tobacco).replace(/, /g, ",");
                req.body.tobacco = Sugar.String.capitalize(req.body.tobacco, true, true);

                let tobaccosTotal = 0;
                let orderTobaccos = req.body.tobacco.split(",");
                Tobaccos.getAll(pool, function (err, allTobaccos) {
                    let counter = 0;
                    for (let orderTobacco of orderTobaccos) {
                        for (let tobacco of allTobaccos) {
                            if (orderTobacco == tobacco['name']) {
                                tobaccosTotal += tobacco['price'];
                            }
                        }
                        counter++;
                        if (counter == orderTobaccos.length) {
                            callback(null, tobaccosTotal);
                        }
                    }
                });
            }
        },
        extrasSum: function (callback) {
            if (req.body.extra) {
                req.body.extra = (req.body.extra).replace(/, /g, ",");
                req.body.extra = Sugar.String.capitalize(req.body.extra, true, true);

                let extrasTotal = 0;
                let orderExtras = req.body.extra.split(",");
                Extras.getAll(pool, function (err, allExtras) {
                    let counter = 0;
                    for (let orderExtra of orderExtras) {
                        for (let extra of allExtras) {
                            if (orderExtra == extra['name']) {
                                extrasTotal += extra['price'];
                            }
                        }
                    }
                    counter++;
                    if (counter == orderExtras.length) {
                        callback(null, extrasTotal);
                    }
                });
            }

        }
    }, function (err, results) {
        req.body.total = results['tobaccosSum'] + results['extrasSum'];
        Orders.add(pool, req, function (err) {
            if (!err)
                res.sendStatus(200);
            else {
                console.log(err);
                res.sendStatus(500);
            }
        });
    });


});

app.get('/orders', passport.authenticate('bearer', {session: false}), function (req, res) {

    Orders.getAll(pool, req.user[0]["id"], function (err, rows) {
        if (!err && Object.keys(rows).length != 0) {
            res.status(200);
            res.json(rows);
        }
        else if (Object.keys(rows).length == 0)
            res.sendStatus(404);
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

app.get('/orders/active', passport.authenticate('bearer', {session: false}), function (req, res) {

    Orders.getActive(pool, req.user[0]["id"], function (err, rows) {
        if (!err && Object.keys(rows).length != 0) {
            res.status(200);
            res.json(rows);
        }
        else if (Object.keys(rows).length == 0)
            res.sendStatus(404);
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

app.get('/orders/:id', passport.authenticate('bearer', {session: false}), function (req, res) {
    Orders.getById(pool, req.user[0]["id"], req.params.id, function (err, rows) {
        if (!err && Object.keys(rows).length != 0) {
            res.status(200);
            res.json(rows[0]);
        }
        else if (Object.keys(rows).length == 0)
            res.sendStatus(404);
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

app.put('/orders/:id', passport.authenticate('bearer', {session: false}), function (req, res) {
    async.parallel({
        tobaccosSum: function (callback) {
            if (req.body.tobacco) {
                req.body.tobacco = (req.body.tobacco).replace(/, /g, ",");
                req.body.tobacco = Sugar.String.capitalize(req.body.tobacco, true, true);

                let tobaccosTotal = 0;
                let orderTobaccos = req.body.tobacco.split(",");
                Tobaccos.getAll(pool, function (err, allTobaccos) {
                    if (!err) {
                        let counter = 0;
                        for (let orderTobacco of orderTobaccos) {
                            for (let tobacco of allTobaccos) {
                                if (orderTobacco == tobacco['name']) {
                                    tobaccosTotal += tobacco['price'];
                                }
                            }
                            counter++;
                            if (counter == orderTobaccos.length) {
                                callback(null, tobaccosTotal);
                            }
                        }
                    } else {
                        callback(err);
                        console.log(err);
                    }
                });
            }
        },
        extrasSum: function (callback) {
            if (req.body.extra) {
                req.body.extra = (req.body.extra).replace(/, /g, ",");
                req.body.extra = Sugar.String.capitalize(req.body.extra, true, true);

                let extrasTotal = 0;
                let orderExtras = req.body.extra.split(",");
                Extras.getAll(pool, function (err, allExtras) {
                    if (!err) {
                        let counter = 0;
                        for (let orderExtra of orderExtras) {
                            for (let extra of allExtras) {
                                if (orderExtra == extra['name']) {
                                    extrasTotal += extra['price'];
                                }
                            }

                            counter++;
                            if (counter == orderExtras.length) {
                                callback(null, extrasTotal);
                            }
                        }
                    } else {
                        callback(err);
                        console.log(err);
                    }
                });
            }
        }
    }, function (err, results) {
        if (!err) {
            req.body.total = results['tobaccosSum'] + results['extrasSum'];
            Orders.update(pool, req, function (err) {
                if (!err)
                    res.sendStatus(200);
                else {
                    console.log(err);
                    res.sendStatus(500);
                }
            })
        } else {
            console.log(err);
        }
    });
});

app.delete('/orders/:id', passport.authenticate('bearer', {session: false}), function (req, res) {
    Orders.delete(pool, req.params.id, function (err) {
        if (!err)
            res.sendStatus(200);
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});


app.get('/tobaccos', passport.authenticate('bearer', {session: false}), function (req, res) {
    Tobaccos.getAll(pool, function (err, rows) {
        if (!err) {
            res.status(200);
            res.json(rows);
        }
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

app.get('/extras', passport.authenticate('bearer', {session: false}), function (req, res) {
    Extras.getAll(pool, function (err, rows) {
        if (!err) {
            res.status(200);
            res.json(rows);
        }
        else {
            console.log(err);
            res.sendStatus(500);
        }
    })
});

spdy
    .createServer(options, app)
    .listen(3002, (error) => {
        if (error) {
            console.error(error);
            return process.exit(1)
        } else {
            console.log('API сервер запущен: 3002');
        }
    });

