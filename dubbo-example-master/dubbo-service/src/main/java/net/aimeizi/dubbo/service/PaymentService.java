package net.aimeizi.dubbo.service;

import com.bae.entity.PaymentDetails;

public interface PaymentService {

        void saveOrUpdate(PaymentDetails paymentDetails);
        PaymentDetails findPaymentByMerbillNo(String merbillNo);

    public void savePaymentDetails(String paymentDetails);
}