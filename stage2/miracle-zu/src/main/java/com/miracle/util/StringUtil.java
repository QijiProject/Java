package com.miracle.util;

import java.io.UnsupportedEncodingException;
import java.util.Random;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;

public class StringUtil {
	/** 随机数对象 */
	private static final Random random = new Random();
	/** 数字与字母字典 */
	private static final char[] LETTER_AND_DIGIT = ("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
			.toCharArray();
	/** 数字与字母字典长度 */
	private static final int LETTER_AND_DIGIT_LENGTH = LETTER_AND_DIGIT.length;

	// / <summary>
	// / 从字符串的指定位置截取指定长度的子字符串
	// / </summary>
	// / <param name="str">原字符串</param>
	// / <param name="startIndex">子字符串的起始位置</param>
	// / <param name="length">子字符串的长度</param>
	// / <returns>子字符串</returns>
	public static String cutString(String str, int startIndex, int length) {
		if (startIndex >= 0) {
			if (length < 0) {
				length = length * -1;
				if (startIndex - length < 0) {
					length = startIndex;
					startIndex = 0;
				} else {
					startIndex = startIndex - length;
				}
			}

			if (startIndex > str.length()) {
				return "";
			}

		} else {
			if (length < 0) {
				return "";
			} else {
				if (length + startIndex > 0) {
					length = length + startIndex;
					startIndex = 0;
				} else {
					return "";
				}
			}
		}

		if (str.length() - startIndex < length) {

			length = str.length() - startIndex;
		}

		return str.substring(startIndex, startIndex + length);
	}

	public static String cutString(String str, int startIndex) {
		return StringUtil.cutString(str, startIndex, str.length());
	}

	public static String rightPad(String str, int len, char pad) {
		return StringUtils.rightPad(str, len, pad);
	}

	/**
	 * 字符串截断。编码大于127的字符作为占两个位置，否则占一个位置。
	 */
	public static String truncate(String text, int length, String append) {
		if (StringUtils.isBlank(text) || text.length() < length) {
			return text;
		}
		int num = 0, i = 0, len = text.length();
		StringBuilder sb = new StringBuilder();
		for (; i < len; i++) {
			char c = text.charAt(i);
			if (c > 127) {
				num += 2;
			} else {
				num++;
			}
			if (num <= length * 2) {
				sb.append(c);
			}
			if (num >= length * 2) {
				break;
			}
		}
		if (i + 1 < len && StringUtils.isNotBlank(append)) {
			if (text.charAt(i) > 127) {
				sb.setLength(sb.length() - 1);
			} else {
				sb.setLength(sb.length() - 2);
			}
			sb.append(append);
		}
		return sb.toString();
	}

	/**
	 * 生成固定长度的随机字符串
	 * 
	 * @param len
	 *            随机字符串长度
	 * @return 生成的随机字符串
	 */
	public static String getRandomString(final int len) {
		if (len < 1)
			return "";
		StringBuilder sb = new StringBuilder(len);
		for (int i = 0; i < len; i++) {
			sb.append(LETTER_AND_DIGIT[random.nextInt(LETTER_AND_DIGIT_LENGTH)]);
		}
		return sb.toString();
	}

	public static Float str2Float(String obj, float defautValue) {
		try {
			return Float.valueOf(obj);
		} catch (Exception e) {
			return defautValue;
		}
	}

	public static Integer str2Int(String obj, int defautValue) {
		try {
			return Integer.valueOf(obj);
		} catch (Exception ex) {
			return defautValue;
		}
	}

	public static Short str2Short(String obj, short defautValue) {
		try {
			return Short.valueOf(obj);
		} catch (Exception ex) {
			return defautValue;
		}
	}

	public static Long str2Long(String obj, long defautValue) {
		try {
			return Long.valueOf(obj);
		} catch (Exception ex) {
			return defautValue;
		}
	}

	/**
	 * 判断字符串是否浮点数
	 * @param str
	 * @return
	 */
	public static boolean isFloat(String str) {
		if(nullOrEmpty(str)){
			return false;
		}
		Pattern pattern = Pattern.compile("^[-]?[0-9]*\\.?[0-9]+$");
		return pattern.matcher(str).matches();
	}
	
	/**
	 * 判断字符串是否整数
	 * @param str
	 * @return
	 */
	public static boolean isInteger(String str) {
		if(nullOrEmpty(str)){
			return false;
		}
		Pattern pattern = Pattern.compile("^-?[0-9]+$");
		return pattern.matcher(str).matches();
	}

	public static int getStringUtfLength(String str) {
		if (StringUtils.isEmpty(str)) {
			return 0;
		}
		String tmp = "";
		try {
			tmp = new String(str.getBytes("GBK"), "ISO8859_1");
		} catch (UnsupportedEncodingException ex) {
			return 0;
		}
		return tmp.length();
	}

	public static boolean checkStrLengthLimit(String str, int limitLength) {
		int acLen = StringUtil.getStringUtfLength(str);
		if (acLen > limitLength) {
			return false;
		}
		return true;
	}

	/**
	 * 判断字符串是否为null或者空
	 * 
	 * @param str
	 * @return
	 */
	public static boolean nullOrEmpty(String str) {
		return str == null || str.trim().length() == 0;
	}
	
	/**
	 * 判断字符串是否为null或字符串长度是否超过特定值
	 * @param str
	 * @return
	 */
	public static boolean nullOrExp(String str,int len) {
		return nullOrEmpty(str) || str.trim().length() > len;
	}

	// 首字母转大写
	public static String toUpperCaseFirstOne(String s) {
		if (Character.isUpperCase(s.charAt(0)))
			return s;
		else
			return (new StringBuilder())
					.append(Character.toUpperCase(s.charAt(0)))
					.append(s.substring(1)).toString();
	}
}
