#!/bin/sh

RETVAL=$?

# resolve links - $0 may be a softlink
PRG="$0"

while [ -h "$PRG" ] ; do
  ls=`ls -ld "$PRG"`
  link=`expr "$ls" : '.*-> \(.*\)$'`
  if expr "$link" : '/.*' > /dev/null; then
    PRG="$link"
  else
    PRG=`dirname "$PRG"`/"$link"
  fi
done

PRGDIR=`dirname "$PRG"`

cd $PRGDIR

#JDK
if test -z ${JAVA_HOME}  
then  
    JAVA_BIN=java  
else  
    JAVA_BIN=${JAVA_HOME}/bin/java  
fi

#APP name
APP_NAME=kj-gptransfer.jar

#log file
APP_LOG=logs/log.log

CLASSPATH=$(pwd)

# -Dsun.net.inetaddr.ttl=0
#java options -Xss256k
JAVA_OPTS="-server -Xms1024m -Xmx1024m -Xmn256m 
 -XX:PermSize=64m -XX:MaxPermSize=256 
  -XX:+UseConcMarkSweepGC
  -XX:+CMSParallelRemarkEnabled
  -XX:+UseCMSCompactAtFullCollection 
  -XX:LargePageSizeInBytes=64m 
  -XX:+UseFastAccessorMethods 
  -XX:+UseCMSInitiatingOccupancyOnly 
  -XX:CMSInitiatingOccupancyFraction=70"


#init psid
psid=0

checkpid() {
   psidv=$(ps aux | grep java | grep $APP_NAME | awk '{print $2}')
 
   if [ $psidv ]; then
      psid=$psidv
   else
      psid=0
   fi
}

start() {
   checkpid
 
   if [ $psid -ne 0 ]; then
      echo "================================"
      echo "warn: $APP_NAME already started! (pid=$psid)"
      echo "================================"
   else
      echo -n "Starting $APP_NAME ..."
      #exec $JAVA_BIN $JAVA_OPTS -jar $APP_NAME 5> $APP_LOG &
      nohup $JAVA_BIN $JAVA_OPTS -jar $APP_NAME > $APP_LOG 2>&1 &
      checkpid
      if [ $psid -ne 0 ]; then
         echo "(pid=$psid) [OK]"
      else
         echo "[Failed]"
      fi
   fi
}

stop() {
   checkpid
   count=1
   if [ $psid -ne 0 ]; then
      echo -n "Stopping $APP_NAME ...(pid=$psid) "
      kill $psid
      if [ $? -eq 0 ]; then
         echo "[OK]"
      else
         echo "[Failed, trying...]"
         while checkpid;
         do
            let count=$count+1
            echo "Stopping $count times"
            if [ $count -gt 5 ]; then
                echo "kill -9 $psid"
                kill -9 $psid
            else
                kill $psid
            fi
            sleep 3;
         done
      fi
   else
      echo "================================"
      echo "warn: $APP_NAME is not running"
      echo "================================"
   fi
}

status() {
   checkpid
 
   if [ $psid -ne 0 ];  then
      echo "$APP_NAME is running! (pid=$psid)"
   else
      echo "$APP_NAME is not running"
   fi
}

case "$1" in
'start')
  start
  ;;
'stop')
  stop
  ;;
'restart')
  stop
  start
  ;;
'status')
  status
  ;;
*)
  echo "Usage: $0 {start|stop|restart|status}"
  exit 1
  ;;

esac
exit $RETVAL
