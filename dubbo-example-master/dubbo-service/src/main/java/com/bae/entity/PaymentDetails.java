/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.entity;

import java.io.Serializable;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;

/**
 *
 * @author Heng Wai
 */

@Entity
public class PaymentDetails implements Serializable {
    @Id
    @Column(name="MerbillNo")
    String merbillNo;
    
    @Column(name="Amount")
    double amount;
    
    @Column(name="BillDate")
    String date;
    
    @Column(name="Valid", columnDefinition = "BIT", length = 1)
    boolean valid;
    
    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getMerbillNo() {
        return merbillNo;
    }

    public void setMerbillNo(String merbillNo) {
        this.merbillNo = merbillNo;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }
            
}
