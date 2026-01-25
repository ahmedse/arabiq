#!/bin/bash
# Start Arabiq services

set -e

CMS_DIR="/home/ahmed/arabiq/apps/cms"
WEB_DIR="/home/ahmed/arabiq/apps/web"

# Function to kill existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    pkill -9 -f "strapi" 2>/dev/null || true
    pkill -9 -f "next" 2>/dev/null || true
    sleep 2
}

# Function to start CMS
start_cms() {
    echo "🚀 Starting CMS (Strapi)..."
    cd "$CMS_DIR"
    nohup pnpm start > /tmp/arabiq-cms.log 2>&1 &
    echo $! > /tmp/arabiq-cms.pid
    echo "   CMS PID: $(cat /tmp/arabiq-cms.pid)"
}

# Function to start Web
start_web() {
    echo "🌐 Starting Web (Next.js)..."
    cd "$WEB_DIR"
    nohup pnpm dev > /tmp/arabiq-web.log 2>&1 &
    echo $! > /tmp/arabiq-web.pid
    echo "   Web PID: $(cat /tmp/arabiq-web.pid)"
}

# Function to check status
check_status() {
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 8
    
    echo ""
    echo "📊 Status Check:"
    
    if lsof -i :1337 -t >/dev/null 2>&1; then
        echo "   ✅ CMS running on http://localhost:1337"
    else
        echo "   ❌ CMS not running"
        echo "   📋 Log: tail -50 /tmp/arabiq-cms.log"
    fi
    
    if lsof -i :3000 -t >/dev/null 2>&1; then
        echo "   ✅ Web running on http://localhost:3000"
    else
        echo "   ❌ Web not running"
        echo "   📋 Log: tail -50 /tmp/arabiq-web.log"
    fi
}

# Main
cleanup
start_cms
sleep 5  # Give CMS time to start before web
start_web
check_status

echo ""
echo "📝 Admin: http://localhost:1337/admin"
echo "   Login: admin@arabiq.sa / AdminPass123"
echo ""
echo "🌐 Website: http://localhost:3000"
echo ""
echo "📋 Logs:"
echo "   CMS: tail -f /tmp/arabiq-cms.log"
echo "   Web: tail -f /tmp/arabiq-web.log"
