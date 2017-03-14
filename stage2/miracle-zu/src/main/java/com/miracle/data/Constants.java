package com.miracle.data;

public class Constants {
	private static String _tz = "Asia/Shanghai";

	// session
	public static final String PLAYER_TOKEN_AUTHKEY = "vc";

	public static enum Switch {
		ON, OFF, MAINTAIN, KZMAINTAIN
	}

	public static String getTimezone() {
		return _tz;
	}

	public static void setTimezone(String tz) {
		_tz = tz;
	}
}
