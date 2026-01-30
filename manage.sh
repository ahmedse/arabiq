#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
CMS_DIR="$ROOT_DIR/apps/cms"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$RUN_DIR" "$LOG_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $*"; }

usage() {
  cat <<'EOF'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ArabiQ Project Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: ./manage.sh <command> [service]

Commands:
  start [all|cms|web]     Start service(s) in dev mode
  stop [all|cms|web]      Stop service(s)
  restart [all|cms|web]   Restart service(s)
  clean [all|cms|web]     Clean artifacts + node_modules
  logs [cms|web] [opts]   View logs
  doctor                  Check environment & health
  seed                    Run CMS seeder

Log options:
  -f, --follow            Follow log output
  -n, --lines <N>         Show last N lines (default: 100)

Examples:
  ./manage.sh start             # Start CMS, wait for health, start Web
  ./manage.sh start cms         # Start only CMS
  ./manage.sh stop              # Stop all services
  ./manage.sh restart web       # Restart only Web
  ./manage.sh clean all         # Full clean (stops + removes node_modules)
  ./manage.sh logs cms -f       # Follow CMS logs
  ./manage.sh logs web 200      # Last 200 lines of Web logs
  ./manage.sh doctor            # Full health check
  ./manage.sh seed              # Seed CMS data

Services:
  cms    Strapi CMS      → http://localhost:1337
  web    Next.js App     → http://localhost:3000

Notes:
  • Logs stored in .logs/
  • PIDs stored in .run/
  • Automatic port conflict resolution
  • CMS health check before starting Web
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
}

#─────────────────────────────────────────────────────────────────────────────
# Port & Process Utilities
#─────────────────────────────────────────────────────────────────────────────

# Find PID listening on a port (cross-platform)
find_pid_by_port() {
  local port="$1"
  local pid=""
  
  # macOS / BSD: lsof
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null | head -1) || true
    [[ -n "$pid" ]] && { echo "$pid"; return 0; }
  fi
  
  # Linux: ss
  if command -v ss >/dev/null 2>&1; then
    pid=$(ss -tlnp "sport = :${port}" 2>/dev/null | grep -oP 'pid=\K\d+' | head -1) || true
    [[ -n "$pid" ]] && { echo "$pid"; return 0; }
  fi
  
  # Fallback: netstat
  if command -v netstat >/dev/null 2>&1; then
    pid=$(netstat -tlnp 2>/dev/null | awk -v p="$port" '$4 ~ ":"p"$" {split($7,a,"/"); print a[1]}' | head -1) || true
    [[ -n "$pid" ]] && { echo "$pid"; return 0; }
  fi
  
  echo ""
}

# Check if port is in use
is_port_busy() {
  local port="$1"
  [[ -n "$(find_pid_by_port "$port")" ]]
}

# Wait for port to become available (process listening)
wait_for_port() {
  local port="$1"
  local timeout="${2:-120}"
  local interval="${3:-2}"
  local start_ts elapsed
  start_ts=$(date +%s)
  
  while true; do
    if is_port_busy "$port"; then
      return 0
    fi
    
    elapsed=$(( $(date +%s) - start_ts ))
    if (( elapsed >= timeout )); then
      return 1
    fi
    
    sleep "$interval"
  done
}

# Wait for port to become free
wait_for_port_free() {
  local port="$1"
  local timeout="${2:-10}"
  local start_ts elapsed
  start_ts=$(date +%s)
  
  while true; do
    if ! is_port_busy "$port"; then
      return 0
    fi
    
    elapsed=$(( $(date +%s) - start_ts ))
    if (( elapsed >= timeout )); then
      return 1
    fi
    
    sleep 0.5
  done
}

# Kill a process gracefully, escalate to SIGKILL if needed
kill_pid_graceful() {
  local pid="$1"
  local timeout="${2:-10}"
  
  [[ -z "$pid" ]] && return 0
  
  # Check if process exists
  if ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  
  log_info "Stopping process (pid=$pid)..."
  
  # Send SIGTERM
  kill "$pid" 2>/dev/null || true
  
  # Wait for graceful shutdown
  local waited=0
  while (( waited < timeout )); do
    if ! kill -0 "$pid" 2>/dev/null; then
      log_info "Process $pid stopped gracefully"
      return 0
    fi
    sleep 0.5
    ((waited++)) || true
  done
  
  # Escalate to SIGKILL
  log_warn "Process $pid did not stop gracefully, sending SIGKILL..."
  kill -9 "$pid" 2>/dev/null || true
  sleep 1
  
  if kill -0 "$pid" 2>/dev/null; then
    log_error "Failed to kill process $pid"
    return 1
  fi
  
  log_info "Process $pid killed"
  return 0
}

