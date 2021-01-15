var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.set('content-type', 'text/html');
    res.render('add-user.html');
});

router.post('/', function (req, res, next) {

    if (req.body.hasOwnProperty('functionality') && req.body.functionality === 'users') {
        require('../dao/user').get(req, function (callback) {
            var out;
            res.setHeader('Content-Type', 'application/octet-stream');
            out = '<table class="table table-striped" data-show-columns="true" style="width: 90%;" align="center">';
            out += '<thead>' +
                    '<tr>' +
                    '<td>Firsname</td>' +
                    '<td>Lastname</td>' +
                    '<td>Email</td>' +
                    '<td>Password</td>' +
                    '</tr>' +
                    '</thead>';
            for (var i = 0; i < callback.length; i++) {
                
                out += '<tr>';

                out += '<td>' + callback[i].fname + '</td>' +
                        '<td>' + callback[i].lname + '</td>' +
                        '<td>' + callback[i].email + '</td>' +
                        '<td>' + callback[i].password + '</td>';
                out += '</tr>';

            }
            out += '</table>';
            res.end(out, 'utf8');
        });
        return;
    }

    if (req.body.hasOwnProperty('functionality')) {
        if (req.body.functionality === 'delete user' && req.body.hasOwnProperty('email') && typeof req.body.email === 'undefined') {
            res.status(500);
            res.json('Email not fill !!!');
            return;
        }
        require('../dao/user').del(req, next, function (results) {
            if (results.affectedRows < 1) {
                res.status(500);
                res.json('Not found !!!');
                return;
            }
            res.json('Deleted it.');
        });
        return;
    }
    var multiparty = require('multiparty');
    var fs = require('fs');
    var easyimg = require('easyimage');
    var form = new multiparty.Form();
    form.uploadDir = '/profile-picture';
    form.encoding = 'utf-8';
    form.keepExtensions = true;
    form.autoFiles = false;

    form.on('file', function (name, file) {
    });

    form.on('aborted', function () {
    });

    form.on('error', function (err) {
        return next(err);
    });

    form.parse(req, function (err, fields, files) {
        if (err)
            return next(new Error("Error in parse fields !!!"));
        var check = checkPrarameters(fields, files);
        if (check.hasOwnProperty('message')) {
            res.status(500);
            res.json(check.message);
            return;
        }
        if (Object.getOwnPropertyNames(files).length === 0) {
            require('../dao/user').createUser(fields, req, next, function (callback) {
                if (callback.hasOwnProperty('affectedRows') && callback.affectedRows > 0) {
                    res.json('Created.');
                    return;
                }
                res.status(500);
                res.json('Duplicated?');
            });
            return;
        }
        require('../dao/user').createUser(fields, req, next, function (callback) {
            if (callback.hasOwnProperty('affectedRows') && callback.affectedRows > 0) {
                try {
                    easyimg.rescrop({
                        src: files.file[0].path,
                        dst: '/profile-picture/' + callback.insertId + '.jpg',
                        width: 300, height: 300,
                        cropwidth: 128, cropheight: 128,
                        x: 10, y: 10
                    }).then(function (image) {
                        fs.rename(files.file[0].path, '/profile-picture/' + callback.insertId + '-org.jpg', function (err) {
                            if (err)
                                console.log(err);
                        });
                    }, function (er) {
                        console.log(er);
                    });
                } catch (e) {
                    console.log(e);
                }
                res.json('Created.');
                return;
            }
            res.status(500);
            res.json('Duplicated?');
        });
    });
});

function checkPrarameters(fields, files) {
    if (typeof files === "undefined" ||
            typeof fields === "undefined") {
        return {message: 'One of the param was missed !'};
    }
    if (!fields.hasOwnProperty('email') ||
            !fields.hasOwnProperty('fname') ||
            !fields.hasOwnProperty('password')) {
        return {message: 'One of the param was not filled !!!'};
    }
    if (fields["email"][0].length === 0 ||
            fields["fname"][0].length === 0 ||
            fields["password"][0].length === 0) {
        return {message: 'One of the field was not complete !!!'};
    }
    return {};
}

module.exports = router;
