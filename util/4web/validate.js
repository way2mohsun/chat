function dateValidate() {

            if (dateFormat($('#startup-date').val())) {
                $('#startup-date').removeClass('error');
                isNotValid2Edit = true;
            } else {
                $('#startup-date').addClass('error');
            }
}
function timeValidate() {
    if (timeFormat($('#startup-time').val())) {
                $('#startup-time').removeClass('error');
                isNotValid2Edit = true;
            } else {
                $('#startup-time').addClass('error');
            }
}