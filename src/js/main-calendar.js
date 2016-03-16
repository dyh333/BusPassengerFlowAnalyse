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
        "leaflet": "lib/leaflet/leaflet",
        "postal": "lib/postal/postal.min",
        "d3": "lib/d3/d3.min",
        "kalendae": "lib/kalendae/kalendae.standalone",

        "params": "params",
        "mapMode": "app/mapMode",
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

require(['mapMode', 'calenderMode', 'kalendae'], function (mapMode, calenderMode, kalendae) {
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

    mapMode.loadBaseMap();

    new Kalendae.Input('input_startEndDate', {
        months:2,
        mode:'range',
        format: 'YYYY/MM/DD'
    });

    //calenderMode.initCalenderMode();


    $("#btn_query").click(function(){
        var date = $("#input_startEndDate").val();
        var startDate = _.split(date, '-')[0].trim().replace(/[\/]/g, '');
        var endDate = _.split(date, '-')[1].trim().replace(/[\/]/g, '');

        var calMode = $(".css-checkbox[name='radiog_lite']:checked").val();
        var routeMode = $(".css-checkbox[name='radiog_lite2']:checked").val();

        calenderMode.startQuery(startDate, endDate, calMode, routeMode);
    });

    $("#mode-map").click(function () {
        calenderMode.changeMode('map');
    });
    $("#mode-calendar").click(function () {
        calenderMode.changeMode('calendar');
    });
    $("#mode-explanation").click(function () {
        calenderMode.changeMode('explanation');
    });
});
