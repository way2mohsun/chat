exports.socket = socket;

var HashMap = require('hashmap').HashMap;
var user = new HashMap();
var mysql = require('mysql');

var db = mysql.createConnection(connection_paramters());

db.connect(function (err) {
    if (err)
        console.log(err);
});

function socket(io) {
    io.on('connection', function (socket) {

        var ev1 = !user.has(socket.request.session.user_id);
        var ev2 = (typeof socket.request.session.user_id !== 'undefined');

        if (ev1 && ev2) {
            console.log('connected to socket : ' + socket.request.session.user_id);
            user.set(socket.request.session.user_id, socket);
        }

        socket.on('disconnect', function () {
            if (user.has(socket.request.session.user_id)) {
                console.log('disconnected to socket : ' + socket.request.session.user_id);
                user.remove(socket.request.session.user_id);
            }
        });

        socket.on('new group', function (data) {
            data.name = data.name.trim();
            var id;
            db.query("INSERT INTO `user` (fname, lname, is_group) VALUES(?, '', 'true')", [data.name])
                .on('result', function (results) {
                    id = results.insertId;
                    var ins = '';
                    data.users.forEach(function (value, key) {
                        ins += '(' + id + ', ' + value + '),';
                    });
                    ins = require('../util/util').replaceBetween(ins, ins.length - 1, ins.length, '');
                    db.query("INSERT INTO `group` (group_id, user_id) VALUES " + ins);
                })
                .on('end', function () {
                    data.users.forEach(function (value, key) {
                        if (user.has(value)) {
                            user.get(value).emit('new group', {id: id, name: data.name});
                        }
                    });
                });
        });

        socket.on('new message', function (data) {

            id = Number(data.disUser);
            data.message = data.message.trim();
            //socket.request.dis_user = id;
            //socket.request.source_user = socket.request.session.user_id;
            //socket.request.message = data.message;


            var param = [socket.request.session.user_id, id,
                data.message.substring(0, 20),
                socket.request.session.user_id, id,
                socket.request.session.user_id, id];

            var query = "UPDATE last_message SET `from` = ?, `to` = ?, small_text = ? " +
                "WHERE (`from` = ? AND `to` = ?) OR (`to` = ? AND `from` = ?)";
            db.query(query, param)
                .on('result', function (update_results) {
                    if (update_results.affectedRows < 1) {
                        query = "INSERT INTO last_message(`from`, `to`, small_text) VALUES (?, ?, ?)";
                        db.query(query, [socket.request.session.user_id, id, data.message.substring(0, 20)]);
                    }
                })
                .on('end', function () {
                });


            db.query("INSERT INTO message (`from`, `to`, text) VALUES (? ,? ,?)",
                [socket.request.session.user_id, id, data.message]);


            var result = [];
            db.query("SELECT * FROM `group` WHERE group_id = ? AND user_id <> ?",
                [id, socket.request.session.user_id])
                .on('result', function (results) {
                    result.push(results);
                })
                .on('end', function () {
                    socket.emit('new message reply', {id: id, message: data.message});
                    if (user.has(id) && result.length < 1) {
                        user.get(id).emit('new message', {
                            id: socket.request.session.user_id,
                            message: data.message, fname: data.fname, lname: data.lname
                        });
                    } else {
                        result.forEach(function (value, key) {
                            if (user.has(value.user_id)) {
                                user.get(value.user_id).emit('new group message', {
                                    group: value.group_id,
                                    from: socket.request.session.user_id,
                                    message: data.message, fname: data.fname, lname: data.lname
                                });
                            }
                        });
                    }
                });
        });
    });
}