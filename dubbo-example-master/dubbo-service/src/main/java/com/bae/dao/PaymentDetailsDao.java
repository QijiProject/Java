/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.dao;

import com.bae.entity.PaymentDetails;

/**
 *
 * @author Heng Wai
 */

public interface PaymentDetailsDao extends GenericDao<PaymentDetails>{
    PaymentDetails findByMerbillNo(String billNo);
}
