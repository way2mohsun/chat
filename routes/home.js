var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.set('content-type', 'text/html');
    res.render('home.html');
});
//wget --post-data="get_users=10" http://localhost:9000/home
router.post('/', function (req, res, next) {

    if (req.body.hasOwnProperty('lg_email') && req.body.hasOwnProperty('lg_password')) {
        res.redirect('/home');
        return;
    }
    if (req.body.hasOwnProperty('functionality') && req.body.functionality === 'fetch-contact') {
        require('../dao/user').get(req, function (results) {
            res.json(results);
        });
        return;
    }
    if (req.body.hasOwnProperty('functionality') && req.body.functionality === 'conversation') {
        require('../dao/conversation').get(req, function (results) {
            res.json(results);
        });
        return;
    }

    if (req.body.hasOwnProperty('functionality') && req.body.functionality === 'group conversation') {
        require('../dao/conversation').group(req, function (results) {
            res.json(results);
        });
        return;
    }

    if (req.body.hasOwnProperty('functionality') && req.body.functionality === 'ip') {
        //req.headers.host 176.221.69.67:9090
        //req.headers.referer http://176.221.69.67:9090/home
        //req.socket.remoteAddress mikrotik ip interface 172.16.36.120
        //req.connection.remoteAddress mikrotik ip interface 172.16.36.120
        res.json({ip: req.headers.host});
        return;
    }
    
    if (req.body.hasOwnProperty('functionality') && req.body.functionality === 'last message') {
        require('../dao/conversation').lastMessage(req, function (results) {
            res.json(results);
        });
        return;
    }
        
});

module.exports = router;