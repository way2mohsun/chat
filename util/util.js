exports.replaceBetween = replaceBetween;

function replaceBetween(str, start, end, what){
    return str.substring(0, start) + what + str.substring(end);
}