package net.aimeizi.dubbo.controller;

import javax.servlet.http.HttpServletRequest;
import net.aimeizi.dubbo.service.PaymentService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.util.HtmlUtils;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;

/**
 *
 * dubbo 消费者
 *
 * @Reference 注解需要在 dubbo consumer中做如下配置
 *
 * <dubbo:annotation/>
 *	<context:component-scan base-package="net.aimeizi.dubbo.controller">
 *	<context:include-filter type="annotation" expression="com.alibaba.dubbo.config.annotation.Reference"/>
 * </context:component-scan>
 *
 * 若要使用@Autowired或@Resource注解需要显式声明bean
 *
 * 使用@Autowired或@Resource注解时需要使用dubbo:reference来声明
 * <dubbo:reference interface="net.aimeizi.dubbo.service.UserService" id="userService"/>
 * <dubbo:reference interface="net.aimeizi.dubbo.service.DemoService" id="demoService"/>
 *
 * 以上的配置均需要在spring mvc的DispatcherServlet配置中显式配置dubbo consumer的配置.如/WEB-INF/applicationContext-dubbo-consumer.xml 否则在Controller中服务报NullPointException
 * <servlet>
 *	<servlet-name>mvc-dispatcher</servlet-name>
 *		<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
 *	<init-param>
 *	<param-name>contextConfigLocation</param-name>
 *		<param-value>/WEB-INF/applicationContext*.xml,/WEB-INF/mvc-dispatcher-servlet.xml</param-value>
 *	</init-param>
 *	<load-on-startup>1</load-on-startup>
 * </servlet>
 *
 */
@Controller
public class DubboConsumerController {

    private final Logger logger = Logger.getLogger(DubboConsumerController.class);

    @RequestMapping(value = "/userAddView", method = RequestMethod.GET)
    public String userAddView() {
        return "userAdd";
    }

    @RequestMapping(value = "/showPaymentData", method = RequestMethod.GET)
    public String showPaymentData(Model model, HttpServletRequest req) throws Exception {
        String paymentData = IOUtils.toString(req.getSession().getServletContext().getResourceAsStream("/WEB-INF/data/sample-payment.xml"), "UTF-8");
        model.addAttribute("paymentData", HtmlUtils.htmlEscape(paymentData.replaceAll("\\s", "")));
        return "paymentData";
    }
}