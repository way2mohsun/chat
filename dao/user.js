exports.checkingUser = checkingUser;
exports.get = get;
exports.createGroup = createGroup;
exports.createUser = createUser;
exports.del = del;
exports.forgotPass = forgotPass;

function checkingUser(req, callback) {
    var query = "select id, fname, lname, email from `user` where is_group = 'false' and email = ? and `password` = ? and `status` = 'true'";
    req.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            callback({access: false});
            return;
        }
        connection.query(query, [req.body.user, req.body.password], function (err, results) {
            if (err) {
                console.log(err);
                callback({access: false});
                return;
            }
            if (results.length !== 0) {
                req.session.user_id = results[0].id;
                callback({access: true, current_user: results[0]});
                return;
            }
            callback({access: false});
        });
    });
}

function get(req, callback) {
    req.getConnection(function (err, connection) {
        if (err) {
            callback(err);
            return;
        }
        connection.query("select * from `user` where status='true' and id != ? and is_group = 'false' " +
                "union " +
                "SELECT u.* from `group` g, `user` u WHERE user_id = ? and g.group_id = u.id and status = 'true'",
                [req.session.user_id, req.session.user_id], function (err, results) {
            callback(results);
        });
    });
}

function del(req, next, callback) {
    req.getConnection(function (err, connection) {
        if (err)
            return next(new Error("Connection Lost!!!"));
        connection.query("DELETE FROM `user` WHERE email = ?",
                [(req.body.email).trim().toLowerCase()], function (err, results) {
            if (err)
                return next(new Error("Error on delete user query"));
            callback(results);
        });
    });
}

function createGroup(req, next, callback) {
    req.getConnection(function (err, connection) {
        if (err) {
            callback(err);
            return;
        }
        connection.query("select * from `user` where status='true' and id != ? and is_group = 'false' " +
                "union " +
                "SELECT u.* from `group` g, `user` u WHERE user_id = ? and g.group_id = u.id and status = 'true'",
                [req.session.user_id, req.session.user_id], function (err, results) {
            callback(results);
        });
    });
}

function forgotPass(req, pool, callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            return next(new Error("Connection Lost!!!"));
        connection.query("DELETE FROM `user` WHERE email = ?",
                [req.newGroup.name], function (err, del) {
        });
    });
}

function createUser(fields, req, next, callback) {
    req.getConnection(function (err, connection) {
        if (err)
            return next(new Error("Connection Lost!!!"));
        var query = "SELECT count(*) cnt FROM `user` WHERE email = ?";
        connection.query(query,
                [fields["email"][0]], function (err, results) {
            if (results[0].cnt > 0 || err) {
                if (err)
                    return next(new Error("Error in Query : " + query));
                results.affectedRows = 0;
                callback(results);
                return;
            }
            query = "INSERT INTO `user` (fname, lname, email, password) VALUES(?,?,?,?)";
            var mail = fields["email"][0].trim().toLowerCase();
            connection.query(query, [fields["fname"][0].trim(), typeof fields["lname"][0] === 'undefined' ? '' : fields["lname"][0].trim(),
                mail, fields["password"][0]], function (err, insert) {
                if (err || insert.affectedRows < 1) {
                    if (err)
                        return next(new Error("Error in Query : " + query));
                    insert.affectedRows = 0;
                    callback(insert);
                    return;
                }
                //First make sure Sendmail is installed.
                var nodemailer = require('nodemailer');
                var transporter = nodemailer.createTransport();
                transporter.sendMail({
                    from: 'info@miniatel.com',
                    to: mail,
                    subject: "Chat Account",
                    text: 'Username : ' + mail + ' Password : ' + fields["password"][0]
                });
                callback(insert);
            });
        });
    });
}