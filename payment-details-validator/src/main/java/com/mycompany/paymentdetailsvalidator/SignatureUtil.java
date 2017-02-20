/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.mycompany.paymentdetailsvalidator;

import com.bae.util.PaymentDetailsXMLDeserializer;
import com.jcabi.xml.XMLDocument;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.security.PrivateKey;
import java.security.Signature;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.w3c.dom.Element;


/**
 *
 * @author Heng Wai
 */
public class SignatureUtil {
    private static final Logger LOGGER = Logger.getLogger(SignatureUtil.class);
    public static String createSignature() {
        String output = null;
        Element root = PaymentDetailsXMLDeserializer.rootElement.get();
        LOGGER.error("root" + root);
        LOGGER.error("getelement" + root.getElementsByTagName("body"));
        LOGGER.error("getelement1" + root.getElementsByTagName("body").item(0));
        LOGGER.error("getelement2" + root.getElementsByTagName("body").item(0).getTextContent());
        Pattern pattern  = Pattern.compile("<body>(.+?)</body>");
        Matcher matcher = pattern.matcher(PaymentDetailsXMLDeserializer.paymentData.get());
        matcher.find();
        String body = "<body>" + matcher.group(1) + "</body>";
        LOGGER.error("body " + body);
        String merCode = root.getElementsByTagName("MerCode").item(0).getTextContent();
        LOGGER.error("mercode " + merCode);
        //商户内部证书 128 bit in hex (sample)
        String cert = "86A48EFDF1142";
        
        String contextSignedByIPS = body + merCode + cert;
        
        ObjectInputStream inputStream =  null;

        try {
            inputStream = new ObjectInputStream(SignatureUtil.class.getClassLoader().getResourceAsStream("/private.key"));
            PrivateKey pk  = (PrivateKey)inputStream.readObject();
            
            Signature signatureInstance = Signature.getInstance("MD5withRSA");
            signatureInstance.initSign(pk);
            signatureInstance.update(contextSignedByIPS.getBytes());
            byte[] signature =  signatureInstance.sign();
            root.getElementsByTagName("Signature").item(0).setTextContent(Base64.encodeBase64String(signature));
            output =  generateDOMString(root);
            
        } catch (Exception ex) {
            LOGGER.error("Exception in creating signature ", ex);
        } finally {
            try {
                inputStream.close();
            } catch(IOException ex) {
                LOGGER.error("Unable to close inputStream ", ex);
            }
            return output;
        }
    }
    
    private static String generateDOMString(Element root) {
        return new XMLDocument(root).toString();
    }
}
