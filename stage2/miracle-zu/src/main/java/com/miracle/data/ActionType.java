package com.miracle.data;

public class ActionType {
	public static enum BType {
		TRANSFER(1600);

		private int code;

		private BType(int code) {
			this.code = code;
		}

		public int getCode() {
			return code;
		}

		public void setCode(int code) {
			this.code = code;
		}
	}

	public static enum SType {
		TRANSFER_OUT_GP(1610), TRANSFER_IN_GP(1611), TRANSFER_OUT_MASTER_TO_GP(
				1612), TRANSFER_IN_MASTER_FROM_GP(1613), TRANSFER_ROLLBACK(1614), TRANSFER_AGENT_TO_PLAYER(
				1650), TRANSFER_IN_PLAYER_FROM_AGENT(1651), TRANSFER_PLAYER_TO_AGENT(
				1652), TRANSFER_IN_AGENT_FROM_PLAYER(1653);

		private int code;

		private SType(int code) {
			this.code = code;
		}

		public int getCode() {
			return code;
		}

		public void setCode(int code) {
			this.code = code;
		}
	}
}
