var isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
};

var udate = {
    YEAR : "y",
    MONTH : "m",
    DAY : "d",
    HOUR : "h",
    MINUTE : "mi",
    SECOND : "s",
    MILLI : "ms",
    dayNames : {
        SUN : 0,
        MON : 1,
        TUE : 2,
        WED : 3,
        THU : 4,
        FRI : 5,
        SAT : 6
    },
    monthNames : {
        JAN : 0,
        FEB : 1,
        MAR : 2,
        APR : 3,
        MAY : 4,
        JUN : 5,
        JUL : 6,
        AUG : 7,
        SEP : 8,
        OCT : 9,
        NOV : 10,
        DEC : 11
    },
    /**
     * 判断某一年是否是闰年.
     * @param {Date|Number} date 要判断的日期或年数.
     * @return {Boolean} true则闰年.
     */
    isLeapYear : function(date) {
        var year = isDate(date) ? date.getFullYear() : date;
        return !!((year & 3) === 0 && (year % 100 || (year % 400 === 0 && year)));
    },
    /**
     * 获取每个月的天数.
     * @param {Number|Date} month 要处理的日期或月份.
     * @param {Number} year 可选的传入某年.
     * @return {Number} 给定月份的天数.
     */
    getDaysOfMonth : function(month, year) {
        var dm = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], m, y;
        m = isDate(month) ? month.getMonth() : month;
        y = year || (isDate(month) ? month : new Date());
        return m == 1 && udate.isLeapYear(y) ? 29 : dm[m];
    },
    /**
     /**
     * 格式化日期.
     * @param {Date} date the Date to format.
     * @param {String} fmt format pattern.
     * @return {String} the formated date.
     */
    format : function(date, fmt) {
        var o = {
            "M+" : date.getMonth() + 1, //月份
            "d+" : date.getDate(), //日
            "h+" : date.getHours(), //小时
            "m+" : date.getMinutes(), //分
            "s+" : date.getSeconds(), //秒
            "q+" : Math.floor((date.getMonth() + 3) / 3), //季度
            "S" : date.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }

        return fmt;
    },
    isSameDay : function(date1, date2) {
        var d1 = isDate(date1) ? date1 : new Date(date1), d2 = isDate(date2) ? date2 : new Date(date2);
        return (d1.getFullYear() != d2.getFullYear() || d1.getMonth() != d2.getMonth() || d1.getDate() != d2.getDate()) ? false : true;
    },
    
    getMonthSEMills: function(date) {
    	var days = udate.getDaysOfMonth(date), y = date.getFullYear(), m = date.getMonth() + 1;
    	return {s: new Date(y + '/' + m + '/1 0:0:0').getTime(), e: new Date(y + '/' + m + '/' + days + ' 23:23:23').getTime()};
    }
};

module.exports = udate;