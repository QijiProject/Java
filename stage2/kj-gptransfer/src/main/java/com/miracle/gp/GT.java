package com.miracle.gp;

import java.math.BigDecimal;

import com.keizak.entity.gp.GPAccount;
import com.miracle.data.MPackage;
import com.miracle.util.JsonResult;

public abstract class GT {
	public abstract void initCfg(GPAccount gp);

	public abstract JsonResult IfBalanceOk(Long dno, String qno, BigDecimal amount,
			GPAccount gp, MPackage dataPkg);

	public abstract JsonResult registerOnGp(GPAccount gp, MPackage dataPkg,
			int tries);

	public abstract JsonResult doWithdraw(GPAccount gp, MPackage dataPkg,
			BigDecimal amount, String qno, Long dno, String exS);

	public abstract JsonResult doDeposit(GPAccount gp, MPackage dataPkg,
			BigDecimal amount, String cno, Long dno);

	public abstract JsonResult getBalance(GPAccount gp, MPackage dataPkg);
}
