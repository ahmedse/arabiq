# Production Deployment Guide

## Prerequisites
- Docker and Docker Compose installed on production server
- PostgreSQL running on host
- Nginx configured to proxy requests
- SSH access to server

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in all required values:
   - Database credentials
   - JWT secrets
   - Email settings
   - CORS origins (include `https://arabiq.tech`)

## Key Configuration Notes

### CORS
- Set `CORS_ORIGIN=https://arabiq.tech` for production
- Include localhost origins for development if needed

### URLs
- Web app: `NEXT_PUBLIC_CMS_URL=http://localhost:1337` (internal communication)
- Public URLs handled by Nginx proxy

### Database
- Host: `host.docker.internal` (for Linux, may need `network_mode: host`)
- Ensure Postgres is accessible from containers

## Deployment

1. Run `./deploy.sh` from local machine
2. Or manually:
   - Build images locally
   - Transfer to server
   - Load and run with docker-compose

## Nginx Configuration Example

```
server {
    listen 80;
    server_name arabiq.tech;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /cms-admin {
        proxy_pass http://localhost:1337/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:1337;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

- Check container logs: `docker-compose logs`
- Verify environment variables are loaded
- Ensure database connectivity
- Test CORS from browser dev tools