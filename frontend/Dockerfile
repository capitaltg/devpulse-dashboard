FROM nginx:1.29-alpine

LABEL org.opencontainers.image.source=https://github.com/capitaltg/devpulse-dashboard
LABEL org.opencontainers.image.description="DevPulse frontend (React + nginx)"
LABEL org.opencontainers.image.licenses=Apache-2.0

COPY ./dist/ /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY ./docker/nginx/starter-kit.conf /etc/nginx/conf.d/