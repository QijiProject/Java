package com.keizak.entity;

import java.util.Map;

public class HttpRes {
	private Integer statusCode;
	private String body;
	private String obody;
	private Map<String, Object> data;

	public Integer getStatusCode() {
		return statusCode;
	}

	public void setStatusCode(Integer statusCode) {
		this.statusCode = statusCode;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public Map<String, Object> getData() {
		return data;
	}

	public void setData(Map<String, Object> data) {
		this.data = data;
	}

	public String getObody() {
		return obody;
	}

	public void setObody(String obody) {
		this.obody = obody;
	}

}
