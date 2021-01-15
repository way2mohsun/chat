/*$(document).ready(function () {
 if (window.webkitNotifications && !window.webkitNotifications.checkPermission() === 0) {
 window.webkitNotifications.requestPermission(function () {});
 }
 if (window.webkitNotifications) {
 window.webkitNotifications.createNotification('mike.png', data.message, data.fname).show();
 }
 });*/

var socket;
var disUser;
var currentUser;
var users = {};
var group_selected_users = [];
var messages = {};// base on distination user

var message_log = '<div class="media msg">' +
        '<a class="pull-left" href="#">' +
        '   <img  class="media-object img-circle" style="width: 50px; height: 50px;" src="IMAGE">' +
        '</a>' +
        '<div class="media-body">' +
        '    <small class="pull-right time" title="TIMESTAMP"><i class="fa fa-clock-o"></i>DATE</small>' +
        '    <h5 class="media-heading">NAME</h5>' +
        '    <small class="col-lg-10">MESSAGE</small>' +
        '</div>' +
        '</div>';

var user_log = '<div class="media conversation" id="mc-ID">' +
        '<a id="conversation-ID" class="pull-left" href="#">' +
        '<img id="user-ID" class="media-object img-circle" data-src="holder.js/64x64" alt="64x64" style="width: 50px; height: 50px;">' +
        '</a>' +
        '<div class="media-body">' +
        '<h5 class="media-heading"><b>NAME</b></h5>' +
        '<small id="last-message-ID"></small>' +
        '</div>' +
        '</div>';

var group_log = '<div class="media conversation" id="mc-ID">' +
        '<a id="conversation-ID" class="pull-left" href="#">' +
        '<img id="group-ID" class="media-object img-circle" data-src="holder.js/64x64" alt="64x64" style="width: 50px; height: 50px;">' +
        '</a>' +
        '<div class="media-body">' +
        '<h5 class="media-heading"><b>NAME</b></h5>' +
        '<small id="last-message-ID"></small>' +
        '</div>' +
        '</div>';

$(document).ready(function () {
    currentUser = JSON.parse(localStorage.getItem("current user"));
    $.ajax({async: false, type: 'POST', url: "home",
        data: {functionality: 'ip'},
        success: function (data) {
            socketConnection(data.ip);
        }
    });
});

$(document).ready(function () {
    //$(".msg-wrap").append('<div class="alert alert-info msg-date"><strong>Today</strong></div>');
    $('#message-text').hide();
    $('#file-message').hide();
    $(".send-wrap").append('<div id="help-selection">' +
            '<br><br><br><br>' +
            '<small class="pull-left"><i class="fa"></i><b>Click a number of list !!!</b></small>' +
            '<br><br><br><br>' +
            '</div>');
    $('#msg-wrap').remove();
    $.ajax({async: false, type: 'POST', url: "home",
        data: {
            functionality: 'fetch-contact'
        },
        success: function (data) {
            $.each(data, function (i, item) {
                if (item.is_group === 'true') {
                    $("#contacts").append(group_log.replace(/ID/g, item.id).replace('NAME', item.fname));
                    users[item.id] = {fname: item.fname, lname: item.lname, isGroup: true};
                } else {
                    $("#contacts").append(user_log.replace(/ID/g, item.id).replace('NAME', item.fname + ' ' + item.lname));
                    users[item.id] = {fname: item.fname, lname: item.lname, isGroup: false};
                }
            });
        }
    });
    $.ajax({async: false, type: 'POST', url: "home",
        data: {
            functionality: 'last message'
        },
        success: function (data) {
            $('#msg-wrap').remove();
            $.each(data, function (i, item) {
                if (currentUser.id === item.from) {
                    $('#last-message-' + item.to).text('you : ' + item.small_text + ' ...');
                } else {
                    $('#last-message-' + item.from).text(item.small_text + ' ...');
                }
            });
        }
    });
    for (var key in users) {
        $.ajax({async: false, type: 'get', url: "image",
            data: {id: key},
            success: function (data) {
                users[key].image = 'data:image/png;base64,' + data;
                if (users[key].isGroup) {
                    $('#group-' + key).attr('src', 'data:image/png;base64,' + data);
                } else {
                    $('#user-' + key).attr('src', 'data:image/png;base64,' + data);
                }
            }
        });
    }
});

