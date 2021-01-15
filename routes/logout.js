var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    if (req.session.user_id)
        delete req.session.user_id;
    if (req.session.access)
        delete req.session.access;
    res.redirect('/');
});

module.exports = router;