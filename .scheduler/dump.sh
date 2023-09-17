#!/bin/bash

S3PATH="s3://$BUCKET/$BACKUP_FOLDER"
printenv | sed 's/^\([a-zA-Z0-9_]*\)=\(.*\)$/export \1="\2"/g' | grep -E "^export AWS" > /root/project_env.sh

echo "=> Creating backup script"
rm -f /backup.sh
cat <<EOF >> /backup.sh
#!/bin/bash
TIMESTAMP=\`/bin/date +"%Y%m%dT%H%M%S"\`
BACKUP_NAME=\${TIMESTAMP}.dump.gz
S3BACKUP=${S3PATH}\${BACKUP_NAME}
echo "=> Backup started"
if mongodump --host ${MONGODB_HOST} --db ${DB_STR} --archive=\${BACKUP_NAME} --gzip && aws s3 cp \${BACKUP_NAME} \${S3BACKUP} && rm \${BACKUP_NAME} ;then
    echo "   > Backup succeeded"
else
    echo "   > Backup failed"
fi
echo "=> Done"
EOF
chmod +x /backup.sh

echo "=> Creating list script"
rm -f /listbackups.sh
cat <<EOF >> /listbackups.sh
#!/bin/bash
aws s3 ls ${S3PATH}
EOF
chmod +x /listbackups.sh
echo "=> List script created"

echo "=> Creating cleanup script. This removes dump file except 8 recent files"
rm -f /cleanup.sh 
cat <<EOF >> /cleanup.sh 
#!/bin/bash
echo "=> Cleanup started"
rm -f /tmp/cleanup_s3s.log
aws s3 ls ${S3PATH} | awk '{print \$1, \$2, \$4}' | sort -r -k3 | tail -n +5 > /tmp/cleanup_s3s.log 
echo "=>Printing cleanup list"
cat /tmp/cleanup_s3s.log

for file_name in \$(cat /tmp/cleanup_s3s.log | awk '{print \$3}')
do
    echo "removing \${file_name}..."
    aws s3 rm ${S3PATH}\${file_name}
done

echo "=> Cleanup done!"
EOF
chmod +x /cleanup.sh
echo "=> Cleanup script created"

touch /backup_log/mongo_backup.log

echo "${DUMP_TIME} . /root/project_env.sh; /backup.sh >> /backup_log/mongo_backup.log 2>&1" > /crontab.conf
echo "${CLEANUP_TIME} . /root/project_env.sh; /cleanup.sh >> /backup_log/mongo_backup.log 2>&1" >> /crontab.conf
crontab  /crontab.conf
echo "=> Running cron job"
cron && tail -f /backup_log/mongo_backup.log