package com.miracle.zookeeper;

import org.apache.curator.framework.CuratorFramework;

public interface IZKListener {
	void executor(CuratorFramework client);
}
