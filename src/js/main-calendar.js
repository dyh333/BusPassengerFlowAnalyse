/**
 * Created by dingyh on 2015/09/01.
 */
require.config({
    baseUrl: '../js',
    paths: {
        "serviceConfig": "serviceConfig",

        "jquery": "lib/jquery.min",
        "url": "lib/js-url/url.min",
        "moment": "lib/moment/moment.min",
        "lodash": "lib/lodash/lodash.min",
        "postal": "lib/postal/postal.min",
        "d3": "lib/d3/d3.min",

        "params": "params",
        "calenderMode": "app/calenderMode"
    },
    shim: {
        "url": {
            deps: ['jquery'],
            exports: 'url'
        },
        "postal": ['lodash'],
        "params": {
            exports: 'params'
        }
    }
});

require(['calenderMode'], function (calenderMode) {
    //$('#loader-progress-content').removeClass('fullwidth');
    //$('#loader-welcome').click(function() {
    //
    //
    //    $('#loader-progress-content').removeClass('fullwidth').delay(10).queue(function(next){
    //        $(this).addClass('fullwidth');
    //        next();
    //    });
    //
    //    calenderMode.initCalenderMode();
    //    return false;
    //});

    calenderMode.initCalenderMode();

    $("#mode-calendar").click(function () {
        calenderMode.changeMode('calendar');
    });
    $("#mode-explanation").click(function () {
        calenderMode.changeMode('explanation');
    });
});
