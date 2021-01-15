var express = require('express');
var router = express.Router();
var fs = require('fs');
var path;

router.get('/', function (req, res, next) {
    res.writeHead(200, {'Content-Type': 'image/jpg'});
    fs.exists('/profile-picture/' + req.query.id + '.jpg', function (exists) {
        if (exists) {
            fs.readFile('/profile-picture/' + req.query.id + '.jpg', function (err, data) {
                if (err)
                    return next(new Error("Error in read image file!!!"));
                res.end(data.toString('base64'));
            });
        } else {
            fs.readFile(__dirname + '/../public/images/default.jpg', function (err, data) {
                if (err)
                    return next(new Error("Error in read image file!!!"));
                res.end(data.toString('base64'));
            });
        }
    });
});

module.exports = router;
