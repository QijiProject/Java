package com.miracle.gameplatform.service.impl;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.miracle.data.MPackage;
import com.miracle.gameplatform.service.GamePlatformService;
import com.miracle.gp.GT;
import com.miracle.gp.GpOfIMSportService;
import com.miracle.util.JsonResult;

public class GamePlatformServiceImpl implements GamePlatformService {
	private static final Logger logger = LoggerFactory
			.getLogger(GamePlatformServiceImpl.class);

	@Override
	public JsonResult doTransaction(BigDecimal amount, String tout, String tin,
			MPackage dataPkg) {
            //IM GPID : 10000
            //Operator GPID : 10001
            logger.info("TODO");
            boolean isDeposit = tout.equals("10001");
            String gpid = null;
            GT gt = null;
           
            gpid = isDeposit? tin : tout;
            
            if(gpid.equals("10000")) {
                gt = new GpOfIMSportService();
            }
            
            if(gt != null) {
                if(isDeposit) {
                    return gt.doDeposit(null, dataPkg, amount, tin, Long.MIN_VALUE);
                } else {
                    return gt.doWithdraw(null, dataPkg, amount, tin, Long.MIN_VALUE, tin);
                }
            } 
            
            return null;
	}

	@Override
	public JsonResult getBalance(String gpid, MPackage dataPkg) {
            GT gt = null;
            if(gpid.equals("10000")) {
                gt = new GpOfIMSportService();
            }
            
            if(gt != null) {
                return gt.getBalance(null, dataPkg);
            }
            
            return null;
	}

	@Override
	public JsonResult register(String gpid, MPackage dataPkg) {
		return null;
	}

}
