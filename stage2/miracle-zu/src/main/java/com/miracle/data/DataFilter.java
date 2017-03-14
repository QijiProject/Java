package com.miracle.data;

import java.util.regex.Pattern;

import org.apache.commons.lang3.StringEscapeUtils;

public class DataFilter {
	private static DataFilter df = new DataFilter();

	public static String escapeHtml4(String str) {
		return StringEscapeUtils.escapeHtml4(str);
	}

	public static String stripXSS(String str) {
		return df.getWrapper().stripXSS(str);
	}

	public static String encode(String ipt, int lvl) {
		if (lvl == 1) {
			return StringEscapeUtils.escapeHtml4(ipt);
		} else if (lvl == 2) {
			return df.getWrapper().stripXSS(ipt);
		}
		return ipt;
	}

	public XSSRequestWrapper getWrapper() {
		return new XSSRequestWrapper();
	}

	class XSSRequestWrapper {
		public String stripXSS(String value) {
			if (value != null) {
				value = value.replaceAll("", "");
				Pattern scriptPattern = Pattern.compile(
						"<script>(.*?)</script>", Pattern.CASE_INSENSITIVE);
				value = scriptPattern.matcher(value).replaceAll("");
				// scriptPattern = Pattern.compile(
				// "src[\r\n]*=[\r\n]*\\\'(.*?)\\\'",
				// Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
				// | Pattern.DOTALL);
				// value = scriptPattern.matcher(value).replaceAll("");
				// scriptPattern = Pattern.compile(
				// "src[\r\n]*=[\r\n]*\\\"(.*?)\\\"",
				// Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
				// | Pattern.DOTALL);
				// value = scriptPattern.matcher(value).replaceAll("");
				// Remove any lonesome </script> tag
				scriptPattern = Pattern.compile("</script>",
						Pattern.CASE_INSENSITIVE);
				value = scriptPattern.matcher(value).replaceAll("");
				// Remove any lonesome <script ...> tag
				scriptPattern = Pattern.compile("<script(.*?)>",
						Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
								| Pattern.DOTALL);
				value = scriptPattern.matcher(value).replaceAll("");
				// Avoid eval(...) e­xpressions
				scriptPattern = Pattern.compile("eval\\((.*?)\\)",
						Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
								| Pattern.DOTALL);
				value = scriptPattern.matcher(value).replaceAll("");
				// Avoid e­xpression(...) e­xpressions
				scriptPattern = Pattern.compile("e­xpression\\((.*?)\\)",
						Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
								| Pattern.DOTALL);
				value = scriptPattern.matcher(value).replaceAll("");
				// Avoid javascript:... e­xpressions
				scriptPattern = Pattern.compile("javascript:",
						Pattern.CASE_INSENSITIVE);
				value = scriptPattern.matcher(value).replaceAll("");
				// Avoid vbscript:... e­xpressions
				scriptPattern = Pattern.compile("vbscript:",
						Pattern.CASE_INSENSITIVE);
				value = scriptPattern.matcher(value).replaceAll("");
				// Avoid onload= e­xpressions
				scriptPattern = Pattern.compile("onload(.*?)=",
						Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
								| Pattern.DOTALL);
				value = scriptPattern.matcher(value).replaceAll("");
			}
			return value;
		}
	}
}