$(document).on('click', '#new-group', function (e) {
    $("#user-suggestion").html("");
    for (var key in users) {
        if (users[key].isGroup)
            continue;
        $("#user-suggestion").append('<label>' + users[key].fname + '</label>' +
                '<div class="material-switch pull-right" id="ngu-' + key + '">' +
                '    <input id="ng-' + key + '" name="someSwitchOption' + key + '" type="checkbox"/>' +
                '    <label for="ng-' + key + '" class="label-success"></label>' +
                '</div>' +
                '<br><br>');
    }
});

$(document).on('click', '#send-message', function (e) {
    sendMessage();//socket.emit('new message', {sourceUser: currentUser.fname + ' ' + currentUser.lname, disUser: disUser, message: $('#message-text').val()});
    return false;
});

$(document).on('keyup', '#message-text', function (event) {
    if (event.keyCode === 13) {
        sendMessage();
    }
});

function socketConnection(ip) {
    socket = io.connect('http://' + ip, {'forceNew': true});

    socket.on('new message reply', function (data) {
        console.log(data.message);
        if (disUser === data.id) {
            $("#msg-wrap").append(message_log
                    .replace('DATE', moment(gToday(), 'YYYY-MM-DD hh:mm:ss').fromNow())
                    .replace('TIMESTAMP', gToday())
                    .replace('MESSAGE', data.message)
                    .replace('IMAGE', currentUser.image)
                    .replace('NAME', currentUser.fname + ' ' + currentUser.lname));
        }
        if (messages.hasOwnProperty(data.id)) {
            messages[data.id].push({to: data.id, from: currentUser.id, text: data.message, fname: currentUser.fname, lname: currentUser.lname, date: gToday()});
        }
        if (data.message.length > 20) {
            $('#last-message-' + data.id).text('you : ' + data.message.substring(0, 20) + ' ...');
        } else {
            $('#last-message-' + data.id).text('you : ' + data.message);
        }
        $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
    });

    socket.on('new message', function (data) {
        if (messages.hasOwnProperty(data.id)) {
            messages[data.id].push({to: currentUser.id, from: data.id, text: data.message, fname: data.fname, lname: data.lname, date: gToday()});
        }
        if (data.message.length > 20) {
            $('#last-message-' + data.id).text(data.message.substring(0, 20) + ' ...');
        } else {
            $('#last-message-' + data.id).text(data.message);
        }
        if (data.id === disUser) {
            $("#msg-wrap").append(message_log
                    .replace('DATE', moment(gToday(), 'YYYY-MM-DD hh:mm:ss').fromNow())
                    .replace('TIMESTAMP', gToday())
                    .replace('MESSAGE', data.message)
                    .replace('IMAGE', users[disUser].image)
                    .replace('NAME', data.fname + ' ' + data.lname));
            $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
        } else {
            $('#last-message-' + data.id).css('font-style', 'italic');
        }
        var cpy = $('#mc-' + data.id).clone();
        $('#mc-' + data.id).remove();
        $("#contacts").prepend(cpy);
    });

    socket.on('new group', function (data) {
        $("#contacts").prepend(user_log.replace(/ID/g, data.id).replace('NAME', data.name));
        $.ajax({async: false, type: 'get', url: "image",
            data: {id: data.id},
            success: function (img) {
                //users[key].image = 'data:image/png;base64,' + img;
                $('#user-' + data.id).attr('src', 'data:image/png;base64,' + img);
                users[data.id] = {fname: data.name, isGroup: true};
            }
        });
    });

    socket.on('new group message', function (data) {
        if (messages.hasOwnProperty(data.group)) {
            messages[data.group].push({to: data.group, from: data.from, text: data.message, fname: data.fname, lname: data.lname, date: gToday()});
        } else {
            messages[data.group] = [];
            messages[data.group].push({to: data.group, from: data.from, text: data.message, fname: data.fname, lname: data.lname, date: gToday()});
        }
        if (data.message.length > 20) {
            $('#last-message-' + data.id).text(data.message.substring(0, 20) + ' ...');
        } else {
            $('#last-message-' + data.id).text(data.message);
        }
        if (data.group === disUser) {
            $("#msg-wrap").append(message_log
                    .replace('DATE', moment(gToday(), 'YYYY-MM-DD hh:mm:ss').fromNow())
                    .replace('TIMESTAMP', gToday())
                    .replace('MESSAGE', data.message)
                    .replace('IMAGE', users[data.from].image)
                    .replace('NAME', data.fname + ' ' + data.lname));
            $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
        } else {
            $('#last-message-' + data.id).css('font-style', 'italic');
        }
    });
}

