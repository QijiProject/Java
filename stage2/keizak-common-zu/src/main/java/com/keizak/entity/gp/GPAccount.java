package com.keizak.entity.gp;

import java.io.Serializable;
import java.util.Map;

public class GPAccount implements Serializable {
	private static final long serialVersionUID = -8379699930132707602L;

	private Long gpid;
	private String gpname;
	private String gpalias;
	private String gpename;
	private String logo;
	private Integer gptype;
	private Byte iskz;
	private Byte status;
	private Long created;
	private Long updated;
	private Integer displayorder;
	private String basecfg;
	private String usercfg;
	private String beaname;
	private String classN;
	private String idtype;
	private String acpid;
	private String zkpath;
	private Byte intamt;
	private Byte cansep;
	private Float gtev;
	private Byte onlyout;
	private Map<String, Object> cfg;
	private Map<String, Object> ucfg;

	public Long getGpid() {
		return gpid;
	}

	public void setGpid(Long gpid) {
		this.gpid = gpid;
	}

	public String getGpname() {
		return gpname;
	}

	public void setGpname(String gpname) {
		this.gpname = gpname;
	}

	public String getGpename() {
		return gpename;
	}

	public void setGpename(String gpename) {
		this.gpename = gpename;
	}

	public String getLogo() {
		return logo;
	}

	public void setLogo(String logo) {
		this.logo = logo;
	}

	public Integer getGptype() {
		return gptype;
	}

	public void setGptype(Integer gptype) {
		this.gptype = gptype;
	}

	public Byte getStatus() {
		return status;
	}

	public void setStatus(Byte status) {
		this.status = status;
	}

	public String getBasecfg() {
		return basecfg;
	}

	public void setBasecfg(String basecfg) {
		this.basecfg = basecfg;
	}

	public String getUsercfg() {
		return usercfg;
	}

	public void setUsercfg(String usercfg) {
		this.usercfg = usercfg;
	}

	public Map<String, Object> getCfg() {
		return cfg;
	}

	public void setCfg(Map<String, Object> cfg) {
		this.cfg = cfg;
	}

	public Map<String, Object> getUcfg() {
		return ucfg;
	}

	public void setUcfg(Map<String, Object> ucfg) {
		this.ucfg = ucfg;
	}

	public Long getCreated() {
		return created;
	}

	public void setCreated(Long created) {
		this.created = created;
	}

	public Long getUpdated() {
		return updated;
	}

	public void setUpdated(Long updated) {
		this.updated = updated;
	}

	public Integer getDisplayorder() {
		return displayorder;
	}

	public void setDisplayorder(Integer displayorder) {
		this.displayorder = displayorder;
	}

	public Byte getIskz() {
		return iskz;
	}

	public void setIskz(Byte iskz) {
		this.iskz = iskz;
	}

	public boolean kzGP() {
		return this.iskz == 1;
	}

	public String getBeaname() {
		return beaname;
	}

	public void setBeaname(String beaname) {
		this.beaname = beaname;
	}

	public String getIdtype() {
		return idtype;
	}

	public void setIdtype(String idtype) {
		this.idtype = idtype;
	}

	public String getGpalias() {
		return gpalias;
	}

	public void setGpalias(String gpalias) {
		this.gpalias = gpalias;
	}

	public String getClassN() {
		return classN;
	}

	public void setClassN(String classN) {
		this.classN = classN;
	}

	public String getAcpid() {
		return acpid;
	}

	public void setAcpid(String acpid) {
		this.acpid = acpid;
	}

	public String getZkpath() {
		return zkpath;
	}

	public void setZkpath(String zkpath) {
		this.zkpath = zkpath;
	}

	public boolean isIntOnly() {
		return this.intamt == 1;
	}

	public Byte getCansep() {
		return cansep;
	}

	public void setCansep(Byte cansep) {
		this.cansep = cansep;
	}

	public Float getGtev() {
		return gtev;
	}

	public void setGtev(Float gtev) {
		this.gtev = gtev;
	}

	public Byte getIntamt() {
		return intamt;
	}

	public void setIntamt(Byte intamt) {
		this.intamt = intamt;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((gpid == null) ? 0 : gpid.hashCode());
		result = prime * result + ((gpname == null) ? 0 : gpname.hashCode());
		result = prime * result + ((iskz == null) ? 0 : iskz.hashCode());
		result = prime * result + ((status == null) ? 0 : status.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		GPAccount other = (GPAccount) obj;
		if (gpid == null) {
			if (other.gpid != null)
				return false;
		} else if (!gpid.equals(other.gpid))
			return false;
		if (gpname == null) {
			if (other.gpname != null)
				return false;
		} else if (!gpname.equals(other.gpname))
			return false;
		if (iskz == null) {
			if (other.iskz != null)
				return false;
		} else if (!iskz.equals(other.iskz))
			return false;
		if (status == null) {
			if (other.status != null)
				return false;
		} else if (!status.equals(other.status))
			return false;
		return true;
	}

	public Byte getOnlyout() {
		return onlyout;
	}

	public void setOnlyout(Byte onlyout) {
		this.onlyout = onlyout;
	}

	public boolean outOnly() {
		return this.onlyout == 1;
	}

}
