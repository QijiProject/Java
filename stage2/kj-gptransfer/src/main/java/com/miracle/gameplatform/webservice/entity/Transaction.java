/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.gameplatform.webservice.entity;

import com.miracle.util.StringUtil;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Heng Wai
 */
@XmlTransient
public class Transaction extends GenericEntity{
    private String memberCode;
    private String amount;
    private String currencyCode;
    private String transferId;
    private String token = null;
    
    public String getMemberCode() {
        return memberCode;
    }

    public void setMemberCode(String memberCode) {
        this.memberCode = memberCode;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getTransferId() {
        return transferId;
    }

    public void setTransferId(String transferId) {
        this.transferId = transferId;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getToken() {
        return token;
    }
    
    @Override
    public boolean checkConstraint() {
        return !(StringUtil.nullOrExp(memberCode, 16) ||
        !StringUtil.isFloat(amount) ||
        StringUtil.nullOrExp(currencyCode, 3) ||
        StringUtil.nullOrExp(transferId, 50) ||
        StringUtil.nullOrExp(token, 50)) &&
        super.checkConstraint();
    }
}
