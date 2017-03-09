/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.mycompany.webservice;

import com.miracle.gameplatform.service.GamePlatformService;
import com.miracle.util.JsonUtils;
import java.math.BigDecimal;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author Heng Wai
 */
@Path("/getMemberBetDetailsByBetDatetimeJSONResponse")
@Produces(MediaType.APPLICATION_JSON)
public class MemberBetService {

    private static final Logger LOGGER = Logger.getLogger(MemberBetService.class);

    @GET
    public String getBetDetails(@Context HttpServletRequest req, @QueryParam("startdate") String startDate, @QueryParam("enddate") String endDate) {
        JSONObject response = new JSONObject();
        JSONArray memberBetDetailsArray = new JSONArray();
        JSONObject memberBetDetails1 = new JSONObject();
        JSONObject memberBetDetails2 = new JSONObject();
        JSONObject betDetails = new JSONObject();
        
        memberBetDetails1.put("betId", 12201);
        memberBetDetails1.put("betTime", "2015-02-11T06:30:01.557");
        memberBetDetails1.put("memberCode", "seanrmb1");
        memberBetDetails1.put("matchDateTime", "2015-02-11T06:02:00");
        
        memberBetDetails2.put("betId", 12202);
        memberBetDetails2.put("betTime", "2015-02-11T06:30:01.557");
        memberBetDetails2.put("memberCode", "seanrmb2");
        memberBetDetails2.put("matchDateTime", "2015-02-11T06:02:00");
        
        memberBetDetailsArray.put(memberBetDetails1);
        memberBetDetailsArray.put(memberBetDetails2);
        betDetails.put("MemberBetDetails", memberBetDetailsArray);
        response.put("BetDetails", betDetails);
        response.put("statusCode", 100);
        response.put("statusDesc", "Success");
        return response.toString();
    }

}
