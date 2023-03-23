#!/bin/sh
###
 # @Author: your name
 # @Date: 2020-11-23 18:01:50
 # @LastEditTime: 2022-11-22 17:36:06
 # @LastEditors: Please set LastEditors
 # @Description: In User Settings Edit
 # @FilePath: \beehub-mobile-v3d:\Project\chain-wallet\entrypoint.sh
### 

# replace the frented params

VERSION=`cat version`
grep VERSION /usr/share/nginx/html/conf.js 2>/dev/null || echo -e "\nVERSION='$VERSION';" >> /usr/share/nginx/html/conf.js


# run nginx
exec /usr/sbin/nginx -g "daemon off;"

