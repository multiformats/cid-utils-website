ARG VERSION=latest
FROM node:14 as builder

ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY . /source/
RUN cd /source/ && \
  rm -rf dist && \
  npm install && \
  npm run build 

FROM nginx:stable-alpine as prod
ARG VERSION
RUN echo $VERSION > /version

COPY --from=0 source/dist/ /usr/share/nginx/html/
# update custom nginx conf reason by vue-router
COPY --from=0 source/default.conf /etc/nginx/conf.d/
# run script
COPY --from=0 source/entrypoint.sh /

RUN chmod 755 /entrypoint.sh

EXPOSE 80
CMD ["/entrypoint.sh"]

