define(function () {
    return {
        everyRouteTimeSegCards:
            "http://localhost:9010/NetWorkDesign/busODCtrl/getEveryRouteTimeSegCards.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}",
        everyRouteTimeSegCardsDiff:
            "http://localhost:9010/NetWorkDesign/busODCtrl/getEveryRouteTimeSegCardsDiff.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}",
        everyStationTimeSegCards:
            "http://localhost:9010/NetWorkDesign/busODCtrl/getStationTimeSegCards.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}&firstOrLast={4}",
        everyStationTimeSegCardsDiff:
            "http://localhost:9010/NetWorkDesign/busODCtrl/getStationTimeSegCardsDiff.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}&firstOrLast={4}",
        weatherStatus:
            "http://localhost:9010/NetWorkDesign/busODCtrl/getWeatherStatus.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}"
    };
});