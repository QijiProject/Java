package com.miracle.util;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

public class DateUtils {
	public static final String YYYYMMDD = "yyyy-MM-dd";
	public static final String YYYYMMDDHHmmss = "yyyy-MM-dd HH:mm:ss";
	public static final String YYYYMM = "yyyyMM";
	public static final int FIRST_DAY_OF_WEEK = Calendar.MONDAY; // 设置 周一是一周的第一天
	public static final String TIMEZONE = "Asia/Shanghai";
	public static final String DAY_START = " 00:00:00";
	public static final String DAY_END = " 23:59:59";

	private static final ThreadLocal<Map<String, DateFormat>> _threadLocal = new ThreadLocal<Map<String, DateFormat>>() {
		protected Map<String, DateFormat> initialValue() {
			return new HashMap<String, DateFormat>();
		}
	};

	public static DateFormat getDateFormat(String pattern) {
		DateFormat dateFormat = _threadLocal.get().get(pattern);
		if (dateFormat == null) {
			dateFormat = new SimpleDateFormat(pattern);
			_threadLocal.get().put(pattern, dateFormat);
		}
		return dateFormat;
	}

	/**
	 * 
	 * @param strDate
	 * @return
	 */
	public static Date parseDate(String strDate) {
		return parseDate(strDate, null);
	}

	/**
	 * parseDate
	 * 
	 * @param strDate
	 * @param pattern
	 * @return
	 */
	public static Date parseDate(String strDate, String pattern) {
		Date date = null;
		try {
			if (pattern == null) {
				pattern = YYYYMMDD;
			}
			date = getDateFormat(pattern).parse(strDate);
		} catch (Exception e) {
		}
		return date;
	}

	/**
	 * 根据日期取得对应 周 周一日期
	 * 
	 * @param date
	 * @return
	 */
	public static Date getMondayOfWeek(Date date) {
		Calendar monday = Calendar.getInstance();
		monday.setTime(date);
		monday.setFirstDayOfWeek(FIRST_DAY_OF_WEEK);
		monday.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
		return monday.getTime();
	}

