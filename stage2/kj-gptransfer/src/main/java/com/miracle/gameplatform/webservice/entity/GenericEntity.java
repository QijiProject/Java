/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.gameplatform.webservice.entity;

import com.miracle.security.DESEncrypt;
import com.miracle.util.DateUtils;
import com.miracle.util.StringUtil;

/**
 *
 * @author Heng Wai
 */
public class GenericEntity {
    private String timeStamp = null;
    
    
    public void configureTimeStamp() {
        try {
            String gmtDateTime = DateUtils.dateToTimeZone(System.currentTimeMillis(), "GMT", "EEE, d MMM yyyy hh:mm:ss z");
            timeStamp = new DESEncrypt("aasdfasdfasdf").encrypt(gmtDateTime);
        } catch(Exception ex) {
            
        }
    }
    
    public String getTimeStamp() {
        return timeStamp;
    }
    
   
    
    public boolean checkConstraint() {
        return !StringUtil.nullOrExp(timeStamp, 100);
    }
            
}
