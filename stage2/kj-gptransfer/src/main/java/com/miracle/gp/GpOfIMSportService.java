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
import com.miracle.gameplatform.webservice.entity.Deposit;
import com.miracle.gameplatform.webservice.entity.Register;
import com.miracle.gameplatform.webservice.entity.Withdraw;
import com.miracle.util.JsonResult;
import com.miracle.util.XmlUtils;
import java.util.UUID;
import org.apache.http.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GpOfIMSportService extends GT {

    private String apiUrl;
    private static final int TIMEOUT = 30000;
    private static final Logger LOGGER = LoggerFactory.getLogger(GpOfIMSportService.class);
    private static RequestConfig requestConfig = RequestConfig.custom().setSocketTimeout(TIMEOUT).setConnectTimeout(TIMEOUT).setConnectionRequestTimeout(TIMEOUT).build();

    @Override
    public void initCfg(GPAccount gp) {
        apiUrl = gp.getCfg().get("apiUrl").toString();
    }

    @Override
    public JsonResult getBalance(GPAccount gp, MPackage dataPkg) {
        CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance()
                .getHttpAsyncClient();
        int _r = 0;
        String msg = "";
        String balance = null;
        HttpPost request = null;
        HttpRes res = null;
        try {
            request = new HttpPost(apiUrl);
            request.setConfig(requestConfig);

            // TODO
            Balance balanceEntity = new Balance();
            balanceEntity.configureTimeStamp();
            balanceEntity.setMemberCode("test");

            if (balanceEntity.checkConstraint()) {
                request.setEntity(new StringEntity(XmlUtils.generateSoapBodyContent(balanceEntity)));
                request.setHeader("Content-Type", "text/xml;charset=UTF-8");
                request.setHeader("SOAPAction", "http://tempuri.org/getMemberBalanceXML");
                
                Future<HttpResponse> future = httpclient.execute(request, null);
                HttpResponse response = future.get();
                res = getResponse(response);
                if (res.getStatusCode() != 200 || res.getData() == null) {
                    _r = 1410;
                }
                msg = "statusCode: " + res.getStatusCode();
            } else {
                msg = "Constraint violation";
                throw new Exception();
            }
        } catch (Exception ex) {
            System.out.println(ex);
            _r = 1411;
        } finally {
            if (request != null) {
                request.releaseConnection();
            }
        }
        return _r == 0 ? JsonResult.success(0, msg, res.getData()) : JsonResult.error(
                _r, msg);
    }

    @Override
    public JsonResult doWithdraw(GPAccount gp, MPackage dataPkg, BigDecimal amount, String qno, Long dno, String exS) {
        CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance().getHttpAsyncClient();
        int _r = 0;
        String msg = "";
        String transactionId = null;
        HttpPost request = null;
        HttpRes res = null;
        try {
            request = new HttpPost(apiUrl);
            request.setConfig(requestConfig);

            // TODO
            Withdraw withdraw = new Withdraw();
            withdraw.setMemberCode("test");
            withdraw.setAmount("15.00");
            withdraw.setCurrencyCode("RMB");
            withdraw.setTransferId(UUID.randomUUID().toString());
            withdraw.configureTimeStamp();
            withdraw.setToken("1a2b3c-4d5e");
            if (withdraw.checkConstraint()) {
                request.setEntity(new StringEntity(XmlUtils.generateSoapBodyContent(withdraw)));
                request.setHeader("Content-Type", "text/xml;charset=UTF-8");
                request.setHeader("SOAPAction", "http://tempuri.org/withdrawXML");
                
                Future<HttpResponse> future = httpclient.execute(request, null);
                HttpResponse response = future.get();
                res = getResponse(response);
                if (res.getStatusCode() != 200 || res.getData() == null) {
                    _r = 1410;
                }
                msg = "statusCode: " + res.getStatusCode();
            } else {
                msg = "Constraint violation";
                throw new Exception();
            }

        } catch (Exception ex) {
            _r = 1411;
        } finally {
            if (request != null) {
                request.releaseConnection();
            }
        }
        return _r == 0 ? JsonResult.success(0, msg, res.getData()) : JsonResult
                .error(_r, msg);
    }

    @Override
    public JsonResult doDeposit(GPAccount gp, MPackage dataPkg, BigDecimal amount, String cno, Long dno) {
        CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance().getHttpAsyncClient();
        int _r = 0;
        String msg = "";
        HttpPost request = null;
        HttpRes res = null;
        try {
            request = new HttpPost(apiUrl);
            // TODO
            request.setConfig(requestConfig);

            Deposit deposit = new Deposit();
            deposit.configureTimeStamp();
            deposit.setMemberCode("test");
            deposit.setToken("1a2b3c-4d5e");
            deposit.setAmount("10.00");
            deposit.setCurrencyCode("RMB");
            deposit.setTransferId(UUID.randomUUID().toString());
            
            
            if (deposit.checkConstraint()) {
                request.setEntity(new StringEntity(XmlUtils.generateSoapBodyContent(deposit)));
                request.setHeader("Content-Type", "text/xml;charset=UTF-8");
                request.setHeader("SOAPAction", "http://tempuri.org/depositXML");

                Future<HttpResponse> future = httpclient.execute(request, null);
                HttpResponse response = future.get();
                res = getResponse(response);
                if (res.getStatusCode() != 200 || res.getData() == null) {
                    _r = 1410;
                } 
                msg = "statusCode: " + res.getStatusCode();
            } else {
                msg = "Constraint violation";
                throw new Exception();
            }

        } catch (Exception ex) {
            _r = 1411;
        } finally {
            if (request != null) {
                request.releaseConnection();
            }
        }
        return _r == 0 ? JsonResult.success(0, msg, res.getData()) : JsonResult
                .error(_r, msg);
    }

    @Override
    public JsonResult registerOnGp(GPAccount gp, MPackage dataPkg, int tries) {
        CloseableHttpAsyncClient httpclient = HttpAsyncFactory.getInstance()
                .getHttpAsyncClient();
        int _r = 0;
        String msg = "";
        HttpPost request = null;
        HttpRes res = null;

        try {
            request = new HttpPost(apiUrl);
            // TODO
            request.setConfig(requestConfig);
            Register register = new Register();
            register.configureTimeStamp();
            register.setToken("1a2b3c-4d5e");

            if (register.checkConstraint()) {
                request.setEntity(new StringEntity(XmlUtils.generateSoapBodyContent(register)));
                request.setHeader("Content-Type", "text/xml;charset=UTF-8");
                request.setHeader("SOAPAction", "http://tempuri.org/loginXML");
                
                Future<HttpResponse> future = httpclient.execute(request, null);
                HttpResponse response = future.get();
                res = getResponse(response);
                if (res.getStatusCode() != 200 || res.getData() == null) {
                    _r = 1410;
                }
                msg = "statusCode: " + res.getStatusCode();
            } else {
                msg = "Constraint violation";
                throw new Exception();
            }

        } catch (Exception ex) {
            _r = 1411;
        } finally {
            if (request != null) {
                request.releaseConnection();
            }
        }
        return _r == 0 ? JsonResult.success(0, msg, res.getData()) : JsonResult
                .error(_r, msg);
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
