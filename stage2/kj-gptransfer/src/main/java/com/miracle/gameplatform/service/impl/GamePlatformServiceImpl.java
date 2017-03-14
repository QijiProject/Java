package com.miracle.gameplatform.service.impl;

import com.keizak.entity.gp.GPAccount;
import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.miracle.data.MPackage;
import com.miracle.gameplatform.service.GamePlatformService;
import com.miracle.gp.GT;
import com.miracle.gp.GpOfIMSportService;
import com.miracle.util.JsonResult;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class GamePlatformServiceImpl implements GamePlatformService {
	private static final Logger logger = LoggerFactory.getLogger(GamePlatformServiceImpl.class);

	@Override
	public JsonResult doTransaction(BigDecimal amount, String tout, String tin,
			MPackage dataPkg) {
            //IM GPID : 10000
            //Operator GPID : 10001

            boolean isDeposit = tout.equals("10001");
            String gpid = null;
           
            gpid = isDeposit? tin : tout;
            
            GT gt = retrieveGamingPlatformByGpId(gpid);
            
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
            //IM GPID : 10000
            GT gt = retrieveGamingPlatformByGpId(gpid);
            
            if(gt != null) {
                return gt.getBalance(null, dataPkg);
            }
            
            return null;
	}

	@Override
	public JsonResult register(String gpid, MPackage dataPkg) {
            //IM GPID : 10000
            GT gt = retrieveGamingPlatformByGpId(gpid);
            
            if(gt != null) {
                return gt.registerOnGp(null, dataPkg, 3);
            }
            
            return null;
	}
        
        private GT retrieveGamingPlatformByGpId(String gpid) {
            GT gt = null;
            if(gpid.equals("10000")) {
                Map<String, Object> cfg = new HashMap();
                cfg.put("apiUrl", "http://qijigroup.sbws.test.imapi.net/externalapi.asmx");
                
                GPAccount account = new GPAccount();
                account.setCfg(cfg);
                
                gt = new GpOfIMSportService();
                gt.initCfg(account);
            }
            return gt;
        }

}