# Kill all processes on a port
kill_port() {
  local port="$1"
  local pid
  
  while true; do
    pid=$(find_pid_by_port "$port")
    [[ -z "$pid" ]] && break
    
    log_warn "Port $port in use by pid=$pid, killing..."
    kill_pid_graceful "$pid"
    sleep 0.5
  done
}

# Ensure port is free, kill any process using it
ensure_port_free() {
  local port="$1"
  local name="$2"
  
  if is_port_busy "$port"; then
    local pid
    pid=$(find_pid_by_port "$port")
    log_warn "$name: Port $port is busy (pid=$pid), freeing..."
    kill_port "$port"
    
    if ! wait_for_port_free "$port" 10; then
      log_error "$name: Could not free port $port"
      return 1
    fi
    
    log_info "$name: Port $port is now free"
  fi
  
  return 0
}

#─────────────────────────────────────────────────────────────────────────────
# PID File Utilities
#─────────────────────────────────────────────────────────────────────────────

get_pidfile() { echo "$RUN_DIR/${1}.pid"; }
get_logfile() { echo "$LOG_DIR/${1}.log"; }

read_pid() {
  local pidfile
  pidfile=$(get_pidfile "$1")
  [[ -f "$pidfile" ]] && cat "$pidfile" 2>/dev/null || echo ""
}

write_pid() {
  local name="$1" pid="$2"
  echo "$pid" > "$(get_pidfile "$name")"
}

remove_pid() {
  rm -f "$(get_pidfile "$1")"
}

is_pid_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# Clean stale pidfile if process is dead
cleanup_stale_pid() {
  local name="$1"
  local pid
  pid=$(read_pid "$name")
  
  if [[ -n "$pid" ]] && ! is_pid_running "$pid"; then
    log_warn "$name: Removing stale pidfile (pid=$pid)"
    remove_pid "$name"
  fi
}

#─────────────────────────────────────────────────────────────────────────────
# Log Utilities
#─────────────────────────────────────────────────────────────────────────────

# Rotate log if too large (>50MB)
rotate_log_if_needed() {
  local logfile="$1"
  local max_size=$((50 * 1024 * 1024))  # 50MB
  
  if [[ -f "$logfile" ]]; then
    local size
    size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
    
    if (( size > max_size )); then
      local rotated="${logfile}.$(date +%Y%m%d_%H%M%S)"
      mv "$logfile" "$rotated"
      gzip "$rotated" 2>/dev/null &  # Compress in background
      log_info "Rotated log: $rotated.gz"
    fi
  fi
}

