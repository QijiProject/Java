/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.lokwen.webproject;

import com.miracle.gameplatform.service.GamePlatformService;
import com.miracle.util.JsonUtils;
import java.math.BigDecimal;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.springframework.beans.factory.annotation.Autowired;

/**
 *
 * @author Heng Wai
 */

@Path("/transaction")
@Produces(MediaType.APPLICATION_JSON)
public class TransactionService {
    @Autowired
    GamePlatformService gpService;
    
    @POST
    public String doTransaction() {
        return JsonUtils.toJson(gpService.doTransaction(BigDecimal.ZERO, null, null, null));
    }
    
    @GET
    public String getBalance() {
        //IM GPID: 10000
        return JsonUtils.toJson(gpService.getBalance("10000", null));
    }
    
    
}
