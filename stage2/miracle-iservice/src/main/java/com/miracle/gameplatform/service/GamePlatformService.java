package com.miracle.gameplatform.service;

import java.math.BigDecimal;

import com.miracle.data.MPackage;
import com.miracle.util.JsonResult;

public interface GamePlatformService {
	public JsonResult doTransaction(BigDecimal amount, String tout, String tin,
			MPackage dataPkg);

	public JsonResult getBalance(String gpid, MPackage dataPkg);

	public JsonResult register(String gpid, MPackage dataPkg);

}