	/**
	 * 根据日期取得对应 周 周日日期
	 * 
	 * @param date
	 * @return
	 */
	public static Date getSundayOfWeek(Date date) {
		Calendar sunday = Calendar.getInstance();
		sunday.setTime(date);
		sunday.setFirstDayOfWeek(FIRST_DAY_OF_WEEK);
		sunday.set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY);
		return sunday.getTime();
	}

	/**
	 * 取得月第一天
	 * 
	 * @param date
	 * @return
	 */
	public static Date getFirstDateOfMonth(Date date) {
		Calendar c = Calendar.getInstance();
		c.setTime(date);
		c.set(Calendar.DAY_OF_MONTH, c.getActualMinimum(Calendar.DAY_OF_MONTH));
		return c.getTime();
	}

	/**
	 * 取得月最后一天
	 * 
	 * @param date
	 * @return
	 */
	public static Date getLastDateOfMonth(Date date) {
		Calendar c = Calendar.getInstance();
		c.setTime(date);
		c.set(Calendar.DAY_OF_MONTH, c.getActualMaximum(Calendar.DAY_OF_MONTH));
		return c.getTime();
	}

	/**
	 * 取得季度月
	 * 
	 * @param date
	 * @return
	 */
	public static Date[] getSeasonDate(Date date) {
		Date[] season = new Date[3];

		Calendar c = Calendar.getInstance();
		c.setTime(date);

		int nSeason = getSeason(date);
		if (nSeason == 1) {// 第一季度
			c.set(Calendar.MONTH, Calendar.JANUARY);
			season[0] = c.getTime();
			c.set(Calendar.MONTH, Calendar.FEBRUARY);
			season[1] = c.getTime();
			c.set(Calendar.MONTH, Calendar.MARCH);
			season[2] = c.getTime();
		} else if (nSeason == 2) {// 第二季度
			c.set(Calendar.MONTH, Calendar.APRIL);
			season[0] = c.getTime();
			c.set(Calendar.MONTH, Calendar.MAY);
			season[1] = c.getTime();
			c.set(Calendar.MONTH, Calendar.JUNE);
			season[2] = c.getTime();
		} else if (nSeason == 3) {// 第三季度
			c.set(Calendar.MONTH, Calendar.JULY);
			season[0] = c.getTime();
			c.set(Calendar.MONTH, Calendar.AUGUST);
			season[1] = c.getTime();
			c.set(Calendar.MONTH, Calendar.SEPTEMBER);
			season[2] = c.getTime();
		} else if (nSeason == 4) {// 第四季度
			c.set(Calendar.MONTH, Calendar.OCTOBER);
			season[0] = c.getTime();
			c.set(Calendar.MONTH, Calendar.NOVEMBER);
			season[1] = c.getTime();
			c.set(Calendar.MONTH, Calendar.DECEMBER);
			season[2] = c.getTime();
		}
		return season;
	}

	/**
	 * 
	 * 1 第一季度 2 第二季度 3 第三季度 4 第四季度
	 * 
	 * @param date
	 * @return
	 */
	public static int getSeason(Date date) {

		int season = 0;

		Calendar c = Calendar.getInstance();
		c.setTime(date);
		int month = c.get(Calendar.MONTH);
		switch (month) {
		case Calendar.JANUARY:
		case Calendar.FEBRUARY:
		case Calendar.MARCH:
			season = 1;
			break;
		case Calendar.APRIL:
		case Calendar.MAY:
		case Calendar.JUNE:
			season = 2;
			break;
		case Calendar.JULY:
		case Calendar.AUGUST:
		case Calendar.SEPTEMBER:
			season = 3;
			break;
		case Calendar.OCTOBER:
		case Calendar.NOVEMBER:
		case Calendar.DECEMBER:
			season = 4;
			break;
		default:
			break;
		}
		return season;
	}

	/**
	 * 取得季度第一天
	 * 
	 * @param date
	 * @return
	 */
	public static Date getFirstDateOfSeason(Date date) {
		return getFirstDateOfMonth(getSeasonDate(date)[0]);
	}

	/**
	 * 取得季度最后一天
	 * 
	 * @param date
	 * @return
	 */
	public static Date getLastDateOfSeason(Date date) {
		return getLastDateOfMonth(getSeasonDate(date)[2]);
	}

	/**
	 * 将指定的日期转换成Unix时间戳
	 * 
	 * @param String
	 *            date 需要转换的日期 yyyy-MM-dd HH:mm:ss
	 * @return long 时间戳
	 */
	public static long dateToUnixTimestamp(String date) {
		long timestamp = 0;
		try {
			timestamp = getDateFormat(YYYYMMDDHHmmss).parse(date).getTime();
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return timestamp;
	}

	/**
	 * 将指定的日期转换成Unix时间戳
	 * 
	 * @param String
	 *            date 需要转换的日期 yyyy-MM-dd
	 * @return long 时间戳
	 */
	public static long dateToUnixTimestamp(String date, String dateFormat) {
		long timestamp = 0;
		try {
			timestamp = getDateFormat(dateFormat).parse(date).getTime();
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return timestamp;
	}

	public static int compareDates(String date1, String date2) {
		Date d1 = parseDate(date1);
		Date d2 = parseDate(date2);
		return d1.compareTo(d2);
	}

	public static Long[] getTodayStartAndEndMillis(String timezone) {
		if (timezone == null) {
			timezone = TIMEZONE;
		}
		Calendar cal = Calendar.getInstance();
		DateFormat sediff = getDateFormat(YYYYMMDDHHmmss);
		cal.setTimeZone(TimeZone.getTimeZone(timezone));
		Long[] se = new Long[] { 0L, 0L };
		String nowDate = cal.get(Calendar.YEAR) + "-"
				+ (cal.get(Calendar.MONTH) + 1) + "-" + cal.get(Calendar.DATE);
		try {
			se[0] = sediff.parse(nowDate + DAY_START).getTime();
			se[1] = sediff.parse(nowDate + DAY_END).getTime();
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return se;
	}

	// 将日期转换为毫秒
	public static long dateToMillis(String Date) {
		DateFormat sediff = getDateFormat(YYYYMMDDHHmmss);
		long Sec = 0;
		try {
			Sec = sediff.parse(Date + DAY_START).getTime();
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return Sec;
	}

	// 获取当前日期的yyyyMM
	public static String getYYYYMMofNow(String timezone) {
		if (timezone == null) {
			timezone = TIMEZONE;
		}
		Calendar cal = Calendar.getInstance();
		cal.setTimeZone(TimeZone.getTimeZone(timezone));
		return String.valueOf(cal.get(Calendar.YEAR))
				+ paddingDigit(cal.get(Calendar.MONTH) + 1);
	}

	public static String paddingDigit(int d) {
		String _v = String.valueOf(d);
		if (_v.length() < 2)
			_v = "0" + _v;
		return _v;
	}

	public static String dateToTimeZone(long timemills, String timezone,
			String pattern) {
		if (timezone == null) {
			timezone = TIMEZONE;
		}
		if (pattern == null) {
			pattern = YYYYMMDD;
		}
		DateFormat o = getDateFormat(pattern);
		o.setTimeZone(TimeZone.getTimeZone(timezone));
		Date date = new Date(timemills);
		return o.format(date);
	}

	// 获取今天已逝去的秒数
	public static int elapseSecsOfNow(String timezone) {
		if (timezone == null) {
			timezone = TIMEZONE;
		}
		Calendar c = Calendar.getInstance();
		c.setTimeZone(TimeZone.getTimeZone(timezone));
		return c.get(Calendar.HOUR_OF_DAY) * 3600 + c.get(Calendar.MINUTE) * 60
				+ c.get(Calendar.SECOND);
	}

	// 获得今天是星期几
	public static int dayOfWeek(String timezone) {
		if (timezone == null) {
			timezone = TIMEZONE;
		}
		Calendar c = Calendar.getInstance();
		c.setTimeZone(TimeZone.getTimeZone(timezone));
		return c.get(Calendar.DAY_OF_WEEK);
	}

	public static Integer[] getYMD(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		Integer[] rs = { cal.get(Calendar.YEAR), cal.get(Calendar.MONTH),
				cal.get(Calendar.DATE) };
		return rs;
	}

	public static long getCurrentInMillis(String timezone) {
		if (timezone == null) {
			timezone = TIMEZONE;
		}
		Calendar c = Calendar.getInstance();
		TimeZone timez = TimeZone.getTimeZone(timezone);
		c.setTimeZone(timez);
		return c.getTimeInMillis() + c.get(Calendar.ZONE_OFFSET)
				+ c.get(Calendar.DST_OFFSET);
	}

	public static long getCurrentInMillis() {
		Calendar c = Calendar.getInstance();
		return c.getTimeInMillis();
	}

	/**
	 * 获取1970年到现在的秒数 UTC
	 * 
	 * @return
	 */
	public static long getTimeInSec() {
		return getCurrentInMillis() / 1000;
	}

	/**
	 * 获取1970年到现在的秒数 UTC
	 * 
	 * @param timezone
	 * @return
	 */
	public static long getTimeInSec(String timezone) {
		return getCurrentInMillis(timezone) / 1000;
	}

	/**
	 * 将时间戳转换成时间字符串
	 * @param dt
	 * @return
	 */
	public static String timeToDate(long dt) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Long time = new Long(dt * 1000);
		return format.format(time);
	}
}
