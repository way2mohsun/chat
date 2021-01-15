/* global __dirname, process */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var connection = require('express-myconnection');
var debug = require('debug')('chat:server');
var app = express();
var http = require('http');
var server = http.createServer(app);
var port = normalizePort(process.env.PORT || '9000');

var ses = session({
    resave: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    },
    saveUninitialized: true,
    secret: 'uwotm8'
});

//var ses = session({ secret: 'keyboard cat', cookie: { maxAge: 1000 * 60 * 60 * 24 }});

app.use(ses);

app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Database config options
//var conn = JSON.parse(require('fs').readFileSync(__dirname + '/package.json', 'utf8')).ConnectionProperty;
var conn = require(__dirname + '/package.json').ConnectionProperty;

global.connection_paramters = function () {
    return conn;
};

var pool = connection(mysql, conn, 'pool');
app.use(pool);

// Start Socket.io so it attaches itself to Express server
var io = require('socket.io')(server);

io.use(function (socket, next) {
    ses(socket.request, socket.request.res, next);
    //io.pool = mysql.createPool(conn);
});

require('./handler/socket').socket(io);

//require('./handler/audio-rtc').audioRTC(server, io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', require('ejs').renderFile);
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/logo.png'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/css", express.static(__dirname + '/css'));
app.use("/img", express.static(__dirname + '/public/images'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/jquery", express.static(__dirname + '/public/jquery-2.1.4'));
app.use("/bootstrap", express.static(__dirname + '/public/bootstrap-3.3.5'));
app.use("/bootstrap-table", express.static(__dirname + '/public/bootstrap-table-1.3.0'));
app.use("/moment", express.static(__dirname + '/public/moment/moment.min.js'));
app.use("/dp", express.static(__dirname + '/public/jalali-datepicker'));
app.use("/util", express.static(__dirname + '/util/4web'));
//app.use("/easyrtc", express.static(__dirname + '/public/easyrtc'));

app.use('/', require('./routes/login'));
app.use('/logout', require('./routes/logout'));
app.use('/home', requireLogin, require('./routes/home'));
app.use('/image', require('./routes/image'));
app.use('/add', requireAccess, require('./routes/add-user'));
//app.use('/r', require('./routes/rtc-mock'));

function requireLogin(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.redirect("/");
    }
}

function requireAccess(req, res, next) {
    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }
    if (req.session.user_id === 1) {
        next();
    } else {
        res.redirect('/logout');
    }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.set('content-type', 'text/html');
    res.render('error.html');
});

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = app;