function sendMessage() {
    $('#message-text').prop('readonly', false);
    if ($('#message-text').val().length > 0) {
        socket.emit('new message', {fname: currentUser.fname, lname: currentUser.lname, disUser: disUser, message: $('#message-text').val()});
        $('#message-text').val('');
    }
}

$(document).on('click', 'div[id^="ngu-"] :checkbox', function (e) {
    var sid = Number(this.id.replace('ng-', ''));
    if ($(this).is(':checked')) {
        group_selected_users.push(sid);
    } else {
        var index = group_selected_users.indexOf(sid);
        if (index > -1) {
            group_selected_users.splice(index, 1);
        }
    }
});

$(document).on('click', '#save', function (e) {
    $('#new-group-panel').modal('toggle');
    group_selected_users.push(currentUser.id);
    if (group_selected_users.length > 1) {
        socket.emit('new group', {users: group_selected_users, name: $('#group-name').val()});
    }
});

$(document).on('mouseover', 'div[id^="mc-"]', function (e) {
    //console.log('over' + this.id)
    //$('#mc-' + this.id).css('background-color', 'rgb(245,245,245)');
});

$(document).on('mouseleave', 'div[id^="mc-"]', function (e) {
    //$('#contacts').css('background-color', 'rgb(255,255,255)');
    //console.log('leave' + this.id)
});

$(document).on('click', 'img[id^="group-"]', function (e) {
    $("#message-text").focus();
    $('#file-message').show();
    $('#help-selection').remove();
    disUser = Number(this.id.replace('group-', ''));
    $('#last-message-' + disUser).css('font-style', '');
    if (messages.hasOwnProperty(disUser)) {
        $('#message-text').show();
        $("#msg-wrap").remove();
        $(".msg-wrap").append('<div id="msg-wrap"></div>');
        $.each(messages[disUser], function (i, item) {
            if (item.from === currentUser.id) {
                $("#msg-wrap").append(message_log
                        .replace('DATE', moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow())
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', currentUser.image)
                        .replace('NAME', currentUser.fname + ' ' + currentUser.lname));
            } else {
                $("#msg-wrap").append(message_log
                        .replace('DATE', moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow())
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', users[item.from].image)
                        .replace('NAME', item.fname + ' ' + item.lname));
            }
        });
        $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
        return;
    }
    messages[disUser] = [];
    var message;
    $('#msg-wrap').remove();
    $.ajax({async: false, type: 'POST', url: "home",
        data: {
            functionality: 'group conversation', id: disUser
        },
        success: function (data) {
            message = data;
        }
    });
    $(".msg-wrap").append('<div id="msg-wrap"></div>');
    if (message.length < 1) {
        $('#message-text').show();
        /*$(".send-wrap").append('<div id="help-selection">' +
         '<br><br><br><br>' +
         '<small class="pull-left time"><i class="fa fa-clock-o"></i><b>Empty</b></small>' +
         '<br><br><br><br>' +
         '</div>');*/
    } else {
        $('#message-text').show();
        $.each(message, function (i, item) {
            if (item.from === currentUser.id) {
                $("#msg-wrap").append(message_log.replace('DATE', (moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow()))
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', currentUser.image)
                        .replace('NAME', currentUser.fname + ' ' + currentUser.lname));
            } else {
                $("#msg-wrap").append(message_log.replace('DATE', (moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow()))
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', users[item.from].image)
                        .replace('NAME', item.fname + ' ' + item.lname));
            }
            messages[disUser].push(item);
        });
        $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
    }
});