# Add timestamp header to log
log_header() {
  local logfile="$1"
  local name="$2"
  local action="$3"
  
  {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $name - $action"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  } >> "$logfile"
}

#─────────────────────────────────────────────────────────────────────────────
# Health Check Utilities
#─────────────────────────────────────────────────────────────────────────────

check_cms_health() {
  curl -sf http://127.0.0.1:1337/admin/init >/dev/null 2>&1
}

check_web_health() {
  curl -sf http://127.0.0.1:3000 >/dev/null 2>&1
}

wait_for_cms_healthy() {
  local timeout="${1:-180}"
  local start_ts elapsed
  start_ts=$(date +%s)
  
  log_info "Waiting for CMS to become healthy (timeout: ${timeout}s)..."
  
  while true; do
    if check_cms_health; then
      log_info "CMS: healthy ✓"
      return 0
    fi
    
    elapsed=$(( $(date +%s) - start_ts ))
    if (( elapsed >= timeout )); then
      log_error "CMS: not healthy after ${timeout}s"
      return 1
    fi
    
    # Show progress every 10 seconds
    if (( elapsed % 10 == 0 )) && (( elapsed > 0 )); then
      log_info "Still waiting for CMS... (${elapsed}s elapsed)"
    fi
    
    sleep 2
  done
}

wait_for_web_healthy() {
  local timeout="${1:-60}"
  local start_ts elapsed
  start_ts=$(date +%s)
  
  log_info "Waiting for Web to become healthy (timeout: ${timeout}s)..."
  
  while true; do
    if check_web_health; then
      log_info "Web: healthy ✓"
      return 0
    fi
    
    elapsed=$(( $(date +%s) - start_ts ))
    if (( elapsed >= timeout )); then
      log_error "Web: not healthy after ${timeout}s"
      return 1
    fi
    
    sleep 2
  done
}

#─────────────────────────────────────────────────────────────────────────────
# Build Utilities
#─────────────────────────────────────────────────────────────────────────────

# Ensure dependencies are installed
ensure_deps() {
  local name="$1"
  local dir="$2"
  
  if [[ ! -d "$dir/node_modules" ]]; then
    log_step "$name: Installing dependencies..."
    
    cd "$dir"
    if [[ -f "pnpm-lock.yaml" ]]; then
      pnpm install --frozen-lockfile || pnpm install
    elif [[ -f "package-lock.json" ]]; then
      npm ci || npm install
    elif [[ -f "yarn.lock" ]]; then
      yarn install --frozen-lockfile || yarn install
    else
      npm install
    fi
    
    log_info "$name: Dependencies installed ✓"
  fi
}

# Run CMS build script if exists
run_cms_build() {
  if [[ -f "$CMS_DIR/build.sh" ]]; then
    log_step "CMS: Running build.sh..."
    (cd "$CMS_DIR" && bash build.sh) || {
      log_error "CMS: build.sh failed"
      return 1
    }
    log_info "CMS: build.sh completed ✓"
  fi
}

# Ensure Web has .next build for production (skip in dev)
check_web_build() {
  local mode="$1"
  
  if [[ "$mode" == "prod" ]] && [[ ! -d "$WEB_DIR/.next" ]]; then
    log_step "Web: Building for production..."
    (cd "$WEB_DIR" && pnpm build) || {
      log_error "Web: Build failed"
      return 1
    }
    log_info "Web: Build completed ✓"
  fi
}

#─────────────────────────────────────────────────────────────────────────────
# Core Service Functions
#─────────────────────────────────────────────────────────────────────────────

do_stop() {
  local name="$1"
  local port="$2"
  
  log_step "Stopping $name..."
  
  # Stop from pidfile
  local pid
  pid=$(read_pid "$name")
  
  if [[ -n "$pid" ]]; then
    if is_pid_running "$pid"; then
      kill_pid_graceful "$pid"
    else
      log_warn "$name: Stale pidfile (pid=$pid)"
    fi
    remove_pid "$name"
  fi
  
  # Kill any orphan on port
  if is_port_busy "$port"; then
    local orphan_pid
    orphan_pid=$(find_pid_by_port "$port")
    log_warn "$name: Found orphan process on port $port (pid=$orphan_pid)"
    kill_pid_graceful "$orphan_pid"
  fi
  
  # Verify port is free
  if ! wait_for_port_free "$port" 10; then
    log_error "$name: Port $port still busy after stop"
    return 1
  fi
  
  log_info "$name: stopped ✓"
}

do_start() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local cmd="$4"
  local health_check="$5"
  local health_timeout="${6:-120}"
  
  local logfile
  logfile=$(get_logfile "$name")
  
  log_step "Starting $name..."
  
  # Validate directory
  if [[ ! -d "$dir" ]]; then
    log_error "$name: Directory not found: $dir"
    return 1
  fi
  
  # Clean stale pidfile
  cleanup_stale_pid "$name"
  
  # Check if already running
  if is_port_busy "$port"; then
    local existing_pid
    existing_pid=$(find_pid_by_port "$port")
    log_warn "$name: Already running on port $port (pid=$existing_pid)"
    write_pid "$name" "$existing_pid"
    return 0
  fi
  
  # Ensure port is free
  ensure_port_free "$port" "$name" || return 1
  
  # Ensure dependencies
  ensure_deps "$name" "$dir"
  
  # Rotate log if needed
  rotate_log_if_needed "$logfile"
  
  # Add log header
  log_header "$logfile" "$name" "Starting"
  
  # Start process
  cd "$dir"
  
  nohup bash -c "
    # Load environment files
    [[ -f .env ]] && { set -a; source .env; set +a; }
    [[ -f .env.local ]] && { set -a; source .env.local; set +a; }
    
    # Execute command
    exec $cmd
  " >> "$logfile" 2>&1 &
  
  local initial_pid=$!
  write_pid "$name" "$initial_pid"
  
  log_info "$name: Process launched (initial pid=$initial_pid)"
  log_info "$name: Waiting for port $port..."
  
  # Wait for port
  if ! wait_for_port "$port" "$health_timeout"; then
    log_error "$name: Failed to bind to port $port within ${health_timeout}s"
    log_error "Last 50 lines of log:"
    tail -50 "$logfile"
    remove_pid "$name"
    return 1
  fi
  
  # Update pidfile with actual process on port (may differ due to forking)
  local actual_pid
  actual_pid=$(find_pid_by_port "$port")
  if [[ -n "$actual_pid" ]]; then
    write_pid "$name" "$actual_pid"
    log_info "$name: Running on port $port (pid=$actual_pid)"
  fi
  
  # Health check
  if [[ -n "$health_check" ]]; then
    log_info "$name: Performing health check..."
    
    if $health_check; then
      log_info "$name: Health check passed ✓"
    else
      log_warn "$name: Health check failed (service may still be starting)"
    fi
  fi
  
  log_info "$name: started ✓"
  log_info "$name: Logs → $logfile"
}

