/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.mycompany.paymentdetailsvalidator;

import com.bae.entity.PaymentDetails;
import com.bae.util.PaymentDetailsXMLDeserializer;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.security.PublicKey;
import java.security.Signature;
import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.w3c.dom.Element;

/**
 *
 * @author Heng Wai
 */
public class PaymentDetailsValidator {

    private static final Logger LOGGER = Logger.getLogger(PaymentDetailsValidator.class);

    public static boolean validateFields(PaymentDetails paymentDetailsResponse, PaymentDetails paymentDetailsDB) {
        return paymentDetailsResponse.getDate().equals(paymentDetailsDB.getDate())
                && paymentDetailsResponse.getAmount() == paymentDetailsDB.getAmount()
                && paymentDetailsResponse.getMerbillNo().equals(paymentDetailsDB.getMerbillNo());

    }
    
    public static boolean validateResponseCode() {
        Element root = PaymentDetailsXMLDeserializer.rootElement.get();
        return root.getElementsByTagName("RspCode").item(0).getTextContent().equals("000000");
    }
    
    public static boolean validateSignature() {
        Element root = PaymentDetailsXMLDeserializer.rootElement.get();
        byte[] signatureBytes = Base64.decodeBase64(root.getElementsByTagName("Signature").item(0).getTextContent());
        String algorithm = root.getElementsByTagName("RetEncodeType").item(0).getTextContent();
        String body = "<body>" + root.getElementsByTagName("body").item(0).getTextContent() + "</body>";
        String merCode = root.getElementsByTagName("MerCode").item(0).getTextContent();
        
        //商户内部证书 128 bit in hex (sample)
        String cert = "86A48EFDF1142";
        
        String contextSignedByIPS = body + merCode + cert;
        LOGGER.error("contextcheck" + contextSignedByIPS);
        if(algorithm.equals("16"))
        {
            LOGGER.error("validate signature 16");
            return validateMd5RsaSignature(signatureBytes, contextSignedByIPS);
        } else {
            LOGGER.error("validate signature else");
            return false;
        }
        
        
        
    }
    
    private static boolean validateMd5RsaSignature(byte[] singatureFromIPSResponse, String contextSignedByIPS) {
        ObjectInputStream inputStream =  null;
        boolean isValid = false;
        try {
            inputStream = new ObjectInputStream(PaymentDetailsValidator.class.getClassLoader().getResourceAsStream("/public.key"));
            PublicKey pk  = (PublicKey)inputStream.readObject();
            
            Signature signature = Signature.getInstance("MD5withRSA");
            signature.initVerify(pk);
            signature.update(contextSignedByIPS.getBytes());
            isValid =  signature.verify(singatureFromIPSResponse);
            
        } catch (Exception ex) {
            LOGGER.error("Exception in validating signature ", ex);
        } finally {
            try {
                inputStream.close();
            } catch(IOException ex) {
                LOGGER.error("Unable to close inputStream ", ex);
            }
            return isValid;
            
        }
    }
}
