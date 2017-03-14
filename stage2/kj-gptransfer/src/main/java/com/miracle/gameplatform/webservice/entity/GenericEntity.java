/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.gameplatform.webservice.entity;

import com.miracle.gameplatform.service.impl.GamePlatformServiceImpl;
import com.miracle.security.DESEncrypt;
import com.miracle.security.DESedeEncrypt;
import com.miracle.util.DateUtils;
import com.miracle.util.StringUtil;
import java.security.MessageDigest;
import javax.xml.bind.annotation.XmlTransient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Heng Wai
 */
@XmlTransient
public class GenericEntity {
    private String timeStamp = null;
    	private static final Logger logger = LoggerFactory
			.getLogger(GenericEntity.class);
    public void configureTimeStamp() {
        try { 
            String utcDateTime = DateUtils.dateToTimeZone(System.currentTimeMillis(), "GMT", "EEE, d MMM yyyy hh:mm:ss z");
            
            logger.error("utctime" + utcDateTime);
            
            timeStamp = DESedeEncrypt.encrypt(utcDateTime);
            
            logger.error("timestamp " + timeStamp);
        } catch(Exception ex) {
            logger.error("Unable to configure timestamp ", ex);
        }
    }
    
    public String getTimeStamp() {
        return this.timeStamp;
    }
    
    public void setTimeStamp(String timeStamp) {
        this.timeStamp = timeStamp;
    }
   
    
    public boolean checkConstraint() {
        return !StringUtil.nullOrExp(timeStamp, 100);
    }
            
}
