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
@XmlRootElement(name="getMemberBalanceXML")
@XmlType(propOrder = {"timeStamp", "memberCode"})
public class Balance extends GenericEntity{
    private String memberCode = null;
    
    public void setMemberCode(String memberCode) {
        this.memberCode = memberCode;
    }
    
    public String getMemberCode() {
        return memberCode;
    }
    
    @Override
    public boolean checkConstraint() {
        return !StringUtil.nullOrExp(memberCode, 16) && super.checkConstraint();
    }
}