do_clean() {
  local name="$1"
  local dir="$2"
  local port="$3"
  
  log_step "Cleaning $name..."
  
  # Stop first
  do_stop "$name" "$port" || true
  
  # Remove build artifacts
  case "$name" in
    web)
      rm -rf "$dir/.next" "$dir/.turbo" "$dir/out" 2>/dev/null || true
      log_info "$name: Removed .next, .turbo, out"
      ;;
    cms)
      rm -rf "$dir/.strapi" "$dir/.tmp" "$dir/dist" "$dir/.cache" "$dir/build" 2>/dev/null || true
      log_info "$name: Removed .strapi, .tmp, dist, .cache, build"
      ;;
  esac
  
  # Remove node_modules
  if [[ -d "$dir/node_modules" ]]; then
    log_info "$name: Removing node_modules (this may take a moment)..."
    rm -rf "$dir/node_modules"
    log_info "$name: Removed node_modules"
  fi
  
  # Remove pidfile and logs
  rm -f "$(get_pidfile "$name")" "$(get_logfile "$name")"* 2>/dev/null || true
  
  log_info "$name: cleaned ✓"
}

do_logs() {
  local name="$1"
  shift
  
  local logfile
  logfile=$(get_logfile "$name")
  
  # Parse options
  local follow=false
  local lines=100
  
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -f|--follow)
        follow=true
        shift
        ;;
      -n|--lines)
        lines="${2:-100}"
        shift 2
        ;;
      [0-9]*)
        lines="$1"
        shift
        ;;
      *)
        shift
        ;;
    esac
  done
  
  # Check if log exists
  if [[ ! -f "$logfile" ]]; then
    log_warn "$name: No log file yet: $logfile"
    return 0
  fi
  
  # Output logs
  if $follow; then
    log_info "$name: Following logs (Ctrl+C to exit)..."
    tail -n "$lines" -f "$logfile"
  else
    tail -n "$lines" "$logfile"
  fi
}

#─────────────────────────────────────────────────────────────────────────────
# Service Wrappers
#─────────────────────────────────────────────────────────────────────────────

start_cms() {
  # Run build script first
  run_cms_build || return 1
  
  # Start with develop command
  do_start "cms" "$CMS_DIR" 1337 "npm run develop" "check_cms_health" 180
}

start_web() {
  # Start with dev command
  do_start "web" "$WEB_DIR" 3000 "pnpm dev --port 3000" "check_web_health" 60
}

stop_cms() { do_stop "cms" 1337; }
stop_web() { do_stop "web" 3000; }

restart_cms() {
  stop_cms
  start_cms
}

restart_web() {
  stop_web
  start_web
}

clean_cms() { do_clean "cms" "$CMS_DIR" 1337; }
clean_web() { do_clean "web" "$WEB_DIR" 3000; }

logs_cms() { do_logs "cms" "$@"; }
logs_web() { do_logs "web" "$@"; }

#─────────────────────────────────────────────────────────────────────────────
# Composite Commands
#─────────────────────────────────────────────────────────────────────────────

start_all() {
  log_step "Starting all services..."
  echo ""
  
  # Start CMS first
  start_cms || {
    log_error "CMS failed to start, aborting"
    return 1
  }
  
  echo ""
  
  # Wait for CMS to be healthy before starting Web
  if ! wait_for_cms_healthy 180; then
    log_error "CMS not healthy, but attempting to start Web anyway..."
  fi
  
  echo ""
  
  # Start Web
  start_web || {
    log_error "Web failed to start"
    return 1
  }
  
  echo ""
  log_info "All services started ✓"
  echo ""
  echo "  CMS: http://localhost:1337"
  echo "  Web: http://localhost:3000"
  echo ""
}

