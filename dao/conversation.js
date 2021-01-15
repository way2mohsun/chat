exports.get = get;
exports.group = group;
exports.newMessage = newMessage;
exports.lastMessage = lastMessage;

function get(req, callback) {
    var query = "SELECT m.`from`, m.`to`, m.text, u.fname, u.lname, DATE_FORMAT(m.`date` ,'%Y-%m-%d %H:%i:%S') `date` FROM message m, `user` u " +
            "WHERE u.status = 'true' AND (m.`from` = " + req.session.user_id + " OR m.`from` = " + req.body.id + " )" +
            " AND (m.`to` = " + req.body.id + " OR m.`to` = " + req.session.user_id + ") AND u.id = " + req.body.id + " ORDER BY m.`date` limit 30";
    req.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            callback({});
            return;
        }
        connection.query(query, function (err, results) {
            if (err) {
                console.log(err);
                callback({});
                return;
            }
            callback(results);
        });
    });
}

function group(req, callback) {
    var query = "SELECT u.id, u.fname, u.lname, m.text, m.`from`, DATE_FORMAT(m.`date` ,'%Y-%m-%d %H:%i:%S') `date` FROM message m, `user` u WHERE m.`from` = u.id AND `to` = ? AND u.status = 'true' ORDER BY m.`date` limit 30";
    req.getConnection(function (err, connection) {
        connection.query(query, [req.body.id], function (err, results) {
            callback(results);
        });
    });
}

function newMessage(req, pool, callback) {

    var query = "UPDATE last_message SET `from` = ?, `to` = ?, small_text = ? " +
            "WHERE (`from` = ? AND `to` = ?) OR (`to` = ? AND `from` = ?)";

    pool.getConnection(function (err, connection) {
        connection.query(query, [req.source_user, req.dis_user, req.message.trim().substring(0, 20), req.source_user, req.dis_user, req.source_user, req.dis_user], function (err, update_results) {
            if (update_results.affectedRows < 1) {
                query = "INSERT INTO last_message(`from`, `to`, small_text) VALUES (?, ?, ?)";
                connection.query(query, [req.source_user, req.dis_user, req.message.trim().substring(0, 20)], function (err, ins) {

                });
            }
            query = "INSERT INTO message (`from`, `to`, text) VALUES (? ,? ,?)";
            connection.query(query, [req.session.user_id, req.dis_user, req.message.trim()], function (err, results) {
                query = "SELECT * FROM `group` WHERE group_id = ? AND user_id <> ?";
                connection.query(query, [req.dis_user, req.session.user_id], function (err, grp) {
                    callback(grp);
                });
            });
        });
    });
}

function lastMessage(req, callback) {
    var query = "SELECT `from`, `to`, small_text FROM last_message WHERE `from` = ? OR `to` = ?";
    req.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            callback({});
            return;
        }
        connection.query(query, [req.session.user_id, req.session.user_id], function (err, results) {
            if (err) {
                console.log(err);
                callback({});
                return;
            }
            callback(results);
        });
    });
}