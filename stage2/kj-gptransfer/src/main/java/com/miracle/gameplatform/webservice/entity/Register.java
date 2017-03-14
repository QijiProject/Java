/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.gameplatform.webservice.entity;

import com.miracle.util.StringUtil;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Heng Wai
 */

@XmlRootElement(name="loginXML")
@XmlType(propOrder = {"timeStamp", "token"})
public class Register extends GenericEntity{
    private String token;
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getToken() {
        return token;
    }
    
    public boolean checkConstraint() {
        return !StringUtil.nullOrExp(token, 50) && super.checkConstraint();
    }
}
