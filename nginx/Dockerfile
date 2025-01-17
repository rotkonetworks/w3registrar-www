FROM nginx

COPY --chown=nginx:nginx ./dist/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
