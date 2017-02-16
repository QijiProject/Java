/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.util;

import com.bae.entity.PaymentDetails;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
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
    public static PaymentDetails deserialize(String paymentDetailsXML) {
        System.out.println("deserialize start");
        PaymentDetails pd = new PaymentDetails();
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        
        try {
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputStream stream = new ByteArrayInputStream(paymentDetailsXML.getBytes("UTF-8"));

        LOGGER.error("deserialize 1");
        Document doc = builder.parse(stream);LOGGER.error("deserialize 12");
        Element root = doc.getDocumentElement();LOGGER.error("deserialize 123");
        pd.setMerbillNo(root.getElementsByTagName("MerBillNo").item(0).getTextContent());System.out.println("deserialize 124" + root.getElementsByTagName("MerBillNo").item(0).getTextContent());
        pd.setAmount(Double.valueOf(root.getElementsByTagName("Amount").item(0).getTextContent()));LOGGER.error("deserialize 125");
        pd.setDate(root.getElementsByTagName("Date").item(0).getTextContent());LOGGER.error("deserialize 126");
        
        } catch (Exception ex) {
            
        } finally {
            return pd;
        }
        
        
    }
}
