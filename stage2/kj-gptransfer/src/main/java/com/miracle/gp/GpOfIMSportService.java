package com.miracle.gp;

import java.math.BigDecimal;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.Future;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.nio.client.CloseableHttpAsyncClient;
import org.apache.http.util.EntityUtils;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;

import com.keizak.entity.HttpRes;
import com.keizak.entity.gp.GPAccount;
import com.miracle.data.MPackage;
import com.miracle.gameplatform.common.HttpAsyncFactory;
import com.miracle.gameplatform.webservice.entity.Balance;
import com.miracle.gameplatform.webservice.entity.Transaction;
import com.miracle.util.JsonResult;
import com.miracle.util.JsonUtils;
import com.miracle.util.XmlUtils;
import java.util.UUID;
import org.apache.http.entity.StringEntity;

public class GpOfIMSportService extends GT {
	private String apiUrl;
	private static final int TIMEOUT = 30000;
	private static final DateFormat df = new SimpleDateFormat(
			"EEE, dd MMM yyyy HH:mm:ss", Locale.ENGLISH);


	private static RequestConfig requestConfig = RequestConfig.custom()
			.setSocketTimeout(TIMEOUT).setConnectTimeout(TIMEOUT)
			.setConnectionRequestTimeout(TIMEOUT).build();

	static {
		df.setTimeZone(TimeZone.getTimeZone("GMT"));
	}

	@Override
	public void initCfg(GPAccount gp) {
		apiUrl = gp.getCfg().get("apiUrl").toString();
	}

	@Override
	public JsonResult getBalance(GPAccount gp, MPackage dataPkg) {
		CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance()
				.getHttpAsyncClient();
		int _r = 0;
		String msg = "get balance error";
		String balance = null;
		HttpPost request = null;
		try {
			request = new HttpPost(apiUrl);
			request.setConfig(requestConfig);
			// TODO
                        Balance balanceEntity = new Balance();
                        balanceEntity.setMemberCode("Membercode1234");
                        
                        if(balanceEntity.checkConstraint()) {
                            
                        }
			request.setEntity(new StringEntity(JsonUtils.toJson(balanceEntity)));
			Future<HttpResponse> future = httpclient.execute(request, null);
			HttpResponse response = future.get();
			HttpRes res = getResponse(response);
			if (res.getStatusCode() != 200 || res.getData() == null) {
				_r = 1410;
				msg = "statusCode: " + res.getStatusCode();
			} else {
				// TODO
                                balance = (String)res.getData().get("amount");
                                if(balance == null) {
                                    msg = "Null balance found";
                                    throw new Exception();
                                }
			}
			res = null;
		} catch (Exception ex) {
			_r = 1411;
		} finally {
			if (request != null)
				request.releaseConnection();
		}
		return _r == 0 ? JsonResult.success(0, "", balance) : JsonResult.error(
				_r, msg);
	}

	@Override
	public JsonResult doWithdraw(GPAccount gp, MPackage dataPkg,
			BigDecimal amount, String qno, Long dno, String exS) {
		CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance()
				.getHttpAsyncClient();
		int _r = 0;
		String msg = "withdraw error";
		String transactionId = null;
		HttpPost request = null;
		HttpRes res = null;
		try {
			request = new HttpPost(apiUrl);
			request.setConfig(requestConfig);
			// TODO
                        Transaction transaction = new Transaction();
                        transaction.setMemberCode("Member123");
                        transaction.setAmount("15.00");
                        transaction.setCurrencyCode("USD");
                        transaction.setTransferId("1234");
                        
                        if(transaction.checkConstraint()) {
                            request.setEntity(new StringEntity(JsonUtils.toJson(transaction)));
                            Future<HttpResponse> future = httpclient.execute(request, null);
                            HttpResponse response = future.get();
                            res = getResponse(response);
                            if (res.getStatusCode() != 200 || res.getData() == null) {
				_r = 1410;
				msg = "statusCode: " + res.getStatusCode();
                            } else {
				// TODO
                                transactionId = UUID.randomUUID().toString();
                            }
                        } else {
                            msg = "Constraint violation";
                            throw new Exception();
                        }
			
		} catch (Exception ex) {
			_r = 1411;
		} finally {
			if (request != null)
				request.releaseConnection();
		}
		return _r == 0 ? JsonResult.success(0, "", transactionId) : JsonResult
				.error(_r, msg);
	}

	@Override
	public JsonResult doDeposit(GPAccount gp, MPackage dataPkg,
			BigDecimal amount, String cno, Long dno) {
		CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance()
				.getHttpAsyncClient();
		int _r = 0;
		String msg = "deposit error";
		String transactionId = null;
		HttpPost request = null;
		HttpRes res = null;
		try {
			request = new HttpPost(apiUrl);
			// TODO
			request.setConfig(requestConfig);
                        Transaction transaction = new Transaction();
                        transaction.configureTimeStamp();
                        transaction.setMemberCode("memberCode123");
                        transaction.setAmount("12.00");
                        transaction.setCurrencyCode("USD");
                        transaction.setTransferId("transferId");
                        transaction.setToken("token1234");
                        
                        if(transaction.checkConstraint()) {
                            request.setEntity(new StringEntity(JsonUtils.toJson(transaction)));
                            Future<HttpResponse> future = httpclient.execute(request, null);
                            HttpResponse response = future.get();
                            res = getResponse(response);
                            if (res.getStatusCode() != 200 || res.getData() == null) {
				_r = 1410;
                                msg = "statusCode: " + res.getStatusCode();
                            
                            } else {
                                //TODO
				transactionId = UUID.randomUUID().toString();
                            }
                        } else {
                            msg = "Constraint violation";
                            throw new Exception();
                        }
			
		} catch (Exception ex) {
			_r = 1411;
		} finally {
			if (request != null)
				request.releaseConnection();
		}
		return _r == 0 ? JsonResult.success(0, "", transactionId) : JsonResult
				.error(_r, msg);
	}

	@Override
	public JsonResult registerOnGp(GPAccount gp, MPackage dataPkg, int tries) {
		return JsonResult.success(0, "", null);
	}

	private HttpRes getResponse(HttpResponse response) throws Exception {
		int status = response.getStatusLine().getStatusCode();
		Map<String, Object> res = null;
		String body = null;
		try {
			if (status == 200) {
				HttpEntity entity = response.getEntity();
				if (entity != null) {
					body = EntityUtils.toString(entity);
					Document doc = DocumentHelper.parseText(body);
					if (doc != null) {
						res = XmlUtils.Dom2Map(doc);
					}
				}
			}
		} catch (Exception e) {
		}
		HttpRes rs = new HttpRes();
		rs.setStatusCode(status);
		rs.setBody(body);
		rs.setData(res);
		return rs;
	}

	@Override
	public JsonResult IfBalanceOk(Long dno, String qno, BigDecimal amount,
			GPAccount gp, MPackage dataPkg) {
		JsonResult rs = getBalance(gp, dataPkg);
		String balance;
		if (rs.getC() == 0) {
			balance = (String) rs.getD();
			BigDecimal _b = new BigDecimal(balance);
			if (amount.compareTo(_b) == 1) {
				return JsonResult.success(1, "", null);
			}
			return JsonResult.success(0, "", null);
		} else if (rs.getC() == 1412) {
			return JsonResult.success(1, "", null);
		}
		return JsonResult.success(2, "", null);
	}
}
