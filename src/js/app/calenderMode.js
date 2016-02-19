/**
 * Created by dingyh on 2015/09/01.
 */
define(['serviceConfig', 'jquery', 'moment', 'lodash', 'params', 'd3'], function (config, $, moment, _, params, d3) {
        var activitySvg,
            activityGraphYAxis,
            activityGraphYAxisWeather,
            activityGraphBars,
            activityGraphArea,
            activityTimeScale,
            calendarContentArea;

        //TODO: 用两个参数传进来起止时间
        var startDateStr = "20160115", endDateStr = "20160127", startTimeSeg = 6, endTimeSeg = 22, onOff = "on";

        var dateFormat = d3.time.format("%Y%m%d%H"),
            dateFormatDay = d3.time.format("%Y%m%d"),
            startDate = dateFormatDay.parse(startDateStr),
            endDate = dateFormatDay.parse(endDateStr),

            allDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 )),  //计算的是天数*24小时
            actualDays = allDays / 24 * 17; //实际上是： 天数 * 17小时 06-22
        tickWidth = Math.floor((window.innerWidth - 40) / actualDays),
            areaWidth = tickWidth * actualDays;
        tickWidth = tickWidth < 3 ? 3 : tickWidth;

        var leftOffset = (window.innerWidth - areaWidth) / 2; //the space left/right

        //var currentDate = startDate, //date of player
        //    isPlaying = false;
        //var timerID;
        //var heatmapSpeed = 250,
        //    hourStep = 1;
        var
        //activities = [], activitiesTotals = [], activitiesTotalsDaily = [],
            routes = [], routesOrdered = [],
        //stations = [], stationsOrdered = [],
            timeSegs = [], weather = [];
        var stationCount = 100;
        //, stationTotalCount = 0;
        var maxCount = 0, maxSegCount = 0;

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

                if (dayDate.getHours() >= 6 && dayDate.getHours() <= 22) {

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

                    if (dayDate.getHours() === 6) { //每天的六点
                        area.append("text")
                            .attr("x", rectCount * tick)
                            .attr("y", 18)
                            .attr("class", "tick-day")
                            .style("fill", "#f0f0f0")
                            .attr("text-anchor", "middle")
                            .text(humanDate(pixelsToDate(day * tick, area.attr("width")), true));
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

        function pixelsToDate(px, areaWidth) {
            //calculate milliseconds
            var ms = Math.floor((endDate.getTime() - startDate.getTime()) * (px / areaWidth));
            return (new Date(startDate.getTime() + ms));
        }

        function dateToPixels(dt, areaWidth) {
            return ((dt - startDate) / (endDate - startDate) * areaWidth);
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

        function initCalenderMode() {
            activitySvg = d3.select("#calendar-content").append("svg").attr("width", $(window).width()),
                activityGraphYAxis = activitySvg.append("g"),
                activityGraphYAxisWeather = activitySvg.append("g"),
                activityGraphBars = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",0)").attr("id", "svg-bar"),
                activityTimeScale = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",260)"),
                activityGraphArea = activitySvg.append("g").attr("transform", "translate(" + leftOffset + ",0)");

            loadWeather();

            //先加载数据，再绘制时间轴，是不是会快点？
            loadRouteTimeSegCount();

            buildCalenderHead();
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
        }

        /**
         * 加载天气数据
         */
        function loadWeather() {

            d3.tsv("../data/weather622.csv", function (d, i) {
                weather.push({
                    dt: d.dt,
                    state: d.state,
                    //description: { ru: d.description_ru, en: d.description_en },
                    temp: parseFloat(d.temp)
                });

            }, function (d) {
                //todo 在这里绘制天气???

            });
        }

        function loadRouteTimeSegCount() {
            console.log("before laod:" + new Date());
            $.ajax({
                url: config.everyRouteTimeSegPFlowUrl.replace('{0}', startDateStr).replace('{1}', endDateStr).replace('{2}', startTimeSeg).replace('{3}', endTimeSeg).replace('{4}', onOff),
                dataType: 'jsonp',
                processData: false,
                cache: true,
                ifModified: true,
                jsonpCallback: 'getRouteTimeSegCountCB',
                type: 'GET',
                success: function (data) {
                    console.log("after laod:" + new Date());

                    for (i = 0; i < actualDays; i++) {
                        var dateTime = moment(indexToDate(i)).format('YYYY-MM-DD H时');
                        timeSegs.push({
                            date: dateTime.split(' ')[0],
                            seg: dateTime.split(' ')[1],
                            count: 0
                        });
                    }

                    for (i = 0, length = data.length; i < length; i++) {
                        var routeName = data[i].route;
                        var date = data[i].aDay;
                        var timeSeg = data[i].seg;
                        var count = data[i].count;

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
                        _.last(routes).totalCount += count;

                        if (maxCount < count) {
                            maxCount = parseFloat(count);
                        }

                        /*****  处理timeSegs数据  *****/
                        var index = dateToIndex(dateFormatDay.parse(date), timeSeg);
                        timeSegs[index].count += count;
                    }

                    routesOrdered = _.orderBy(routes, ['totalCount'], ['desc']);
                    maxSegCount = _.maxBy(timeSegs, 'count').count;

                    console.log("after order:" + new Date());

                    buildGraphicArea();
                    buildHeatGridByRoute();
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    cosole.log('load text note error');
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
                .domain([0, maxSegCount]);
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            activityGraphYAxis
                .attr("class", "y axis")
                .call(yAxis)
                .attr("transform", "translate(" + leftOffset + ",0)");

            //右侧y轴
            var yScaleWeather = d3.scale.linear().range([250, 0]).domain([-10, 15]),//-10, 35
                yAxisWeather = d3.svg.axis().scale(yScaleWeather).orient("right");

            activityGraphYAxisWeather
                .attr("class", "y axis-weather")
                .call(yAxisWeather)
                .attr("transform", "translate(" + (tickWidth * actualDays + leftOffset) + ",0)");

            //adding bars to graph
            i = 0;
            _.forEach(timeSegs, function (d) {
                activityGraphBars.append("rect")
                    .attr("x", (i) * (tickWidth))
                    .attr("y", 250 - d.count / maxSegCount * 250)
                    .attr("num", d.count)
                    .attr("width", tickWidth - 1)
                    .attr("height", d.count / maxSegCount * 250)
                    .style("fill", params.colors.base)
                    .style("opacity", d.count / maxSegCount);

                i += 1;
            });

            //气温 + 降雨
            var weatherDaily = [];
            for (var h = 0; h < actualDays; h++) {
                var temp = weather[h].temp; //todo

                weatherDaily.push({
                    x: Math.floor(h) * (tickWidth),
                    y: 250 - (temp + 10) / 25 * 250
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

            activityGraphArea
                .on("mousemove", function (z) {
                    var selectIndex = Math.floor((d3.mouse(this)[0]) / tickWidth);

                    var date = indexToDate(selectIndex);
                    var week = date.getDay();
                    week = week < 1 ? 6 : week - 1;

                    getTooltip(event.pageX, event.pageY,
                        {
                            first: timeSegs[selectIndex].date + " " + timeSegs[selectIndex].seg + " " + params.days[week]["cn"],
                            second: timeSegs[selectIndex].count,
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
            calendarContentArea.attr("width", window.innerWidth).attr("height", 16 * stationCount + 60);

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
                        .attr("opacity", d.segs[day] * 1.0 / maxCount)
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