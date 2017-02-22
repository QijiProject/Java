package com.miracle.gameplatform.service.impl;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.miracle.data.MPackage;
import com.miracle.gameplatform.service.GamePlatformService;
import com.miracle.util.JsonResult;

public class GamePlatformServiceImpl implements GamePlatformService {
	private static final Logger logger = LoggerFactory
			.getLogger(GamePlatformServiceImpl.class);

	@Override
	public JsonResult doTransaction(BigDecimal amount, String tout, String tin,
			MPackage dataPkg) {
		logger.info("TODO");
		return null;
	}

	@Override
	public JsonResult getBalance(String gpid, MPackage dataPkg) {
		return null;
	}

	@Override
	public JsonResult register(String gpid, MPackage dataPkg) {
		return null;
	}

}