$(document).on('click', 'img[id^="user-"]', function (e) {
    $('#file-message').show();
    $('#help-selection').remove();
    disUser = Number(this.id.replace('user-', ''));
    $('#last-message-' + disUser).css('font-style', '');
    if (messages.hasOwnProperty(disUser)) {
        $('#message-text').show();
        $("message-text").focus();
        $("#msg-wrap").remove();
        $(".msg-wrap").append('<div id="msg-wrap"></div>');
        $.each(messages[disUser], function (i, item) {
            if (item.from === currentUser.id) {
                $("#msg-wrap").append(message_log.replace('DATE', (moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow()))
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', currentUser.image)
                        .replace('NAME', currentUser.fname + ' ' + currentUser.lname));
            } else {
                $("#msg-wrap").append(message_log.replace('DATE', (moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow()))
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', users[disUser].image)
                        .replace('NAME', item.fname + ' ' + item.lname));
            }
        });
        $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
        return;
    }
    messages[disUser] = [];
    var message;
    $.ajax({async: false, type: 'POST', url: "home",
        data: {
            functionality: 'conversation', id: disUser
        },
        success: function (data) {
            $('#msg-wrap').remove();
            message = data;
        }
    });
    $(".msg-wrap").append('<div id="msg-wrap"></div>');
    if (message.length < 1) {
        $('#message-text').show();
        /*$(".send-wrap").append('<div id="help-selection">' +
         '<br><br><br><br>' +
         '<small class="pull-left time"><i class="fa fa-clock-o"></i><b>Empty</b></small>' +
         '<br><br><br><br>' +
         '</div>');*/
    } else {
        $('#message-text').show();
        $("#message-text").focus();
        $.each(message, function (i, item) {
            if (item.from === currentUser.id) {
                $("#msg-wrap").append(message_log.replace('DATE', (moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow()))
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', currentUser.image)
                        .replace('NAME', currentUser.fname + ' ' + currentUser.lname));
            } else {
                $("#msg-wrap").append(message_log.replace('DATE', (moment(item.date, 'YYYY-MM-DD hh:mm:ss').fromNow()))
                        .replace('MESSAGE', item.text)
                        .replace('TIMESTAMP', item.date)
                        .replace('IMAGE', users[disUser].image)
                        .replace('NAME', item.fname + ' ' + item.lname));
            }
            messages[disUser].push(item);
        });
        $(".msg-wrap").animate({scrollTop: $('.msg-wrap')[0].scrollHeight}, 50);
    }
});

$(document).on('click', '#send-file', function (e) {
    $('#file').trigger('click');
});

$(document).on('click', '#setting', function (e) {
    $('.time').each(function (i, el) {
        //console.log($(el)[0].innerHTML);
        console.log($(el)[0].title);
        console.log($(this).text());
        //$(this).text('salam')
        //$(this).text(moment($(el)[0].title, 'YYYY-MM-DD hh:mm:ss').fromNow());
    });
});

$(document).on('change', '#file', function (e) {
    $('#message-text').val($(this).val());
    $('#message-text').prop('readonly', true);
});

$(document).ready(function () {
    setInterval(function () {
        $('.time').each(function (i, el) {
            //$(el)[0].title
            //$(el)[0].innerHTML
            //$(this).text()
            $(this).text(moment($(el)[0].title, 'YYYY-MM-DD hh:mm:ss').fromNow());
        });
    }, 30 * 1000);
});
