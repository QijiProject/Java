/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.servlet;

import com.bae.entity.PaymentDetails;
import com.mycompany.paymentdetailsvalidator.PaymentDetailsValidator;
import com.bae.util.PaymentDetailsXMLDeserializer;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.aimeizi.dubbo.service.PaymentService;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

/**
 *
 * @author Heng Wai
 */
public class PaymentValidationServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(PaymentValidationServlet.class);
    @Autowired
    private PaymentService paymentService;
    private WebApplicationContext springContext;

    @Override
    public void init(final ServletConfig config) throws ServletException {
        super.init(config);
        springContext = WebApplicationContextUtils.getRequiredWebApplicationContext(config.getServletContext());
        final AutowireCapableBeanFactory beanFactory = springContext.getAutowireCapableBeanFactory();
        beanFactory.autowireBean(this);
    }

    public void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {
        // Set response content type
        response.setContentType("text/html");
        PaymentDetailsXMLDeserializer.deserializePaymentDetailsXml(IOUtils.toString(request.getReader()));
        PaymentDetails pdFromResponse = PaymentDetailsXMLDeserializer.deserializeToPaymentDetails();

        PaymentDetails pdFromDB = paymentService.findPaymentByMerbillNo(pdFromResponse.getMerbillNo());
//        boolean responseCodeValid = PaymentDetailsValidator.validateResponseCode();
//        boolean fieldsValid = PaymentDetailsValidator.validateFields(pdFromResponse, pdFromDB);
//        boolean signatureValid = PaymentDetailsValidator.validateSignature();
//        if(PaymentDetailsValidator.validateResponseCode()) {
//            
//        }
//        if (responseCodeValid && fieldsValid && signatureValid) {
//            pdFromDB.setValid(true);
//            paymentService.saveOrUpdate(pdFromDB);
//        }
        // Actual logic goes here.
        PrintWriter out = response.getWriter();
        out.println("<h1>" + "successful" + "</h1>");
    }
}