stop_all() {
  log_step "Stopping all services..."
  echo ""
  
  stop_web || true
  stop_cms || true
  
  echo ""
  log_info "All services stopped ✓"
}

restart_all() {
  log_step "Restarting all services..."
  echo ""
  
  stop_all
  echo ""
  start_all
}

clean_all() {
  log_step "Cleaning all services..."
  echo ""
  
  clean_web
  echo ""
  clean_cms
  
  # Also clean root node_modules if monorepo
  if [[ -d "$ROOT_DIR/node_modules" ]]; then
    log_info "Root: Removing node_modules..."
    rm -rf "$ROOT_DIR/node_modules"
  fi
  
  # Clean pnpm store cache (optional, can be aggressive)
  # pnpm store prune 2>/dev/null || true
  
  echo ""
  log_info "All services cleaned ✓"
}

#─────────────────────────────────────────────────────────────────────────────
# Doctor
#─────────────────────────────────────────────────────────────────────────────

doctor() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ArabiQ Doctor"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Paths
  echo "┌─ Paths ─────────────────────────────────────────────────────────────┐"
  echo "│  ROOT: $ROOT_DIR"
  printf "│  WEB:  $WEB_DIR "
  [[ -d "$WEB_DIR" ]] && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
  printf "│  CMS:  $CMS_DIR "
  [[ -d "$CMS_DIR" ]] && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Tools
  echo "┌─ Tools ─────────────────────────────────────────────────────────────┐"
  for cmd in node pnpm npm curl psql; do
    printf "│  %-8s " "$cmd"
    if command -v "$cmd" >/dev/null 2>&1; then
      local version
      version=$($cmd --version 2>/dev/null | head -1)
      echo -e "${GREEN}✓${NC}  $version"
    else
      echo -e "${RED}✗ not found${NC}"
    fi
  done
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Environment Files
  echo "┌─ Environment Files ─────────────────────────────────────────────────┐"
  for f in "$WEB_DIR/.env" "$WEB_DIR/.env.local" "$CMS_DIR/.env" "$CMS_DIR/.env.local"; do
    local short_path="${f#$ROOT_DIR/}"
    printf "│  %-40s " "$short_path"
    if [[ -f "$f" ]]; then
      echo -e "${GREEN}✓${NC}"
    else
      echo -e "${YELLOW}○ missing${NC}"
    fi
  done
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Dependencies
  echo "┌─ Dependencies ──────────────────────────────────────────────────────┐"
  printf "│  %-40s " "Web node_modules"
  [[ -d "$WEB_DIR/node_modules" ]] && echo -e "${GREEN}✓ installed${NC}" || echo -e "${YELLOW}○ not installed${NC}"
  printf "│  %-40s " "CMS node_modules"
  [[ -d "$CMS_DIR/node_modules" ]] && echo -e "${GREEN}✓ installed${NC}" || echo -e "${YELLOW}○ not installed${NC}"
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Services
  echo "┌─ Services ──────────────────────────────────────────────────────────┐"
  for svc_info in "cms:1337" "web:3000"; do
    local name="${svc_info%:*}"
    local port="${svc_info#*:}"
    local pid
    pid=$(find_pid_by_port "$port")
    
    printf "│  %-6s " "$name"
    if [[ -n "$pid" ]]; then
      echo -e "Port $port  ${GREEN}● running${NC}  (pid=$pid)"
    else
      echo -e "Port $port  ${RED}○ stopped${NC}"
    fi
  done
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Health
  echo "┌─ Health ────────────────────────────────────────────────────────────┐"
  printf "│  CMS  http://127.0.0.1:1337/admin/init  "
  if check_cms_health; then
    echo -e "${GREEN}✓ healthy${NC}"
  else
    echo -e "${RED}✗ unhealthy${NC}"
  fi
  
  printf "│  Web  http://127.0.0.1:3000             "
  if check_web_health; then
    echo -e "${GREEN}✓ healthy${NC}"
  else
    echo -e "${RED}✗ unhealthy${NC}"
  fi
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Database (optional)
  echo "┌─ Database ──────────────────────────────────────────────────────────┐"
  if command -v psql >/dev/null 2>&1; then
    local db_name="${DATABASE_NAME:-arabiq}"
    printf "│  PostgreSQL ($db_name)  "
    if psql -U "$db_name" -d "$db_name" -c "SELECT 1" >/dev/null 2>&1; then
      echo -e "${GREEN}✓ connected${NC}"
      
      # Check for data
      local site_count homepage_count
      site_count=$(psql -U "$db_name" -d "$db_name" -t -c "SELECT COUNT(*) FROM site_settings" 2>/dev/null | tr -d ' ') || site_count="?"
      homepage_count=$(psql -U "$db_name" -d "$db_name" -t -c "SELECT COUNT(*) FROM homepages" 2>/dev/null | tr -d ' ') || homepage_count="?"
      
      echo "│  site_settings: $site_count rows"
      echo "│  homepages: $homepage_count rows"
    else
      echo -e "${RED}✗ cannot connect${NC}"
    fi
  else
    echo "│  psql not found - skipping database check"
  fi
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Recent Errors
  echo "┌─ Recent Errors (last 5 per service) ────────────────────────────────┐"
  for name in cms web; do
    local logfile
    logfile=$(get_logfile "$name")
    if [[ -f "$logfile" ]]; then
      local errors
      errors=$(grep -i "error\|exception\|fatal" "$logfile" 2>/dev/null | tail -5)
      if [[ -n "$errors" ]]; then
        echo "│  ─── $name ───"
        echo "$errors" | head -5 | sed 's/^/│  /'
      fi
    fi
  done
  echo "└─────────────────────────────────────────────────────────────────────┘"
  echo ""
}

