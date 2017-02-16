/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.ips.payment.worker;

import java.io.IOException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.HttpEntity;
import org.apache.log4j.Logger;

/**
 *
 * @author Heng Wai
 */
public class PaymentWorker implements Runnable{

    private final String REDIRECT_URL = "http://localhost:8080/dubbo-consumer/paymentValidation";
    private static final Logger LOGGER = Logger.getLogger(PaymentWorker.class);
    
    private HttpEntity paymentResponseBody;
    public PaymentWorker(HttpEntity entity) {
        paymentResponseBody = entity;
    }
    
    @Override
    public void run() {
        try{
            HttpClient client = HttpClientBuilder.create().build();
            HttpPost post = new HttpPost(REDIRECT_URL);
            post.setEntity(paymentResponseBody);
            client.execute(post);
            LOGGER.error("send request out from payment worker");
        } catch(IOException ex) {
            LOGGER.error("Unable to process request" , ex);
        }
    }
    
}
