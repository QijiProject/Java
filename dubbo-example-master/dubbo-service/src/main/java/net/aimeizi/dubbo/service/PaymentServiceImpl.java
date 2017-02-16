package net.aimeizi.dubbo.service;

import com.bae.dao.PaymentDetailsDao;
import com.bae.entity.PaymentDetails;
import com.bae.util.PaymentDetailsXMLDeserializer;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger LOGGER = Logger.getLogger(PaymentServiceImpl.class);
    @Autowired
    private PaymentDetailsDao paymentDetailsDao;

    public void savePaymentDetails(String paymentDetails) {
        LOGGER.error("paymentservice impl detected");
        System.out.println("paymentservice impl detected");

        if (paymentDetailsDao == null) {
            System.out.print("null dao spotted");
        }
        paymentDetailsDao.saveOrUpdate(PaymentDetailsXMLDeserializer.deserialize(paymentDetails));
    }

    @Override
    public PaymentDetails findPaymentByMerbillNo(String merbillNo) {
        return paymentDetailsDao.findByMerbillNo(merbillNo);
    }

    public void saveOrUpdate(PaymentDetails paymentDetails) {
        paymentDetailsDao.saveOrUpdate(paymentDetails);
    }
}