#─────────────────────────────────────────────────────────────────────────────
# Seed
#─────────────────────────────────────────────────────────────────────────────

seed() {
  echo ""
  log_step "Running CMS seeder..."
  
  # Check CMS is running
  if ! check_cms_health; then
    log_error "CMS is not running or not healthy"
    log_info "Start it first: ./manage.sh start cms"
    return 1
  fi
  
  cd "$CMS_DIR"
  
  # Find seeder script
  local seeder=""
  for f in "scripts/seed.ts" "scripts/seed.js" "seed.ts" "seed.js"; do
    if [[ -f "$f" ]]; then
      seeder="$f"
      break
    fi
  done
  
  if [[ -z "$seeder" ]]; then
    log_error "No seeder found in $CMS_DIR"
    log_info "Expected: scripts/seed.ts or scripts/seed.js"
    return 1
  fi
  
  log_info "Found seeder: $seeder"
  
  # Load env
  [[ -f .env ]] && { set -a; source .env; set +a; }
  [[ -f .env.local ]] && { set -a; source .env.local; set +a; }
  
  # Run seeder
  if [[ "$seeder" == *.ts ]]; then
    log_info "Running with ts-node..."
    npx ts-node "$seeder"
  else
    log_info "Running with node..."
    node "$seeder"
  fi
  
  local exit_code=$?
  
  if [[ $exit_code -eq 0 ]]; then
    log_info "Seeding completed ✓"
  else
    log_error "Seeding failed (exit code: $exit_code)"
    return 1
  fi
}

#─────────────────────────────────────────────────────────────────────────────
# Main
#─────────────────────────────────────────────────────────────────────────────

main() {
  local cmd="${1:-help}"
  local svc="${2:-all}"
  shift 2 2>/dev/null || shift $# 2>/dev/null || true
  
  case "$cmd" in
    #───────────────────────────────────────────────────────────────────────
    start)
      case "$svc" in
        cms) start_cms ;;
        web) start_web ;;
        all) start_all ;;
        *) log_error "Unknown service: $svc"; exit 1 ;;
      esac
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    stop)
      case "$svc" in
        cms) stop_cms ;;
        web) stop_web ;;
        all) stop_all ;;
        *) log_error "Unknown service: $svc"; exit 1 ;;
      esac
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    restart)
      case "$svc" in
        cms) restart_cms ;;
        web) restart_web ;;
        all) restart_all ;;
        *) log_error "Unknown service: $svc"; exit 1 ;;
      esac
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    clean)
      case "$svc" in
        cms) clean_cms ;;
        web) clean_web ;;
        all) clean_all ;;
        *) log_error "Unknown service: $svc"; exit 1 ;;
      esac
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    logs|log)
      case "$svc" in
        cms) logs_cms "$@" ;;
        web) logs_web "$@" ;;
        all)
          log_error "Specify service: cms or web"
          log_info "Example: ./manage.sh logs cms -f"
          exit 1
          ;;
        *) log_error "Unknown service: $svc"; exit 1 ;;
      esac
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    doctor)
      doctor
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    seed)
      seed
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    help|-h|--help|"")
      usage
      ;;
    
    #───────────────────────────────────────────────────────────────────────
    *)
      log_error "Unknown command: $cmd"
      echo ""
      usage
      exit 1
      ;;
  esac
}

# Run
main "$@"