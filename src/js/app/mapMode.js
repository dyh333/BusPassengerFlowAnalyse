/**
 * Created by dingyh on 2016/3/9.
 */
define(['serviceConfig', 'jquery', 'moment', 'lodash', 'params', 'leaflet'], function (config, $, moment, _, params, leaflet) {
    var map;

    function loadBaseMap(){
        $("#map-page").height($(window).height() - $("#header").height() - $("#div_menu").height());

        map = L.map('map').setView([31.323516, 120.747787], 12); // shanghai [31.228432, 121.473224]; line [54.9, 24]  USA [44.715514, -112.148438]

        var tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v3/spatialdev.map-c9z2cyef/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
            id: 'examples.map-i86knfo3'
        }).addTo(map);
    }

    return {
        loadBaseMap: loadBaseMap
    }
});