package com.keizak.common;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

public class JdbcUtil {
	// 声明线程共享变量
	private static ThreadLocal<Connection> container = new ThreadLocal<Connection>();

	public static ThreadLocal<Connection> getContainer() {
		return container;
	}

	public static Connection getConnection(DataSource ds) throws SQLException {
		try {
			// 得到当前线程上绑定的连接
			Connection conn = container.get();
			if (conn == null) { // 代表线程上没有绑定连接
				conn = ds.getConnection();
				container.set(conn);
			}
			return conn;
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	public static Connection getConnection() {
		return container.get();
	}

	public static void startTransaction() {
		try {
			Connection conn = container.get();
			if (conn != null) {
				conn.setAutoCommit(false);
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public static void commitTransaction() {
		try {
			Connection conn = container.get();
			if (conn != null) {
				conn.commit();
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	public static void rollbackTransaction() {
		try {
			Connection conn = container.get();
			if (conn != null) {
				conn.rollback();
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}


	public static void closeConnection() {
		try {
			Connection conn = container.get();
			if (conn != null) {
				conn.close();
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		} finally {
			container.remove();
		}
	}
}
