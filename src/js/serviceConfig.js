define(function () {
    return {
        everyRouteTimeSegCards:
            "http://192.168.34.12:9090/NetWorkDesign/busODCtrl/getEveryRouteTimeSegCards.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}",
        everyRouteTimeSegCardsDiff:
            "http://192.168.34.12:9090/NetWorkDesign/busODCtrl/getEveryRouteTimeSegCardsDiff.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}",
        everyStationTimeSegCards:
            "http://192.168.34.12:9090/NetWorkDesign/busODCtrl/getStationTimeSegCards.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}&firstOrLast={4}",
        everyStationTimeSegCardsDiff:
            "http://192.168.34.12:9090/NetWorkDesign/busODCtrl/getStationTimeSegCardsDiff.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}&firstOrLast={4}",
        weatherStatus:
            "http://192.168.34.12:9090/NetWorkDesign/busODCtrl/getWeatherStatus.do?startDate={0}&endDate={1}&startTimeSeg={2}&endTimeSeg={3}"
    };
});