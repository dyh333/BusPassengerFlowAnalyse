/**
 * Created by dingyh on 2015/09/01.
 */
define(['serviceConfig', 'jquery', 'moment', 'lodash', 'params', 'd3', 'mapMode'],
    function (config, $, moment, _, params, d3, mapMode) {
        var dateFormatDay = d3.time.format("%Y%m%d");

        var activitySvg,
            activityGraphYAxis,
            activityGraphYAxisWeather,
            activityGraphBars,
            activityGraphArea,
            activityTimeScale,
            calendarContentArea;

        var startDateStr = "20160115", endDateStr = "20160127", startTimeSeg = 6, endTimeSeg = 22,
            onOff = "on", order = "first", calMode = "byNum", routeMode = "byRoute"; //stationCount = 30;
        var startDate, endDate, allDays, actualDays, tickWidth, areaWidth, leftOffset;

        //heatmap player params
        var heatmapInfo, heatmapInfoDate, heatmapInfoWeather, heatmapInfoTime, heatmapInfoScore;
        var timeScaleArea, playHeatmapButton, svgArea, svgAreaBg, svgAreaAxis, svgPointer;
        var currentDate, //date of player
            isPlaying = false,
            timerID,
            heatmapSpeed = 1000, hourStep = 1;

        var
        //activities = [], activitiesTotals = [], activitiesTotalsDaily = [],
            routes = [], routesOrdered = [], routeTimeSegs = [],
            stations = [], stationsOrdered = [], weather = [];
        //var stationCount = 100;
        //, stationTotalCount = 0;
        var maxRouteCount = 0, maxStationCount = 0, highTemp, lowTemp = 0,
        maxRouteSegCount = 0, minRouteSegCount = 0, maxStationSegCount = 0, minStationSegCount = 0;

        /**
         * TODO：考虑放到公共模块中 热图中也用到
         * 绘制线性svg的函数
         */
        var timeScalePath = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("basis");


        function buildTimeScale(area, tick, reverse) {
            //calculate day bar width 用来推算日期的（pixelsToDate），所以用的是allDays
            area.attr("width", tick * allDays);

            var rectCount = 0;
            for (day = 0; day < allDays; day++) {
                var dayDate = new Date(startDate.getTime() + day * 1000 * 60 * 60); // + 一个小时的毫秒数

                if (dayDate.getHours() >= startTimeSeg && dayDate.getHours() <= endTimeSeg) {

                    var dy = 0;
                    if (reverse) {
                        dy = 25;
                    }

                    area
                        .append("rect")
                        .attr("width", tick - 1)
                        .attr("height", 5)
                        .style("fill", "#ffffff")
                        .style("opacity", function () {
                            if (dayDate.getHours() == 7 || dayDate.getHours() == 8 || dayDate.getHours() == 17 || dayDate.getHours() == 18)
                                return (0.5);
                            else return (0.2);
                        })
                        .attr("x", rectCount * tick)
                        .attr("y", 0 + dy);

                    if (dayDate.getHours() === startTimeSeg) { //每天的六点
                        var className = "tick-day";
                        if(dayDate.getDay() == 0 || dayDate.getDay() == 6) {//周末
                            className = "tick-weekend";
                        }

                        area.append("text")
                            .attr("x", rectCount * tick)
                            .attr("y", 18)
                            .attr("class", className)
                            .style("fill", "#f0f0f0")
                            .attr("text-anchor", "middle")
                            //.text(humanDate(pixelsToDate(day * tick, area.attr("width")), true));
                            .text(humanDate(dayDate, true));
                    }

                    rectCount++;
                }
            }
        }

        //TODO：考虑放到公共模块中
        function getTooltip(x, y, t) {

            var tooltip = $("#tooltip"),
                tooltipFirst = $("#tooltipFirst"),
                tooltipSecond = $("#tooltipSecond"),
                tooltipThird = $("#tooltipThird");

            tooltip.css("top", (y + 15)).css("left", (x + 15));
            if (x > window.innerWidth - 100) tooltip.css("margin-left", (x - window.innerWidth));
            else tooltip.css("margin-left", 0);

            tooltip.css("visibility", "visible");
            tooltipFirst.text(t.first ? t.first : '');
            tooltipSecond.text(t.second ? t.second : '');
            tooltipThird.text(t.third ? t.third : '');
        }

        function dateToIndex(date, hour) {
            return Math.floor((date - startDate) / (1000 * 60 * 60 * 24 )) * (endTimeSeg - startTimeSeg + 1) + (hour - startTimeSeg);
        }

        function indexToDate(index) {
            var dayNum = Math.floor(index / (endTimeSeg - startTimeSeg + 1));
            var hourNum = (index % (endTimeSeg - startTimeSeg + 1) + startTimeSeg);
            var dateMs = dayNum * (1000 * 60 * 60 * 24) + startDate.getTime();
            var hourMs = hourNum * (1000 * 60 * 60);

            return new Date(dateMs + hourMs);
        }

        /**
         * TODO：考虑放到公共模块中
         * @param date
         * @param short
         * @returns {string}
         */
        function humanDate(date, short) {
            if (short)
                return (params.months[date.getMonth()].short["cn"] + "-" + date.getDate());
            else
                var d = date.getDay();
            d = d < 1 ? 6 : d - 1;
            return (date.getDate() + " " + params.months[date.getMonth()].long["en"] + " " + params.days[d]["en"]);
        }

        function humanDateCH(date, short) {
            if (short)
                return (params.months[date.getMonth()].short["cn"] + "-" + date.getDate());
            else
                var d = date.getDay();
            d = d < 1 ? 6 : d - 1;
            return (params.months[date.getMonth()].short["cn"] + "月" + date.getDate() + "日 " + params.days[d]["cn"]);
        }

        function initMapMode(){
            d3.select("#heatmap-time-scale").style({width: (window.innerWidth - 40).toString() + "px"});

            heatmapInfo = d3.select("#heatmap-info");
            heatmapInfoDate = d3.select("#heatmap-info-date");
            heatmapInfoWeather = d3.select("#heatmap-info-weather");
            heatmapInfoTime = d3.select("#heatmap-info-time");
            heatmapInfoScore = d3.select("#heatmap-info-score");

            timeScaleArea = d3.select("#heatmap-time-scale-graph").style({ width: window.innerWidth + "px"});
            playHeatmapButton = d3.select("#heatmap-play-control");
            svgArea = timeScaleArea.append("svg")
                .attr("class", "#heatmap-time-control-svg")
                .attr("width", areaWidth)
                .attr("height", 80);

            svgAreaBg = svgArea.append("g");
            svgAreaAxis = svgArea.append("g").attr("transform", "translate(0,60)");
            svgPointer = svgArea.append("rect")
                .attr("height", 80).attr("width", 1)
                .style("fill", "#ff0000")
                .attr("x", 0)
                .attr("y", 0);
        }

        /**
         * 绘制地图时间轴内的内容
         */
        function buildSvgArea(){
            //绘制地图模块时间轴中的折线
            //weatherDaily.push({
            //    temp: temp,
            //    x: Math.floor(h) * (tickWidth),
            //    //y: 250 - (temp) / 25.0 * 250
            //    y: 250 - (temp - lowTemp) / (highTemp - lowTemp) * 250
            //});
            var activitiesTotals = [];
            for (var h = 0; h < actualDays; h++) {
                activitiesTotals.push({
                    x: Math.floor(h) * (tickWidth),
                    y: 58 - (routeTimeSegs[h].count - minRouteSegCount) / (maxRouteSegCount - minRouteSegCount) * 58
                    //58 - routeTimeSegs[h].count / 2
                });
            }

            svgAreaBg.append("path")
                .attr("d", timeScalePath(activitiesTotals))
                .attr("stroke", "#dddddd")
                .attr("stroke-width", 0.8)
                .attr("fill", "none");

            svgArea
                .on("mousemove", function (z) {
                    var selectIndex = Math.floor((d3.mouse(this)[0]) / tickWidth);
                    var date = indexToDate(selectIndex);

                    getTooltip(event.pageX, event.pageY, {
                        first: humanDate(date)
                    });
                    svgPointer.attr("x", d3.mouse(this)[0]);
                })
                .on("mouseout", function (d, i) {
                    tooltip.style("visibility", "hidden");
                    svgPointer.attr("x", dateToPixels(currentDate, areaWidth));
                    d3.select(this).attr("stroke-width", 0);
                })
                .on("click", function (z) {
                    //calculate date for pixel coordinates
                    svgPointer.attr("x", d3.mouse(this)[0]);

                    var selectIndex = Math.floor((d3.mouse(this)[0]) / tickWidth);
                    var currentDate = indexToDate(selectIndex);

                    //currentDate = pixelsToDate(d3.mouse(this)[0], d3.select(this).attr("width"));
                    heatMapActivity(selectIndex);
                });


            index = 0;
            mapMode.initDrawStations(stationsOrdered, maxStationCount);

            playHeatmapButton.on('click', function () {
                if (!isPlaying)  timerID = setInterval(function () {
                    heatTimer();
                    playHeatmapButton.attr("class", "playing");
                    isPlaying = true;
                }, heatmapSpeed);
                else {
                    playHeatmapButton.attr("class", "stopped");
                    isPlaying = false;
                    clearInterval(timerID);
                }
            });
        }

        /**
         * 地图模块时间轴动态变化
         */
        function heatTimer() {


            //currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * hourStep);
            //svgPointer.attr("x", dateToPixels(currentDate, areaWidth)); //moving the pointer
            //if (currentDate.getTime() > endDate.getTime())
            //    currentDate = startDate;

            svgPointer.attr("x", index * (tickWidth)); //moving the pointer

            heatMapActivity(index); //dateFormat(currentDate)

            index += 1;
        }

        /**
         * 地图渲染动态变化
         */
        function heatMapActivity(index) {
            d3.select(".control-selected").attr("class", "control");

            heatmapInfo.style({visibility: "visible"});
            heatmapInfoScore.text(routeTimeSegs[index].count);
            heatmapInfoDate.text(humanDateCH(indexToDate(index)));
            heatmapInfoWeather.text(weather[index].temp + "°C, " + weather[index].state);
            heatmapInfoTime.text(indexToDate(index).getHours() + ":00");

            mapMode.drawStationCircle(index);
        }

        function initCalenderMode() {
            //清空calendar-content里的內容
            $("#calendar-content").empty();
            $("#calendar-header").empty();

            activitySvg = d3.select("#calendar-content").append("svg").attr("width", $(window).width()),
                activityGraphYAxis = activitySvg.append("g"),
                activityGraphYAxisWeather = activitySvg.append("g"),
                activityGraphBars = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",0)").attr("id", "svg-bar"),
                activityTimeScale = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",260)"),
                activityGraphArea = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",0)");


            routes = [];
            routesOrdered = [];
            routeTimeSegs = [];
            stations = [];
            weather = [];
            maxRouteCount = 0;
        }

        /**
         * 创建头部时间轴
         */
        function buildCalenderHead() {
            var calendarTimeScaleSvg = d3.select("#calendar-header").append("svg");
            var calendarTimeScaleArea = calendarTimeScaleSvg
                .append("g")
                .attr("width", window.innerWidth - leftOffset * 2)
                .attr("height", 320);

            calendarTimeScaleSvg.attr("height", 30).attr("width", window.innerWidth);

            calendarTimeScaleArea.attr("transform", "translate(" + leftOffset + ", 0)");
            buildTimeScale(calendarTimeScaleArea, tickWidth, true); //getting the time scale
            //calendarTimeScaleArea
            //    .on("mousemove", function (z) {
            //        alert();
            //        //getTooltip(event.pageX, event.pageY, {
            //        //    first: humanDate(pixelsToDate(d3.mouse(this)[0], d3.select(this).attr("width")))
            //        //});
            //    }).on("mouseout", function (d, i) {
            //        $("#tooltip").css("visibility", "hidden");
            //    });

            //创建第二个时间轴
            buildTimeScale(activityTimeScale, tickWidth);

            //创建地图模块的时间轴
            buildTimeScale(svgAreaAxis, tickWidth);
        }

        /**
         * 加载天气数据
         */
        function loadWeather() {
            //d3.tsv("../data/weather2.csv", function (d, i) {
            //    weather.push({
            //        date: d.date,
            //        seg: d.seg,
            //        state: d.state,
            //        //description: { ru: d.description_ru, en: d.description_en },
            //        temp: parseFloat(d.temp)
            //    });
            //
            //}, function (d) {
            //    //todo 在这里绘制天气???
            //
            //});

            $.ajax({
                url: config.weatherStatus.replace('{0}', startDateStr).replace('{1}', endDateStr).replace('{2}', startTimeSeg).replace('{3}', endTimeSeg),
                dataType: 'jsonp',
                processData: false,
                cache: true,
                ifModified: true,
                jsonpCallback: 'getWeatherStatusCB',
                type: 'GET',
                success: function (data) {


                    //for (i = 0; i < actualDays; i++) {
                    //    var dateTime = moment(indexToDate(i)).format('YYYY-MM-DD H时');
                    //    weather.push({
                    //        date: dateTime.split(' ')[0],
                    //        seg: dateTime.split(' ')[1],
                    //        temp: 10,
                    //        state: ''
                    //    });
                    //}

                    _.map(data, function (d) {
                        var date = d.reportDate;
                        var timeSeg = d.reportHour;
                        var temp = d.temp;
                        var state = d.status;

                        /*****  处理天气数据  *****/
                        var index = dateToIndex(dateFormatDay.parse(date), timeSeg);
                        //weather[index].temp = temp;
                        //weather[index].state = state;
                        weather.push({
                            date: date,
                            seg: timeSeg,
                            temp: temp,
                            state: state
                        });

                        if(highTemp == undefined){
                            highTemp = temp;
                            lowTemp = temp;
                        } else if(highTemp < temp){
                            highTemp = temp;
                        } else if(lowTemp > temp){
                            lowTemp = temp;
                        }
                    });

                    if(lowTemp > 0 ){
                        lowTemp = 0;
                    } else {
                        lowTemp -= 3
                    }
                    highTemp += 3;
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('load text note error');
                }
            });
        }

        /**
         * 加载线路数据
         */
        function loadRouteTimeSegCount() {
            var urlStr = (calMode=="byNum") ? config.everyRouteTimeSegCards:config.everyRouteTimeSegCardsDiff;
            $.ajax({
                url: urlStr.replace('{0}', startDateStr).replace('{1}', endDateStr).replace('{2}', startTimeSeg).replace('{3}', endTimeSeg), //.replace('{4}', onOff)
                dataType: 'jsonp',
                processData: false,
                cache: true,
                ifModified: true,
                jsonpCallback: 'getRouteTimeSegCB',
                type: 'GET',
                success: function (data) {
                    console.log("after laod:" + new Date());

                    for (i = 0; i < actualDays; i++) {
                        var dateTime = moment(indexToDate(i)).format('YYYY-MM-DD H时');
                        routeTimeSegs.push({
                            date: dateTime.split(' ')[0],
                            seg: dateTime.split(' ')[1],
                            count: 0
                        });
                    }

                    _.map(data, function (d) {
                        var routeName = d.route;
                        var date = d.aDay;
                        var timeSeg = d.seg;
                        var count = d.count;

                        /*****  处理routes数据  *****/
                        if (!(_.some(routes, ['name', routeName]))) {
                            routes.push({
                                name: routeName,
                                segs: Array.apply(null, Array(actualDays)).map(Number.prototype.valueOf, 0),
                                totalCount: 0
                            });
                        }

                        var index = dateToIndex(dateFormatDay.parse(date), timeSeg);
                        _.last(routes).segs[index] = count;
                        _.last(routes).totalCount += Math.abs(count);

                        if (maxRouteCount < Math.abs(count)) {
                            maxRouteCount = parseFloat(Math.abs(count));
                        }

                        /*****  处理timeSegs数据  *****/
                        //var index = dateToIndex(dateFormatDay.parse(date), timeSeg);
                        routeTimeSegs[index].count += count;
                    });

                    routesOrdered = _.orderBy(routes, ['totalCount'], ['desc']);

                    maxRouteSegCount = _.maxBy(routeTimeSegs, 'count').count;
                    minRouteSegCount = _.minBy(routeTimeSegs, 'count').count;
                    maxRouteSegCount = maxRouteSegCount > minRouteSegCount ? maxRouteSegCount : minRouteSegCount;

                    console.log("after order:" + new Date());

                    if(calMode == "byNum"){
                        buildGraphicArea();
                        if(routeMode == "byRoute"){
                            buildHeatGridByRoute();
                        }
                    } else {
                        buildGraphicArea2();
                        if(routeMode == "byRoute"){
                            buildHeatGridByRoute2();
                        }
                    }

                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('load text note error');
                }
            });
        }

        /**
         * 加载站点时段数据
         */
        function loadStationTimeSegCount(){
            var urlStr = (calMode=="byNum") ? config.everyStationTimeSegCards:config.everyStationTimeSegCardsDiff;
            $.ajax({
                url: urlStr.replace('{0}', startDateStr).replace('{1}', endDateStr).replace('{2}', startTimeSeg).replace('{3}', endTimeSeg).replace('{4}', order),
                dataType: 'jsonp',
                processData: false,
                cache: true,
                ifModified: true,
                jsonpCallback: 'getStationTimeSegCB',
                type: 'GET',
                success: function (data) {

                    for (i = 0; i < actualDays; i++) {
                        var dateTime = moment(indexToDate(i)).format('YYYY-MM-DD H时');
                        routeTimeSegs.push({
                            date: dateTime.split(' ')[0],
                            seg: dateTime.split(' ')[1],
                            count: 0
                        });
                    }

                    _.map(data, function (d) {
                        var stationName = d.name + ',' + d.direct;
                        var date = d.aDay;
                        var timeSeg = d.seg;
                        var count = d.count;
                        var lat = d.lat;
                        var lng = d.lon;

                        /*****  处理stations数据  *****/
                        if (!(_.some(stations, ['name', stationName]))) {
                            stations.push({
                                name: stationName,
                                segs: Array.apply(null, Array(actualDays)).map(Number.prototype.valueOf, 0),
                                totalCount: 0,
                                lat: lat,
                                lng: lng
                            });
                        }

                        var index = dateToIndex(dateFormatDay.parse(date), timeSeg);
                        _.last(stations).segs[index] = count;
                        _.last(stations).totalCount += Math.abs(count);

                        if (maxStationCount < Math.abs(count)) {
                            maxStationCount = parseFloat(Math.abs(count));
                        }
                    });

                    stationsOrdered = _.orderBy(stations, ['totalCount'], ['desc']);

                    if(calMode == "byNum"){
                        buildHeatGridByStation();
                    } else {
                        buildHeatGridByStation2();
                    }

                    buildSvgArea();
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('load text note error');
                }
            });
        }

        /**
         * 创建上部的图形区
         */
        function buildGraphicArea() {
            activityGraphArea
                .append("rect")
                .attr("width", tickWidth * actualDays)
                .attr("height", 250)
                .attr("x", 0)
                .attr("y", 0)
                .style("fill", "#333333")
                .style("opacity", 0.2);

            var activityGraphPointer = activityGraphArea.append("line");

            activityGraphPointer
                .attr("class", "graph-pointer")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", 0)
                .attr("y2", 260)
                .style("stroke", "#f0f0f0")
                .style("opacity", 1);

            //左侧y轴
            var yScale = d3.scale.linear()
                .range([250, 0])
                .domain([0, maxRouteSegCount]);
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            activityGraphYAxis
                .attr("class", "y axis")
                .call(yAxis)
                .attr("transform", "translate(" + leftOffset + ",0)");

            //右侧y轴
            var yScaleWeather = d3.scale.linear().range([250, 0]).domain([lowTemp, highTemp]),//-10, 15
                yAxisWeather = d3.svg.axis().scale(yScaleWeather).orient("right");

            activityGraphYAxisWeather
                .attr("class", "y axis-weather")
                .call(yAxisWeather)
                .attr("transform", "translate(" + (tickWidth * actualDays + leftOffset) + ",0)");

            //adding bars to graph
            i = 0;
            _.forEach(routeTimeSegs, function (d) {
                activityGraphBars.append("rect")
                    .attr("x", (i) * (tickWidth))
                    .attr("y", 250 - d.count / maxRouteSegCount * 250)
                    .attr("num", d.count)
                    .attr("width", tickWidth - 1)
                    .attr("height", d.count / maxRouteSegCount * 250)
                    .style("fill", params.colors.base)
                    .style("opacity", d.count / maxRouteSegCount);

                i += 1;
            });

            //气温 + 降雨
            var weatherDaily = [];
            for (var h = 0; h < actualDays; h++) {
                //todo
                var temp;
                if(weather[h] == undefined){
                    temp = 0;
                } else {
                    temp = weather[h].temp;
                }
                //var temp = weather[h].temp;

                weatherDaily.push({
                    temp: temp,
                    x: Math.floor(h) * (tickWidth),
                    //y: 250 - (temp) / 25.0 * 250
                    y: 250 - (temp - lowTemp) / (highTemp - lowTemp) * 250
                });
                if (weather[h] != undefined && weather[h].state.indexOf("雨") >= 0) {

                    activityGraphArea.append("circle")
                        .style("fill", "#459FEB")
                        .style("opacity", 0.8)
                        .attr("cx", Math.floor(h) * (tickWidth))
                        .attr("cy", 250)
                        .attr("r", tickWidth / 2 - 0.5);
                } else if (weather[h] != undefined && weather[h].state.indexOf("雪") >= 0) {

                    activityGraphArea.append("circle")
                        .style("fill", "#ffffff")
                        .style("opacity", 0.8)
                        .attr("cx", Math.floor(h) * (tickWidth))
                        .attr("cy", 250)
                        .attr("r", tickWidth / 2 - 0.5);
                }
            }

            var weatherLine = activityGraphArea.append("path")
                .attr("d", timeScalePath(weatherDaily))
                .style("stroke", params.colors.selected)
                .style("stroke-width", 1.5)
                .style("opacity", 0.75)
                .style("fill", "none");

            activityGraphArea
                .on("mousemove", function (z) {
                    var selectIndex = Math.floor((d3.mouse(this)[0]) / tickWidth);

                    var date = indexToDate(selectIndex);
                    var week = date.getDay();
                    week = week < 1 ? 6 : week - 1;

                    getTooltip(event.pageX, event.pageY,
                        {
                            first: routeTimeSegs[selectIndex].date + " " + routeTimeSegs[selectIndex].seg + " " + params.days[week]["cn"],
                            second: routeTimeSegs[selectIndex].count,
                            third: weather[selectIndex].temp + "°C" + (weather[selectIndex].state != "NULL" ? ", " + weather[selectIndex].state : "")
                        });
                    activityGraphPointer
                        .attr("x1", event.pageX - leftOffset)
                        .attr("x2", event.pageX - leftOffset)
                        .style("opacity", 0.5);
                })
                .on("mouseout", function (d, i) {
                    $("#tooltip").css("visibility", "hidden");
                    activityGraphPointer.style("opacity", 0);
                });
        }

        function buildHeatGridByRoute() {
            activitySvg.attr("height", routesOrdered.length * 16 + 320);
            calendarContentArea = activitySvg.append("g").attr("transform", "translate(0,285)");
            calendarContentArea.attr("width", window.innerWidth).attr("height", 16 * routesOrdered.length + 60);

            i = 0;
            routesOrdered.forEach(function (d) {
                var row = calendarContentArea.append("g").attr("class", "row");

                row.append("text")
                    .attr("x", leftOffset - 5)
                    .attr("class", "tick-day")
                    .attr("y", (i) * (16) + 16)
                    .style("fill", "#f0f0f0")
                    .attr("text-anchor", "end")
                    .text(d.name);

                for (var day = 0; day < actualDays; day++) {
                    row.append("rect")
                        .style("fill", params.colors.base)
                        .attr("r", (tickWidth) / 2 - 0.5)
                        .attr("id", d.name + "|" + d.segs[day])
                        .attr("class", "circle")
                        .attr("opacity", d.segs[day] * 1.0 / maxRouteCount)
                        .attr("x", function () {
                            var x = Math.floor(day) * (tickWidth);
                            return x + leftOffset;
                        })
                        .attr("y", (i) * (16) + tickWidth / 2)
                        .attr("height", 15)
                        .attr("width", tickWidth - 1)
                        .on("mousemove", function (z) {
                            var selectIndex = Math.floor((d3.mouse(this)[0] - leftOffset) / tickWidth);

                            var date = indexToDate(selectIndex);
                            var week = date.getDay();
                            week = week < 1 ? 6 : week - 1;
                            var dateTime = moment(date).format('YYYY-MM-DD H时');

                            var prm = _.split(d3.select(this).attr("id"), '|');

                            getTooltip(event.pageX, event.pageY, {
                                first: dateTime + " " + params.days[week]["cn"],  //prm[1]
                                second: prm[1],
                                third: prm[0] + (prm[0] != "快线2号" ? "路" : "")
                            });
                        })
                        .on("mouseout", function (d, i) {
                            $("#tooltip").css("visibility", "hidden");
                        });
                }

                i++;
            });
        }

        function buildGraphicArea2() {
            activityGraphArea
                .append("rect")
                .attr("width", tickWidth * actualDays)
                .attr("height", 250)
                .attr("x", 0)
                .attr("y", 0)
                .style("fill", "#333333")
                .style("opacity", 0.2);

            var activityGraphPointer = activityGraphArea.append("line");

            activityGraphPointer
                .attr("class", "graph-pointer")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", 0)
                .attr("y2", 260)
                .style("stroke", "#f0f0f0")
                .style("opacity", 1);

            //左侧y轴
            var yScale = d3.scale.linear()
                .range([250, 0])
                .domain([Math.floor(minRouteSegCount), Math.ceil(maxRouteSegCount)]);
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            activityGraphYAxis
                .attr("class", "y axis")
                .call(yAxis)
                .attr("transform", "translate(" + leftOffset + ",0)");

            //右侧y轴
            var yScaleWeather = d3.scale.linear().range([250, 0]).domain([lowTemp, highTemp]),//-10, 35
                yAxisWeather = d3.svg.axis().scale(yScaleWeather).orient("right");

            activityGraphYAxisWeather
                .attr("class", "y axis-weather")
                .call(yAxisWeather)
                .attr("transform", "translate(" + (tickWidth * actualDays + leftOffset) + ",0)");

            //adding bars to graph
            i = 0;
            _.forEach(routeTimeSegs, function (d) {
                activityGraphBars.append("rect")
                    .attr("x", (i) * (tickWidth))
                    .attr("y", function(){
                        if(d.count >= 0){
                            return 250 - ((d.count - minRouteSegCount) / (maxRouteSegCount - minRouteSegCount)) * 250;
                        } else {
                            return 250 - ((0 - minRouteSegCount) / (maxRouteSegCount - minRouteSegCount)) * 250;
                        }

                    })
                    .attr("num", d.count)
                    .attr("width", tickWidth - 1)
                    .attr("height", Math.abs(d.count) / (maxRouteSegCount - minRouteSegCount) * 250)
                    .style("fill", function(){
                        if(d.count >= 0){
                            return params.colors.base;
                        } else {
                            return params.colors.negative;
                        }
                    })
                    .style("opacity", Math.abs(d.count)/ maxRouteSegCount);

                i += 1;
            });

            //气温 + 降雨
            var weatherDaily = [];
            for (var h = 0; h < actualDays; h++) {
                //todo
                var temp;
                if(weather[h] == undefined){
                    temp = 0;
                } else {
                    temp = weather[h].temp;
                }

                weatherDaily.push({
                    x: Math.floor(h) * (tickWidth),
                    //y: 250 - (temp + 10) / 25 * 250
                    y: 250 - (temp - lowTemp) / (highTemp - lowTemp) * 250
                });
                if (weather[h] != undefined && weather[h].state.indexOf("雨") >= 0) {

                    activityGraphArea.append("circle")
                        .style("fill", "#459FEB")
                        .style("opacity", 0.8)
                        .attr("cx", Math.floor(h) * (tickWidth))
                        .attr("cy", 250)
                        .attr("r", tickWidth / 2 - 0.5);
                } else if (weather[h] != undefined && weather[h].state.indexOf("雪") >= 0) {

                    activityGraphArea.append("circle")
                        .style("fill", "#ffffff")
                        .style("opacity", 0.8)
                        .attr("cx", Math.floor(h) * (tickWidth))
                        .attr("cy", 250)
                        .attr("r", tickWidth / 2 - 0.5);
                }
            }

            var weatherLine = activityGraphArea.append("path")
                .attr("d", timeScalePath(weatherDaily))
                .style("stroke", params.colors.selected)
                .style("stroke-width", 1.5)
                .style("opacity", 0.75)
                .style("fill", "none");

            activityGraphArea
                .on("mousemove", function (z) {
                    var selectIndex = Math.floor((d3.mouse(this)[0]) / tickWidth);

                    var date = indexToDate(selectIndex);
                    var week = date.getDay();
                    week = week < 1 ? 6 : week - 1;

                    getTooltip(event.pageX, event.pageY,
                        {
                            first: routeTimeSegs[selectIndex].date + " " + routeTimeSegs[selectIndex].seg + " " + params.days[week]["cn"],
                            second: routeTimeSegs[selectIndex].count,
                            third: weather[selectIndex].temp + "°C" + (weather[selectIndex].state != "NULL" ? ", " + weather[selectIndex].state : "")
                        });
                    activityGraphPointer
                        .attr("x1", event.pageX - leftOffset)
                        .attr("x2", event.pageX - leftOffset)
                        .style("opacity", 0.5);
                })
                .on("mouseout", function (d, i) {
                    $("#tooltip").css("visibility", "hidden");
                    activityGraphPointer.style("opacity", 0);
                });
        }

        function buildHeatGridByRoute2() {
            activitySvg.attr("height", routesOrdered.length * 16 + 320);
            calendarContentArea = activitySvg.append("g").attr("transform", "translate(0,285)");
            calendarContentArea.attr("width", window.innerWidth).attr("height", 16 * routesOrdered.length + 60);

            i = 0;
            routesOrdered.forEach(function (d) {
                var row = calendarContentArea.append("g").attr("class", "row");

                row.append("text")
                    .attr("x", leftOffset - 5)
                    .attr("class", "tick-day")
                    .attr("y", (i) * (16) + 16)
                    .style("fill", "#f0f0f0")
                    .attr("text-anchor", "end")
                    .text(d.name);

                for (var day = 0; day < actualDays; day++) {
                    row.append("rect")
                        .style("fill", function(){
                            if(d.segs[day] >= 0){
                                return params.colors.base;
                            } else {
                                return params.colors.negative;
                            }
                        })
                        .attr("r", (tickWidth) / 2 - 0.5)
                        .attr("id", d.name + "|" + d.segs[day])
                        .attr("class", "circle")
                        .attr("opacity", Math.abs(d.segs[day]) / maxRouteCount)
                        .attr("x", function () {
                            var x = Math.floor(day) * (tickWidth);
                            return x + leftOffset;
                        })
                        .attr("y", (i) * (16) + tickWidth / 2)
                        .attr("height", 15)
                        .attr("width", tickWidth - 1)
                        .on("mousemove", function (z) {
                            var selectIndex = Math.floor((d3.mouse(this)[0] - leftOffset) / tickWidth);

                            var date = indexToDate(selectIndex);
                            var week = date.getDay();
                            week = week < 1 ? 6 : week - 1;
                            var dateTime = moment(date).format('YYYY-MM-DD H时');

                            var prm = _.split(d3.select(this).attr("id"), '|');

                            getTooltip(event.pageX, event.pageY, {
                                first: dateTime + " " + params.days[week]["cn"],  //prm[1]
                                second: prm[1],
                                third: prm[0] + (prm[0] != "快线2号" ? "路" : "")
                            });
                        })
                        .on("mouseout", function (d, i) {
                            $("#tooltip").css("visibility", "hidden");
                        });
                }

                i++;
            });

        }

        function buildHeatGridByStation(){
            activitySvg.attr("height", stationsOrdered.length * 16 + 320);
            calendarContentArea = activitySvg.append("g").attr("transform", "translate(0,285)");
            calendarContentArea.attr("width", window.innerWidth).attr("height", 16 * stationsOrdered.length + 60);

            i = 0;
            stationsOrdered.forEach(function (d) {
                var row = calendarContentArea.append("g").attr("class", "row");

                row.append("text")
                    .style("font-size","10px")
                    .attr("x", 0)
                    .attr("class", "tick-day")
                    .attr("y", (i) * (16) + 16)
                    .style("fill", "#f0f0f0")
                    .attr("text-anchor", "start")
                    .text(d.name);

                for (var day = 0; day < actualDays; day++) {
                    row.append("rect")
                        .style("fill", params.colors.base)
                        .attr("r", (tickWidth) / 2 - 0.5)
                        .attr("id", d.name + "|" + d.segs[day])
                        .attr("class", "circle")
                        .attr("opacity", d.segs[day] * 1.0 / maxStationCount)
                        .attr("x", function () {
                            var x = Math.floor(day) * (tickWidth);
                            return x + leftOffset;
                        })
                        .attr("y", (i) * (16) + tickWidth / 2)
                        .attr("height", 15)
                        .attr("width", tickWidth - 1)
                        .on("mousemove", function (z) {
                            var selectIndex = Math.floor((d3.mouse(this)[0] - leftOffset) / tickWidth);

                            var date = indexToDate(selectIndex);
                            var week = date.getDay();
                            week = week < 1 ? 6 : week - 1;
                            var dateTime = moment(date).format('YYYY-MM-DD H时');

                            var prm = _.split(d3.select(this).attr("id"), '|');

                            getTooltip(event.pageX, event.pageY, {
                                first: dateTime + " " + params.days[week]["cn"],  //prm[1]
                                second: prm[1],
                                third: prm[0]
                            });
                        })
                        .on("mouseout", function (d, i) {
                            $("#tooltip").css("visibility", "hidden");
                        });
                }

                i++;
            });
        }

        function buildHeatGridByStation2() {
            activitySvg.attr("height", stationsOrdered.length * 16 + 320);
            calendarContentArea = activitySvg.append("g").attr("transform", "translate(0,285)");
            calendarContentArea.attr("width", window.innerWidth).attr("height", 16 * stationsOrdered.length + 60);

            i = 0;
            stationsOrdered.forEach(function (d) {
                var row = calendarContentArea.append("g").attr("class", "row");

                row.append("text")
                    .style("font-size","10px")
                    .attr("x", 0)
                    .attr("class", "tick-day")
                    .attr("y", (i) * (16) + 16)
                    .style("fill", "#f0f0f0")
                    .attr("text-anchor", "start")
                    .text(d.name);

                for (var day = 0; day < actualDays; day++) {
                    row.append("rect")
                        .style("fill", function(){
                            if(d.segs[day] >= 0){
                                return params.colors.base;
                            } else {
                                return params.colors.negative;
                            }
                        })
                        .attr("r", (tickWidth) / 2 - 0.5)
                        .attr("id", d.name + "|" + d.segs[day])
                        .attr("class", "circle")
                        .attr("opacity", Math.abs(d.segs[day]) / maxStationCount)
                        .attr("x", function () {
                            var x = Math.floor(day) * (tickWidth);
                            return x + leftOffset;
                        })
                        .attr("y", (i) * (16) + tickWidth / 2)
                        .attr("height", 15)
                        .attr("width", tickWidth - 1)
                        .on("mousemove", function (z) {
                            var selectIndex = Math.floor((d3.mouse(this)[0] - leftOffset) / tickWidth);

                            var date = indexToDate(selectIndex);
                            var week = date.getDay();
                            week = week < 1 ? 6 : week - 1;
                            var dateTime = moment(date).format('YYYY-MM-DD H时');

                            var prm = _.split(d3.select(this).attr("id"), '|');

                            getTooltip(event.pageX, event.pageY, {
                                first: dateTime + " " + params.days[week]["cn"],  //prm[1]
                                second: prm[1],
                                third: prm[0] + (prm[0] != "快线2号" ? "路" : "")
                            });
                        })
                        .on("mouseout", function (d, i) {
                            $("#tooltip").css("visibility", "hidden");
                        });
                }

                i++;
            });

        }


        function changeMode(mode) {
            d3.selectAll(".menu-item-selected").attr("class", "menu-item");
            d3.select("#mode-" + mode).attr("class", "menu-item-selected");

            d3.selectAll("#map-page").style({display: 'none'});
            d3.selectAll(".page-scrolling").style({display: 'none'});
            d3.select("#" + mode + "-page").style({display: 'block'});
        }

        function startQuery(_startDateStr, _endDateStr, _calMode, _routeMode) {
            startDateStr = _startDateStr;
            endDateStr = _endDateStr;
            calMode = _calMode;
            routeMode = _routeMode;

            startDate = dateFormatDay.parse(startDateStr);
            endDate = dateFormatDay.parse(endDateStr);
            currentDate = startDate;

            allDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 )) + 24;  //计算的是天数*24小时
            actualDays = allDays / 24 * (endTimeSeg - startTimeSeg + 1); //实际上是： 天数 * 17小时 06-22

            tickWidth = Math.floor((window.innerWidth - 40) / actualDays);
            areaWidth = tickWidth * actualDays;
            areaWidth = areaWidth % 2 == 1 ? areaWidth + 1: areaWidth; //取偶数，否则会有拉伸变形
            tickWidth = tickWidth < 3 ? 3 : tickWidth;

            leftOffset = (window.innerWidth - areaWidth) / 2; //the space left/right



            initCalenderMode();
            initMapMode();

            loadWeather();

            //先加载数据，再绘制时间轴
            loadRouteTimeSegCount();


            if(routeMode === "byStation"){
                loadStationTimeSegCount();

            }

            buildCalenderHead();
        }

        return {
            //initCalenderMode: initCalenderMode,
            changeMode: changeMode,
            startQuery: startQuery
        }
    }
);