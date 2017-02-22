package com.miracle.util;

import java.io.Serializable;

public class JsonResult implements Serializable {
	private static final long serialVersionUID = 1057715775924177306L;
	
	private int c;
	private String m;
	private Object d;
	
	public JsonResult(int code, String msg, Object data) {
		this.c = code;
		this.m = msg + "";
		this.d = data != null ? data : null;
	}
	
	public JsonResult(int code, String msg) {
		this.c = code;
		this.m = msg + "";
	}
	
	public static JsonResult error(int code, String msg) {
		return new JsonResult(code, msg);
	}
	
	public static JsonResult error(String msg) {
		return new JsonResult(-1, msg);
	}
	
	public static JsonResult success(int code, String msg, Object data) {
		return new JsonResult(code, msg, data);
	}
	
	public static JsonResult success(String msg, Object data) {
		return new JsonResult(0, msg, data);
	}
	
	public static JsonResult success(String msg) {
		return new JsonResult(0, msg);
	}

	public int getC() {
		return c;
	}

	public void setC(int c) {
		this.c = c;
	}

	public String getM() {
		return m;
	}

	public void setM(String m) {
		this.m = m;
	}

	public Object getD() {
		return d;
	}

	public void setD(Object d) {
		this.d = d;
	}
}
