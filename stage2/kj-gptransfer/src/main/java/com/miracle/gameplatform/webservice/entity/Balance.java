/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.gameplatform.webservice.entity;

import com.miracle.util.StringUtil;

/**
 *
 * @author Heng Wai
 */
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
