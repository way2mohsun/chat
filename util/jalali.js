//console.log(j2g('1361/12/01'));
//console.log(g2j('1983-02-20'));
exports.j2g = j2g;
exports.g2j = g2j;
exports.jToday = jToday;

Date.jalaliConverter = {};

Date.jalaliConverter.gregorianDaysInMonth = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
Date.jalaliConverter.jalaliDaysInMonth = new Array(31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29);

Date.jalaliConverter.div = function (a, b) {
    return Math.floor(a / b);
};

Date.jalaliConverter.remainder = function (a, b) {
    return a - Math.floor(a / b) * b;
};

/**
 * Converts a Gregorian date to Jalali.
 * @param {Array} g An array containing Gregorian year, month and date.
 * @return {Array} An array containing Jalali year, month and date.
 */
function gregorianToJalali(g) {
    var gy, gm, gd;
    var jy, jm, jd;
    var g_day_no, j_day_no;
    var j_np;

    var i;

    gy = g[0] - 1600;
    gm = g[1] - 1;
    gd = g[2] - 1;

    var div = Date.jalaliConverter.div;
    var remainder = Date.jalaliConverter.remainder;
    var g_days_in_month = Date.jalaliConverter.gregorianDaysInMonth;
    var j_days_in_month = Date.jalaliConverter.jalaliDaysInMonth;

    g_day_no = 365 * gy + div((gy + 3), 4) - div((gy + 99), 100) + div((gy + 399), 400);
    for (i = 0; i < gm; ++i)
        g_day_no += g_days_in_month[i];
    if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)))
        /* leap and after Feb */
        ++g_day_no;
    g_day_no += gd;

    j_day_no = g_day_no - 79;

    j_np = div(j_day_no, 12053);
    j_day_no = remainder(j_day_no, 12053);

    jy = 979 + 33 * j_np + 4 * div(j_day_no, 1461);
    j_day_no = remainder(j_day_no, 1461);

    if (j_day_no >= 366) {
        jy += div((j_day_no - 1), 365);
        j_day_no = remainder((j_day_no - 1), 365);
    }

    for (i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
        j_day_no -= j_days_in_month[i];
    }
    jm = i + 1;
    jd = j_day_no + 1;

    return new Array(jy, jm, jd);
}
;

/**
 * Converts a Jalali date to Gregorian.
 * @param {Array} j An array containing Jalali year, month and date.
 * @return {Array} An array containing Gregorian year, month and date.
 */
function jalaliToGregorian(j) {
    var gy, gm, gd;
    var jy, jm, jd;
    var g_day_no, j_day_no;
    var leap;

    var i;

    jy = j[0] - 979;
    jm = j[1] - 1;
    jd = j[2] - 1;

    var div = Date.jalaliConverter.div;
    var remainder = Date.jalaliConverter.remainder;
    var g_days_in_month = Date.jalaliConverter.gregorianDaysInMonth;
    var j_days_in_month = Date.jalaliConverter.jalaliDaysInMonth;

    j_day_no = 365 * jy + div(jy, 33) * 8 + div((remainder(jy, 33) + 3), 4);
    for (i = 0; i < jm; ++i)
        j_day_no += j_days_in_month[i];

    j_day_no += jd;

    g_day_no = j_day_no + 79;

    gy = 1600 + 400 * div(g_day_no, 146097);
    /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
    g_day_no = remainder(g_day_no, 146097);

    leap = 1;
    if (g_day_no >= 36525) /* 36525 = 365*100 + 100/4 */
    {
        g_day_no--;
        gy += 100 * div(g_day_no, 36524);
        /* 36524 = 365*100 + 100/4 - 100/100 */
        g_day_no = remainder(g_day_no, 36524);

        if (g_day_no >= 365)
            g_day_no++;
        else
            leap = 0;
    }

    gy += 4 * div(g_day_no, 1461);
    /* 1461 = 365*4 + 4/4 */
    g_day_no = remainder(g_day_no, 1461);

    if (g_day_no >= 366) {
        leap = 0;

        g_day_no--;
        gy += div(g_day_no, 365);
        g_day_no = remainder(g_day_no, 365);
    }

    for (i = 0; g_day_no >= g_days_in_month[i] + (i === 1 && leap); i++)
        g_day_no -= g_days_in_month[i] + (i === 1 && leap);
    gm = i + 1;
    gd = g_day_no + 1;

    return new Array(gy, gm, gd);
}

function j2g(date) {
    var d = date.split('/');
    d = jalaliToGregorian([d[0], d[1], d[2]]);
    return d[0] + '-' + (d[1] < 10 ? '0' + d[1] : d[1]) + '-' + (d[2] < 10 ? '0' + d[2] : d[2]);
}

function g2j(date) {
    var d = date.split('-');
    d = gregorianToJalali([d[0], d[1], d[2]]);
    return d[0] + '/' + (d[1] < 10 ? '0' + d[1] : d[1]) + '/' + (d[2] < 10 ? '0' + d[2] : d[2]);
}

function jToday() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var sec = date.getSeconds();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    //console.log(date.getFullYear() + '-' + (date.getMonth() + 1) + "-" + date.getDate());
    return g2j(date.getFullYear() + '-' + (date.getMonth() + 1) + "-" + date.getDate()) + " " + hours + ':' + minutes + ':' + sec;
}