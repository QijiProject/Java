/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.util;

import com.bae.entity.PaymentDetails;
import org.apache.log4j.Logger;

/**
 *
 * @author Heng Wai
 */
public class PaymentDetailsValidator {

    private static final Logger LOGGER = Logger.getLogger(PaymentDetailsValidator.class);

    public static boolean validate(PaymentDetails paymentDetailsResponse, PaymentDetails paymentDetailsDB) {
        return paymentDetailsResponse.getDate().equals(paymentDetailsDB.getDate())
                && paymentDetailsResponse.getAmount() == paymentDetailsDB.getAmount()
                && paymentDetailsResponse.getMerbillNo().equals(paymentDetailsDB.getMerbillNo());




    }
}
