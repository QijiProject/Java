package com.miracle.gameplatform.common;

import java.io.IOException;

import org.apache.http.impl.nio.client.CloseableHttpAsyncClient;
import org.apache.http.impl.nio.client.HttpAsyncClients;
import org.apache.http.impl.nio.conn.PoolingNHttpClientConnectionManager;
import org.apache.http.impl.nio.reactor.DefaultConnectingIOReactor;
import org.apache.http.nio.reactor.ConnectingIOReactor;
import org.apache.http.nio.reactor.IOReactorException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpAsyncFactory {
	private static final Logger logger = LoggerFactory
			.getLogger(HttpAsyncFactory.class);

	private final static HttpAsyncFactory httpAsyncFactory = new HttpAsyncFactory();

	private volatile boolean isRun = false;
	private CloseableHttpAsyncClient closeableHttpAsyncClient = null;
	private final int MAX_TOTAL = 100;
	private final int MAX_PER_ROUTE = 5;

	public static HttpAsyncFactory getInstance() {
		return httpAsyncFactory;
	}

	public synchronized void start() {
		if (isRun) {
			return;
		}
		isRun = true;

		init();

		addShutdownHook();
	}

	private void init() {
		try {
			ConnectingIOReactor ioReactor = new DefaultConnectingIOReactor();
			PoolingNHttpClientConnectionManager cm = new PoolingNHttpClientConnectionManager(
					ioReactor);
			cm.setMaxTotal(MAX_TOTAL);
			cm.setDefaultMaxPerRoute(MAX_PER_ROUTE);
			closeableHttpAsyncClient = HttpAsyncClients.custom()
					.setConnectionManager(cm).build();
			closeableHttpAsyncClient.start();
			logger.info("[Http Async Factory] http client pool start!");
		} catch (IOReactorException e) {
			logger.error("[Http Async Factory]", e);
			throw new RuntimeException("[Http Async Factory] init fail");
		}
	}

	private void addShutdownHook() {
		Runtime.getRuntime().addShutdownHook(new Thread() {
			@Override
			public void run() {
				closeHttpAsyncClient();
			}
		});
	}

	public synchronized void closeHttpAsyncClient() {
		if (!isRun) {
			return;
		}
		isRun = false;
		if (closeableHttpAsyncClient != null) {
			try {
				closeableHttpAsyncClient.close();
				logger.info("[Http Async Factory] shutdown");
			} catch (IOException e) {
				logger.error("[Http Async Factory] close", e);
			}
		}
	}

	public CloseableHttpAsyncClient getHttpAsyncClient() {
		return closeableHttpAsyncClient;
	}
}
