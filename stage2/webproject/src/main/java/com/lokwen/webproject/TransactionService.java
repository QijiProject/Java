/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.lokwen.webproject;

import com.lokwen.json.entity.TransactionResponse;
import com.miracle.gameplatform.service.GamePlatformService;
import com.miracle.util.JsonUtils;
import java.math.BigDecimal;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


/**
 *
 * @author Heng Wai
 */

@Component
@Path("/transaction")
public class TransactionService {
    private static final Logger LOGGER = Logger.getLogger(TransactionService.class);
    
    @Autowired
    GamePlatformService gamePlatformService;
    
    @Path("/doTransaction")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String doTransaction(TransactionResponse response) {
        return JsonUtils.toJson(gamePlatformService.doTransaction(response.getAmount(), response.getTout(), response.getTin(), null));
    }
    
    @Path("/getBalance")
    @GET
    public String getBalance() {
        //IM GPID: 10000
        return JsonUtils.toJson(gamePlatformService.getBalance("10000", null));
    }
    
    
}
