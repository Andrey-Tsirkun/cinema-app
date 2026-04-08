#!/bin/bash
# Host Nginx reverse proxy for cinema-app (docker-compose.prod.yml).
# Backend has no /api prefix; Nginx strips /api/ when forwarding to :4000.
# Run on VPS: sudo bash scripts/setup-nginx.sh YOUR_SERVER_IP
# Frontend → 127.0.0.1:3000, API → 127.0.0.1:4000 (both from compose prod).

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Run as root: sudo bash scripts/setup-nginx.sh${NC}"
  exit 1
fi

if ! command -v nginx &>/dev/null; then
  echo -e "${YELLOW}Installing Nginx...${NC}"
  apt update
  apt install -y nginx
fi

SERVER_IP=${1:-155.212.244.111}

echo -e "${YELLOW}Creating Nginx config for cinema-app (server_name ${SERVER_IP})...${NC}"
cat >/etc/nginx/sites-available/cinema-app <<EOF
server {
    listen 80;
    server_name ${SERVER_IP} _;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API: /api/* → backend :4000/* (Nest has no global /api prefix)
    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:4000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

if [ -f /etc/nginx/sites-enabled/default ]; then
  echo -e "${YELLOW}Removing default site...${NC}"
  rm -f /etc/nginx/sites-enabled/default
fi

if [ ! -L /etc/nginx/sites-enabled/cinema-app ]; then
  echo -e "${YELLOW}Enabling cinema-app site...${NC}"
  ln -s /etc/nginx/sites-available/cinema-app /etc/nginx/sites-enabled/cinema-app
fi

if nginx -t; then
  systemctl reload nginx || systemctl restart nginx
  echo -e "${GREEN}Nginx configured. Config: /etc/nginx/sites-available/cinema-app${NC}"
else
  echo -e "${RED}Nginx config test failed. Fix and run: nginx -t && systemctl reload nginx${NC}"
  exit 1
fi
