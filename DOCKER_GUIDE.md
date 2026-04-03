# Docker Deployment Guide - Frontend

## Quick Start

Build and run all services:
```bash
docker-compose up -d --build
```

Then access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## What's Configured

### Frontend (Nginx)
- Multi-stage build (Node.js → Nginx)
- Optimized for React Router (SPA)
- Gzip compression enabled
- Security headers configured
- Health checks enabled
- Cache optimization:
  - Assets (js, css, images): 1 year cache
  - HTML: No cache (always revalidate)

### Backend
- Python FastAPI service
- Connects to MySQL database
- Environment variables for database URL
- Health check endpoint

### Database
- MySQL 8
- Persistent volume for data
- Health checks enabled

## Environment Variables

The frontend can access environment variables during build. In `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

To use in Vite:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Useful Commands

### Development Mode
```bash
# Watch logs
docker-compose logs -f frontend

# Rebuild frontend only
docker-compose build --no-cache frontend

# Stop containers
docker-compose down

# Remove volumes (database data)
docker-compose down -v
```

### Production Deployment
```bash
# Build optimized images
docker build -f frontend/Dockerfile -t barber-frontend:latest ./frontend

# Push to registry
docker push barber-frontend:latest

# Run on server
docker-compose up -d
```

## Ports

- Frontend: 5173 (accessible on http://localhost:5173)
- Backend: 8000 (accessible on http://localhost:8000)
- Database: 3307 (internal: 3306)

## Networking

All services use a custom bridge network `barber_network` for secure internal communication.

## Additional Files

- `frontend/nginx.conf` - Main Nginx configuration
- `frontend/nginx-default.conf` - Server block configuration
- `frontend/.dockerignore` - Files to exclude from Docker build
