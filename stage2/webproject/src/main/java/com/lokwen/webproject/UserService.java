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
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 *
 * @author Heng Wai
 */

@Component
@Path("/user")
@Produces(MediaType.APPLICATION_JSON)
public class UserService {
    private static final Logger LOGGER = Logger.getLogger(UserService.class);
    @Autowired
    private GamePlatformService gamePlatformService;
  
    
    @Path("/register")
    @POST
    public String register() {
       
        //IM GPID: 10000
        return JsonUtils.toJson(gamePlatformService.register("10000", null));
    }
    
    
}
