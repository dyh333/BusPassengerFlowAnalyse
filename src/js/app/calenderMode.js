/**
 * Created by dingyh on 2015/09/01.
 */
define(['serviceConfig', 'jquery', 'underscore', 'params', 'd3'], function (config, $, _, params, d3) {
        var activitySvg,
            activityGraphYAxis,
            activityGraphYAxisWeather,
            activityGraphBars,
            activityGraphArea,
            activityTimeScale,
            calendarContentArea;

        var dateFormat = d3.time.format("%Y%m%d%H"),
            dateFormatDay = d3.time.format("%Y%m%d"), //YYYYMMDDHH date format for acivity calendar
            startDate = dateFormat.parse("2016011500"),
            endDate = dateFormat.parse("2016012700"),
            allDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 )),  //计算的是天数*24小时
            actualDays = allDays / 24 * 17; //实际上是： 天数 * 17小时 06-22
        tickWidth = Math.floor((window.innerWidth - 40) / actualDays),
            areaWidth = tickWidth * actualDays;
        tickWidth = tickWidth < 3 ? 3 : tickWidth;
        var leftOffset = (window.innerWidth - tickWidth * actualDays) / 2; //the space left/right

        var currentDate = startDate, //date of player
            isPlaying = false;
        var timerID;
        var heatmapSpeed = 250,
            hourStep = 1;
        var activities = [], activitiesTotals = [], activitiesTotalsDaily = [],
            routes = [], routesOrdered = [],
            stations = [], stationsOrdered = [],
            timeSegs = [], weather = [];
        var onOff = 'on';
        var stationCount = 100, stationTotalCount = 0;
        var maxCount = 0, maxSegCount = 0;

        var timeScalePath = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("basis");




        //work on loaders
        var loaderInterval; //the timeout to load
        var loader = d3.select("#loader"),
            loaderWelcome = d3.select("#loader-welcome").text(params.labels.loaderWelcome["en"]),
            loaderWelcome2 = d3.select("#loader-welcome2").text(params.labels.loaderWelcome2["en"]),
            loaderProgress = d3.select("#loader-progress").append("svg").attr("width",200).attr("height",5).style({fill: "#222222"}),
            loaderState = d3.select("#loader-state").text("");

        loaderProgress.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", 5)
            .attr("width", 200)
            .style("fill", params.colors.darkbg);

        loaderProgress.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", 5)
            .attr("width", 1)
            .style("fill", params.colors.base)
            .style("opacity",0.8)
            .transition()
            .duration(5000)
            .attr("width", 200);



        function getTimeScale(area, tick, reverse) {
            //calculate day bar width
            area.attr("width", tick * allDays);

            var leftX = 0;
            for (var day = 0; day < allDays; day++) {
                var dayDate = new Date(startDate.getTime() + day * 1000 * 60 * 60); // + 一个小时的毫秒数

                if (dayDate.getHours() < 6 || dayDate.getHours() >= 23) {
                    continue;
                }

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
                    //.attr("x", day * tick)
                    .attr("x", leftX * tick)
                    .attr("y", 0 + dy);

                if (dayDate.getHours() === 6) { //周一   dayDate.getDay() === 1 &&
                    area.append("text")
                        .attr("x", leftX * tick)
                        //.attr("x", day * tick)
                        .attr("y", 18)
                        .attr("class", "tick-day")
                        .style("fill", "#f0f0f0")
                        .attr("text-anchor", "middle")
                        .text(humanDate(pixelsToDate(day * tick, area.attr("width")), true)); //getting short human readable date
                }

                leftX++;
            }
        }

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

        function pixelsToDate(px, areaWidth) {
            //calculate milliseconds
            var ms = Math.floor((endDate.getTime() - startDate.getTime()) * (px / areaWidth));
            return (new Date(startDate.getTime() + ms));
        }

        function dateToPixels(dt, areaWidth) {
            return ((dt - startDate) / (endDate - startDate) * areaWidth);
        }

        function countToPixels(dt, areaHeight) {
            //test min=1000, max=10000
            return ((dt - 1000) / (10000 - 1000) * areaHeight);
        }

        function humanDate(date, short) {
            if (short)
                return (params.months[date.getMonth()].short["cn"] + "-" + date.getDate());
            else
                var d = date.getDay();
            d = d < 1 ? 6 : d - 1;
            return (date.getDate() + " " + params.months[date.getMonth()].long["en"] + " " + params.days[d]["en"]);
        }

        function sumArray(array) {
            return _.reduce(array, function (memo, num) {
                return memo + num;
            }, 0);
        }

        function getTotalPFlowByHour(startDate, endDate) {

        }

        function initCalenderMode() {




            loadWeather();

            activitySvg = d3.select("#calendar-content").append("svg").attr("width", window.innerWidth).attr("height", 40 * 16 + 320),
                activityGraphYAxis = activitySvg.append("g"),
                activityGraphYAxisWeather = activitySvg.append("g"),
                activityGraphBars = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",0)").attr("id", "svg-bar"),
                activityGraphArea = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",0)"),
                activityTimeScale = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",260)");

            //todo 创建第二个时间轴的
            getTimeScale(activityTimeScale, tickWidth);

            buildCalenderHead();

            //buildGraphicArea();

            loadRouteTimeSegCount();
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
            getTimeScale(calendarTimeScaleArea, tickWidth, true); //getting the time scale
            //calendarTimeScaleArea
            //    .on("mousemove", function (z) {
            //        alert();
            //        //getTooltip(event.pageX, event.pageY, {
            //        //    first: humanDate(pixelsToDate(d3.mouse(this)[0], d3.select(this).attr("width")))
            //        //});
            //    }).on("mouseout", function (d, i) {
            //        $("#tooltip").css("visibility", "hidden");
            //    });

            //building the content


            //todo :  no use???
            var calendarContentSvgTimeScale = activitySvg.append("g").attr("transform", "translate (" + leftOffset + "," + (16 * stationCount + 290) + ")");
            getTimeScale(calendarContentSvgTimeScale, tickWidth);
        }

        //todo
        function loadWeather() {
            console.log(new Date());

            d3.tsv("../data/weather622.csv", function (d, i) {
                weather.push({
                    dt: d.dt,
                    state: d.state,
                    //description: { ru: d.description_ru, en: d.description_en },
                    temp: parseFloat(d.temp)
                });

            }, function (d) {
                //todo 在这里绘制天气

            });
        }

        function loadRouteTimeSegCount() {

            var lastRoute = undefined;
            var routeDate = [], routeSeg = [], routeCount = [];

            d3.tsv("../data/routeTimeSegCount.csv", function (d, i) {
                if (i == 0) {
                    lastRoute = d.NAME;
                }

                if (d.NAME != lastRoute || d.NAME == "end") {  //todo 如何优雅判断是最后一条线路
                    var key = lastRoute == "快线2号" ? 2000 : lastRoute;
                    routes[key] = {
                        name: lastRoute,
                        date: $.extend({}, routeDate),
                        seg: $.extend({}, routeSeg),
                        count: $.extend({}, routeCount),
                        totalCount: _.reduce(routeCount, function (memo, num) {
                            return memo + num;
                        }, 0)
                    };

                    routeDate = [];
                    routeSeg = [];
                    routeCount = [];
                    lastRoute = d.NAME;
                }

                if (d.NAME == "end") {
                    return false;
                }

                var timeSegInt = parseFloat(d.WHICH_DAY_INT); // + (parseInt(d.TIME_IN_SEGMENT) < 10 ? "0" + d.TIME_IN_SEGMENT : d.TIME_IN_SEGMENT));
                //var timeSegStr = d.WHICH_DAY_INT + "-" + (parseInt(d.TIME_IN_SEGMENT) < 10 ? "0" + d.TIME_IN_SEGMENT : d.TIME_IN_SEGMENT);

                if (!(timeSegInt in timeSegs)) {
                    timeSegs[timeSegInt] = {
                        timeSeg: ["6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"],
                        count: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    };

                    timeSegs[timeSegInt].count[parseInt(d.TIME_IN_SEGMENT) - 6] = parseFloat(d.COUNT);
                } else {
                    timeSegs[timeSegInt].count[parseInt(d.TIME_IN_SEGMENT) - 6] += parseFloat(d.COUNT);

                    if (maxSegCount < timeSegs[timeSegInt].count[parseInt(d.TIME_IN_SEGMENT) - 6]) {
                        maxSegCount = timeSegs[timeSegInt].count[parseInt(d.TIME_IN_SEGMENT) - 6];
                    }
                }

                routeDate.push(d.WHICH_DAY_INT);
                routeSeg.push(d.TIME_IN_SEGMENT);
                routeCount.push(parseFloat(d.COUNT));

                if (maxCount < d.COUNT) {
                    maxCount = parseFloat(d.COUNT);
                }

            }, function (d) {



                buildGraphicArea();
                //TODO：这里费时较长
                buildHeatGridByRoute();

                console.log(new Date());
            });
        }

        /**
         * 创建柱状图
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
                .domain([0, maxSegCount]);
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            activityGraphYAxis
                .attr("class", "y axis")
                .call(yAxis)
                .attr("transform", "translate(" + leftOffset + ",0)");

            //右侧y轴
            var yScaleWeather = d3.scale.linear().range([250, 0]).domain([-30, 15]),//-10, 35
                yAxisWeather = d3.svg.axis().scale(yScaleWeather).orient("right");

            activityGraphYAxisWeather
                .attr("class", "y axis-weather")
                .call(yAxisWeather)
                .attr("transform", "translate(" + (tickWidth * actualDays + leftOffset) + ",0)");

            //柱状图
            var counter = 0;
            var activityDaily = [];
            timeSegs.forEach(function (d, i) {
                var iStr = i.toString();
                var date = iStr.substr(0, 4) + "-" + iStr.substr(4, 2) + "-" + iStr.substr(6, 2);
                $.each(d.count, function (index, ele) {
                    activityDaily.push({
                        x: Math.floor(counter++) * (tickWidth), //+tickWidth/2,
                        y: 250 - ele / maxSegCount * 250,
                        num: ele,
                        dateTimeSeg: date + " " + (index + 6) + "时"  //索引号从0开始对应6时
                    });
                });
            });

            //adding bars to graph
            activityDaily.forEach(function (d, i) {
                activityGraphBars.append("rect")
                    .attr("x", (i) * (tickWidth))
                    .attr("y", d.y)
                    .attr("num", d.num)
                    .attr("width", tickWidth - 1)
                    .attr("height", (250 - d.y))
                    .style("fill", params.colors.base)
                    .style("opacity", (1 - d.y / 250));
            });


            //气温 + 降雨
            var weatherDaily = [];
            for (var h = 0; h < actualDays; h++) {
                var temp = weather[h].temp; //todo

                weatherDaily.push({
                    x: Math.floor(h) * (tickWidth),
                    y: 250 - (temp + 30) / 45 * 250
                });
                if (weather[h].state.indexOf("雨") >= 0) {

                    activityGraphArea.append("circle")
                        .style("fill", "#459FEB")
                        .style("opacity", 0.8)
                        .attr("cx", Math.floor(h) * (tickWidth))
                        .attr("cy", 250)
                        .attr("r", tickWidth / 2 - 0.5);
                } else if (weather[h].state.indexOf("雪") >= 0) {

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

            var sum=0;
            activityGraphArea
                .on("mousemove", function (z) {

                    for(i=0; i<17; i++){
                        sum += timeSegs[20160126].count[i];
                    }


                    var selectIndex = 0;
                    var zhuzi = $("#svg-bar")[0];
                    for (i = 0; i < zhuzi.childNodes.length; i++) {
                        var x = parseInt(zhuzi.childNodes[i].attributes["x"].value) + 1;

                        if (x > d3.mouse(this)[0]) {
                            selectIndex = i - 1;
                            break;
                        }
                    }

                    var week = (new Date(activityDaily[selectIndex].dateTimeSeg.substr(0, 10))).getDay();
                    week = week<1 ? 6 : week-1;
                    getTooltip(event.pageX, event.pageY,
                        {
                            first: activityDaily[selectIndex].dateTimeSeg + " " + params.days[week]["cn"],
                            second: activityDaily[selectIndex].num,
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
                    //svgPointer.attr("x", dateToPixels(currentDate,areaWidth));
                    //d3.select(this).attr("stroke-width", 0);
                });
        }

        function buildHeatGridByRoute() {
            calendarContentArea = activitySvg.append("g").attr("transform", "translate(0,285)");
            calendarContentArea.attr("width", window.innerWidth).attr("height", 16 * stationCount + 60);

            var lastRoute = undefined;
            var counter = 0;

            //todo 如何更优雅些？  费时较长
            routes.forEach(function (d, i) {
                var flag = true;

                for (j = 0; j < routesOrdered.length; j++) {
                    if (d.totalCount > routesOrdered[j].totalCount) {
                        routesOrdered.splice(j, 0, d);
                        flag = false;
                        break;
                    }
                }
                if (flag) { //最小的就放最后
                    routesOrdered.push(d);
                }
            });
            //routes = routesOrdered;

            routesOrdered.forEach(function (d, i) {
                var row = calendarContentArea.append("g").attr("class", "row");

                row.append("text")
                    .attr("x", leftOffset - 5)
                    .attr("class", "tick-day")
                    .attr("y", (counter) * (16) + 16)
                    .style("fill", "#f0f0f0")
                    .attr("text-anchor", "end")
                    .text(d.name);

                //var days = _.size(d.date);

                for (var day = 0; day < actualDays; day++) {
                    var iStr = d.date[day].toString();
                    var date = iStr.substr(0, 4) + "-" + iStr.substr(4, 2) + "-" + iStr.substr(6, 2);
                    var dateTimeSeg = date + " " + (d.seg[day]) + "时"

                    row.append("rect")
                        //.style("fill", getPointColor(station.byDate[dt]))
                        .style("fill", params.colors.base)
                        .attr("r", (tickWidth) / 2 - 0.5)
                        .attr("id", d.name + "|" + dateTimeSeg + "|" + d.count[day])
                        .attr("class", "circle")
                        .attr("opacity", d.count[day] * 1.0 / maxCount)
                        //.attr("opacity",1)
                        .attr("x", function () {
                            var x = Math.floor(day) * (tickWidth);
                            return x + leftOffset;
                        })
                        //.attr("y", (counter) * (16) + 16)
                        .attr("y", (counter) * (16) + tickWidth / 2)
                        .attr("height", 15)
                        .attr("width", tickWidth - 1)
                        .on("mousemove", function (z) {
                            var prm = d3.select(this).attr("id").split('|');
                            var week = (new Date(prm[1].substr(0, 10))).getDay();
                            week = week<1 ? 6 : week-1;
                            getTooltip(event.pageX, event.pageY, {
                                first: prm[1] + " " + params.days[week]["cn"],
                                second: prm[2],
                                third: prm[0] + (prm[0]!="快线2号"?"路":"")
                            });
                        })
                        .on("mouseout", function (d, i) {
                            $("#tooltip").css("visibility", "hidden");
                        });
                }

                counter++;
            });

        }

        function changeMode(mode) {
            d3.selectAll(".menu-item-selected").attr("class", "menu-item");
            d3.select("#mode-" + mode).attr("class", "menu-item-selected");

            d3.selectAll(".page").style({display: 'none'});
            d3.selectAll(".page-scrolling").style({display: 'none'});
            d3.select("#" + mode + "-page").style({display: 'block'});
        }

        return {
            initCalenderMode: initCalenderMode,
            changeMode: changeMode
        }
    }
)
;