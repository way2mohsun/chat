var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user_id) {
        res.redirect('/home');
        return;
    }
    res.set('content-type', 'text/html');
    res.render('login.html');
});

router.post('/', function (req, res, next) {
    if (req.body.hasOwnProperty('functionality') &&
            req.body.functionality === 'login' &&
            req.body.hasOwnProperty('user') &&
            req.body.hasOwnProperty('password')) {
        if (req.session.user_id) {
            res.end();
            return;
        }
        require('../dao/user').checkingUser(req, function (results) {
            if (results.access) {
                res.json(results.current_user);
            } else {
                res.status(500);
                res.json('Username or Password is not correct!!!');
            }
        });
        return;
    }
    if (req.body.hasOwnProperty('functionality') &&
            req.body.functionality === 'forgot' &&
            req.body.hasOwnProperty('email')) {
    }
});

module.exports = router;