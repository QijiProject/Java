/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.util;

import com.bae.entity.PaymentDetails;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

/**
 *
 * @author Heng Wai
 */
public class PaymentDetailsXMLDeserializer {
    private static final Logger LOGGER = Logger.getLogger(PaymentDetailsXMLDeserializer.class);
    public static ThreadLocal<Element> rootElement = new ThreadLocal<>();
    public static ThreadLocal<String> paymentData = new ThreadLocal<>();
    public static PaymentDetails deserializeToPaymentDetails() {
        PaymentDetails pd = new PaymentDetails();
        Element root = rootElement.get();
        pd.setMerbillNo(root.getElementsByTagName("MerBillNo").item(0).getTextContent());System.out.println("deserialize 124" + root.getElementsByTagName("MerBillNo").item(0).getTextContent());
        pd.setAmount(Double.valueOf(root.getElementsByTagName("Amount").item(0).getTextContent()));LOGGER.error("deserialize 125");
        pd.setDate(root.getElementsByTagName("Date").item(0).getTextContent());LOGGER.error("deserialize 126");
        
        return pd;
        
        
    }
    
    public static void deserializePaymentDetailsXml(String paymentDetailsXML) {
        System.out.println("deserialize start at line 36");
        LOGGER.error(paymentDetailsXML);
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        try {
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputStream stream = new ByteArrayInputStream(paymentDetailsXML.getBytes("UTF-8"));

        LOGGER.error("deserialize 1");
        Document doc = builder.parse(stream);LOGGER.error("deserialize 12");
        rootElement.set(doc.getDocumentElement());LOGGER.error("deserialize 123");
        paymentData.set(paymentDetailsXML);
//        pd.setMerbillNo(root.getElementsByTagName("MerBillNo").item(0).getTextContent());System.out.println("deserialize 124" + root.getElementsByTagName("MerBillNo").item(0).getTextContent());
//        pd.setAmount(Double.valueOf(root.getElementsByTagName("Amount").item(0).getTextContent()));LOGGER.error("deserialize 125");
//        pd.setDate(root.getElementsByTagName("Date").item(0).getTextContent());LOGGER.error("deserialize 126");
        
        } catch (Exception ex) {
            LOGGER.error("Exception found when deserializing payment ", ex);
        } 
    }
}
