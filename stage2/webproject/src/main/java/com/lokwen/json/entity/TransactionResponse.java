/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.lokwen.json.entity;

import java.math.BigDecimal;

/**
 *
 * @author Heng Wai
 */
public class TransactionResponse {
    private String tin;
    private String tout;
    private BigDecimal amount;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTin() {
        return tin;
    }

    public void setTin(String tin) {
        this.tin = tin;
    }

    public String getTout() {
        return tout;
    }

    public void setTout(String tout) {
        this.tout = tout;
    }
    
    
}
