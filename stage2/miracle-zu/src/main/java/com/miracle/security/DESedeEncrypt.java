/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.security;

import java.io.IOException;
import java.security.MessageDigest;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;


/**
 *
 * @author Heng Wai
 */
public class DESedeEncrypt {

    private static final Logger LOGGER = LoggerFactory.getLogger(DESedeEncrypt.class);
    private static final byte[] saltKey;

    static {
        saltKey = getMd5("3fbd540c4c1e13e87");
    }
    
    private static byte[] getMd5(String input) {
        byte[] rawKey = new byte[24];
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("MD5");
            messageDigest.update(input.getBytes("UTF-8"), 0, input.length());
            byte[] md5 = messageDigest.digest();

            System.arraycopy(md5, 0, rawKey, 0, 16);
            System.arraycopy(md5, 0, rawKey, 16, 8);

        } catch (Exception ex) {
            LOGGER.error("Unable to generate md5 hash ", ex);
        } finally {
            return rawKey;
        }

    }

    public static String encrypt(String str) throws Exception {
        SecretKey key = new SecretKeySpec(saltKey, "DESede");
        Cipher ecipher = Cipher.getInstance("DESede/ECB/PKCS5Padding");
        ecipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] data = str.getBytes("UTF-8");
        byte[] encryptedArray = ecipher.doFinal(data);
        String encryptedString = base64Encode(encryptedArray);
        return encryptedString;
    }

    private static String base64Encode(byte[] s) {
        if (s == null) {
            return null;
        }
        BASE64Encoder b = new BASE64Encoder();
        return b.encode(s);
    }

}
