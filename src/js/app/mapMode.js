/**
 * Created by dingyh on 2016/3/9.
 */
define(['serviceConfig', 'jquery', 'moment', 'lodash', 'params', 'leaflet'], function (config, $, moment, _, params, leaflet) {
    var map;
    var stationsOrdered, maxStationCount;
    var markers = {};
    var maxRadius = 100;


    function loadBaseMap(){
        $("#map-page").height($(window).height() - $("#header").height() - $("#div_menu").height());

        map = L.map('map').setView([31.323516, 120.747787], 12); // shanghai [31.228432, 121.473224]; line [54.9, 24]  USA [44.715514, -112.148438]

        var tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v3/spatialdev.map-c9z2cyef/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
            id: 'examples.map-i86knfo3'
        }).addTo(map);
    }

    function drawStationCircle(index){
        stationsOrdered.forEach(function (d) {
            var marker = markers[d.name];

            var seg = d.segs[index];
            var radius = maxRadius * (Math.abs(seg) / maxStationCount);
            marker.setRadius(radius);

            if(seg < 0){
                marker.setStyle({fillColor: params.colors.negative});
            } else {
                marker.setStyle({fillColor: params.colors.base});
            }

        });
    }

    function initDrawStations(_stationsOrdered, _maxStationCount){
        stationsOrdered = _stationsOrdered;
        maxStationCount = _maxStationCount;
        markers = {};

        var options = {
            radius: 0,
            fillColor: params.colors.base,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.5
        };

        stationsOrdered.forEach(function (d) {
            var latlng = L.latLng(d.lat, d.lng);
            markers[d.name]  = L.circleMarker(latlng, options).addTo(map);

        });
    }

    return {
        loadBaseMap: loadBaseMap,
        drawStationCircle: drawStationCircle,
        initDrawStations: initDrawStations
    }
});