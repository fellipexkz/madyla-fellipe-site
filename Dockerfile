FROM nginx:stable-alpine-slim

RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

COPY --chown=nginx:nginx index.html /usr/share/nginx/html/
COPY --chown=nginx:nginx assets/ /usr/share/nginx/html/assets/
COPY --chown=nginx:nginx src/ /usr/share/nginx/html/src/

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    charset utf-8; \
    add_header X-Frame-Options "DENY" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    location ~* \.css$ { \
        add_header Content-Type "text/css; charset=utf-8"; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.js$ { \
        add_header Content-Type "application/javascript; charset=utf-8"; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.json$ { \
        add_header Content-Type "application/json; charset=utf-8"; \
        expires 1h; \
    } \
    location ~* \.svg$ { \
        add_header Content-Type "image/svg+xml; charset=utf-8"; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.ttf$ { \
        add_header Content-Type "font/ttf"; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.(woff|woff2)$ { \
        add_header Content-Type "font/woff"; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.eot$ { \
        add_header Content-Type "application/vnd.ms-fontobject"; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location ~* \.(jpg|jpeg|png|gif|ico|mp3)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "healthy"; \
        add_header Content-Type text/plain; \
    } \
    server_tokens off; \
}' > /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
