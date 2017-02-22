package com.miracle.gameplatform;

import java.util.concurrent.TimeUnit;

import org.springframework.context.support.ClassPathXmlApplicationContext;

import com.miracle.gameplatform.common.HttpAsyncFactory;

public class App {
	@SuppressWarnings("resource")
	public static void main(String[] args) {
		ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext(
				new String[] { "spring.xml", "provider.xml" });
		context.start();
                System.out.println("test after start");
		context.registerShutdownHook();

		// init zk

		HttpAsyncFactory.getInstance().start();

		for (;;) {
			try {
				TimeUnit.MINUTES.sleep(10);
			} catch (InterruptedException e) {
			}
		}
	}
}
