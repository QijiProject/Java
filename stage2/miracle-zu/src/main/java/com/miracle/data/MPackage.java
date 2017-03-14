package com.miracle.data;

import java.io.Serializable;
import java.util.Map;

public class MPackage implements Serializable {
	private static final long serialVersionUID = 2145923653001876567L;

	private String acpid;
	private String remoteIp4;
	private String remoteIp4First;
	private String domain;
	private String lastdomain;
	private Long uid;
	private String uname;
	private Integer utype;
	private Long datetime;
	private Integer agc;
	private Integer groupid;
	private Integer acctype;
	private Long gpn;
	private Map<String, String> userAgentInfo;
	private Map<String, String> reqParams;
	private Map<String, String> cookies;

	public MPackage(String _acpid, String ip) {
		this.acpid = _acpid;
		this.remoteIp4 = ip;
	}

	public MPackage(String _acpid, String ip, String domain) {
		this.acpid = _acpid;
		this.remoteIp4 = ip;
		this.domain = domain;
	}

	public String getAcpid() {
		return acpid;
	}

	public void setAcpid(String acpid) {
		this.acpid = acpid;
	}

	public String getRemoteIp4() {
		return remoteIp4;
	}

	public void setRemoteIp4(String remoteIp4) {
		this.remoteIp4 = remoteIp4;
	}

	public Map<String, String> getUserAgentInfo() {
		return userAgentInfo;
	}

	public void setUserAgentInfo(Map<String, String> userAgentInfo) {
		this.userAgentInfo = userAgentInfo;
	}

	public Map<String, String> getReqParams() {
		return reqParams;
	}

	public void setReqParams(Map<String, String> reqParams) {
		this.reqParams = reqParams;
	}

	public Map<String, String> getCookies() {
		return cookies;
	}

	public void setCookies(Map<String, String> cookies) {
		this.cookies = cookies;
	}

	public String getDomain() {
		return domain;
	}

	public void setDomain(String domain) {
		this.domain = domain;
	}

	public Long getUid() {
		return uid;
	}

	public void setUid(Long uid) {
		this.uid = uid;
	}

	public String getUname() {
		return uname;
	}

	public void setUname(String uname) {
		this.uname = uname;
	}

	public Long getDatetime() {
		return datetime;
	}

	public void setDatetime(Long datetime) {
		this.datetime = datetime;
	}

	public Integer getAgc() {
		return agc;
	}

	public void setAgc(Integer agc) {
		this.agc = agc;
	}

	public Integer getGroupid() {
		return groupid;
	}

	public void setGroupid(Integer groupid) {
		this.groupid = groupid;
	}

	public String getRemoteIp4First() {
		return remoteIp4First;
	}

	public void setRemoteIp4First(String remoteIp4First) {
		this.remoteIp4First = remoteIp4First;
	}

	public Integer getUtype() {
		return utype;
	}

	public void setUtype(Integer utype) {
		this.utype = utype;
	}

	public String getLastdomain() {
		return lastdomain;
	}

	public void setLastdomain(String lastdomain) {
		this.lastdomain = lastdomain;
	}

	public Integer getAcctype() {
		return acctype;
	}

	public void setAcctype(Integer acctype) {
		this.acctype = acctype;
	}

	public Long getGpn() {
		return gpn;
	}

	public void setGpn(Long gpn) {
		this.gpn = gpn;
	}
}
