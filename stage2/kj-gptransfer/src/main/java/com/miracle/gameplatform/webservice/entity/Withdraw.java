/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.miracle.gameplatform.webservice.entity;

import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Heng Wai
 */

@XmlRootElement(name="withdrawXML")
@XmlType(propOrder = {"timeStamp", "memberCode", "amount", "currencyCode", "transferId", "token"})
public class Withdraw extends Transaction{
    
}
