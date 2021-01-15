String.prototype.toFaDigit = function () {
    return this.replace(/\d+/g, function (digit) {
        var ret = '';
        for (var i = 0, len = digit.length; i < len; i++) {
            ret += String.fromCharCode(digit.charCodeAt(i) + 1728);
        }

        return ret;
    });
};

//"012345srh6srh789".toFaDigit(); //  ۰۱۲۳۴۵srh۶srh۷۸۹

String.prototype.toEnDigit = function () {
    return this.replace(/[\u06F0-\u06F9]+/g, function (digit) {
        var ret = '';
        for (var i = 0, len = digit.length; i < len; i++) {
            ret += String.fromCharCode(digit.charCodeAt(i) - 1728);
        }

        return ret;
    });
};

//parseInt(str.toEnDigit(), 10);