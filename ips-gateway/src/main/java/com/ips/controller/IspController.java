package com.ips.controller;

import com.bae.dao.PaymentDetailsDao;
import com.bae.dao.PaymentDetailsDaoImpl;
import com.bae.util.PaymentDetailsXMLDeserializer;
import com.ips.payment.worker.PaymentWorker;
import com.mycompany.paymentdetailsvalidator.PaymentDetailsValidator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.servlet.http.HttpServletRequest;
import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.apache.commons.io.IOUtils;
import org.apache.http.entity.ByteArrayEntity;

@Controller
public class IspController {

    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(15);
    private static final Logger LOGGER = Logger.getLogger(IspController.class);
    private PaymentDetailsDao paymentS = new PaymentDetailsDaoImpl();

    @RequestMapping(value = "/payment", method = RequestMethod.POST)
    public String payment(Model model, HttpServletRequest req) throws Exception {
        String requestPaymentDetails = req.getParameter("pGateWayReq");
        PaymentDetailsXMLDeserializer.deserializePaymentDetailsXml(requestPaymentDetails);
        
        LOGGER.error("data ips " + requestPaymentDetails);
        
        
        if (PaymentDetailsValidator.validateSignature()) {
            forwardToServerURL("/WEB-INF/data/sample-payment-response.xml", req);
            return "transactionSuccess";
        } else {
            forwardToServerURL("/WEB-INF/data/sample-payment-response-failed.xml", req);
            return "transactionFailed";
        }
        
        
    }
    
    private void forwardToServerURL(String successResponse, HttpServletRequest req) throws Exception {
            String paymentResponse = IOUtils.toString(req.getSession().getServletContext().getResourceAsStream("/WEB-INF/data/sample-payment-response.xml"), "UTF-8");
            EXECUTOR.execute(new PaymentWorker(new ByteArrayEntity(paymentResponse.replaceAll("//s", "").getBytes("UTF-8"))));      
    }
}