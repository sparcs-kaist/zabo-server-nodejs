FROM mongo:4.4 

RUN apt-get update && apt-get -y install cron && apt-get -y install awscli

# The mongodump job is scheduled at every 4 am
# The s3 cleanup job is scheduled at every 5 am
# you can set cron time at docker-compose also.
ENV DUMP_TIME="0 4 * * *" \
  CLEANUP_TIME="0 5 * * *" \
  TZ=Asia/Seoul \
  CRON_TZ=Asia/Seoul


ADD .scheduler/dump.sh /dump.sh
RUN chmod +x /dump.sh
CMD /dump.sh