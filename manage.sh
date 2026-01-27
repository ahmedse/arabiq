#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
CMS_DIR="$ROOT_DIR/apps/cms"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$RUN_DIR" "$LOG_DIR"

usage() {
  cat <<'EOF'
Usage:
  ./manage.sh <command> [service] [args]

Commands:
  doctor              Check toolchain + paths
  dev [service]       Start in dev mode (background)
  start [service]     Start in prod mode (background)
  stop [service]      Stop running service(s)
  restart [service]   Restart service(s)
  status [service]    Show status + PID + last log lines
  logs [service]      Tail logs
  clean [service]     Remove build + temp files
  clean-hard [service] Also remove node_modules

Services:
  web                 Next.js website (port 3000)
  cms                 Strapi CMS (port 1337)
  all                 Both services (default)

Examples:
  ./manage.sh dev              # Start both web + cms
  ./manage.sh dev web          # Start only web
  ./manage.sh stop cms         # Stop only cms
  ./manage.sh logs web --tail 60
  ./manage.sh logs cms --follow

Notes:
  - Uses pidfiles under .run/ and logs under .logs/
  - Set env in apps/{web,cms}/.env.local or .env
EOF
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    return 1
  }
}

# Helper: find a PID listening on a TCP port (returns pid or empty)
find_pid_by_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"${port}" 2>/dev/null || true
  elif command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v P=$port '$4 ~ ":"P"$" { sub(/.*pid=/,"",$0); sub(/,.*$/,"",$0); print $0 }' | awk -F"pid=" '{print $2}' | awk -F"," '{print $1}' || true
  else
    echo "" # cannot determine
  fi
}

# Kill a PID gently and escalate to SIGKILL if necessary
kill_pid_graceful() {
  local pid="$1"
  if [[ -z "$pid" ]]; then return; fi
  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "Stopping process pid=$pid..."
    kill "$pid" >/dev/null 2>&1 || true
    for _ in {1..10}; do
      sleep 0.2
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        echo "Process $pid stopped"
        return 0
      fi
    done
    echo "Process $pid did not stop, sending SIGKILL"
    kill -9 "$pid" >/dev/null 2>&1 || true
  fi
}

# If port is busy, try to identify and kill the process listening on it
kill_port_if_busy() {
  local port="$1"
  local pid
  pid="$(find_pid_by_port "$port")"
  if [[ -n "$pid" ]]; then
    echo "Port $port is in use by pid=$pid - killing it"
    kill_pid_graceful "$pid"
    return 0
  fi
  return 1
}

# Pidfile helpers
web_pidfile() { echo "$RUN_DIR/web.pid"; }
cms_pidfile() { echo "$RUN_DIR/cms.pid"; }
web_logfile() { echo "$LOG_DIR/web.log"; }
cms_logfile() { echo "$LOG_DIR/cms.log"; }

is_running_pid() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

read_pidfile() {
  local pidfile="$1"
  if [[ -f "$pidfile" ]]; then
    cat "$pidfile" 2>/dev/null || true
  fi
}

# Generic stop
stop_service() {
  local name="$1"
  local pidfile="$2"
  local pid
  pid="$(read_pidfile "$pidfile")"

  if [[ -z "$pid" ]]; then
    echo "$name: not running (no pidfile)"
    return 0
  fi

  if ! is_running_pid "$pid"; then
    echo "$name: not running (stale pidfile pid=$pid); cleaning"
    rm -f "$pidfile"
    return 0
  fi

  echo "Stopping $name (pid=$pid)…"
  kill "$pid" || true

  for _ in {1..20}; do
    if ! is_running_pid "$pid"; then
      rm -f "$pidfile"
      echo "$name: stopped"
      return 0
    fi
    sleep 0.2
  done

  echo "$name: did not stop gracefully; sending SIGKILL" >&2
  kill -9 "$pid" || true
  rm -f "$pidfile"
}

# Generic start
start_service() {
  local name="$1"
  local dir="$2"
  local mode="$3"  # dev|prod
  local pidfile="$4"
  local logfile="$5"
  local cmd="$6"

  if [[ ! -d "$dir" ]]; then
    echo "$name directory not found: $dir" >&2
    return 1
  fi

  # determine default port for common services
  local port=""
  case "$name" in
    web) port="3000" ;;
    cms) port="1337" ;;
  esac

  # if port busy, forcibly free it
  if [[ -n "$port" ]]; then
    if pid="$(find_pid_by_port "$port")" && [[ -n "$pid" ]]; then
      echo "Port $port appears busy (pid=$pid) — freeing it before starting $name."
      kill_pid_graceful "$pid"
      sleep 0.3
    fi
  fi

  local pid
  pid="$(read_pidfile "$pidfile")"
  if [[ -n "$pid" ]] && is_running_pid "$pid"; then
    echo "$name: already running (pid=$pid)"
    return 0
  fi

  echo "Starting $name ($mode) in background…"

  (
    cd "$dir"
    # Load env files if present
    for envfile in .env.local .env; do
      if [[ -f "$envfile" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "$envfile"
        set +a
      fi
    done
    # start the process
    nohup bash -c "export PATH=\"$PATH:/home/ahmed/.nvm/versions/node/v20.19.6/bin\"; $cmd" >>"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )

  echo "$name: started (pid=$(read_pidfile "$pidfile"))"
  echo "logs: $logfile"
  # show last 200 lines for quick feedback
  if [[ -f "$logfile" ]]; then
    echo "--- last 200 log lines for $name ---"
    tail -n 200 "$logfile" || true
  fi
}

# Service-specific wrappers
# Wait for the CMS to become healthy (polls /admin/init). Returns 0 if healthy, 1 if timeout
wait_for_cms() {
  local timeout_secs="${1:-6}"
  local start_ts
  start_ts=$(date +%s)

  echo "Waiting for CMS to become healthy (timeout ${timeout_secs}s)..."
  while true; do
    if curl -s http://127.0.0.1:1337/admin/init >/dev/null 2>&1; then
      echo "cms: healthy"
      return 0
    fi
    if (( $(date +%s) - start_ts >= timeout_secs )); then
      echo "cms: did not become healthy after ${timeout_secs}s" >&2
      return 1
    fi
    sleep 1
  done
}

start_web() {
  local mode="$1"
  local cmd
  if [[ "$mode" == "dev" ]]; then
    cmd="/home/ahmed/.nvm/versions/node/v20.19.6/bin/pnpm dev --port 3000"
  else
    cmd="/home/ahmed/.nvm/versions/node/v20.19.6/bin/pnpm build && PORT=3000 /home/ahmed/.nvm/versions/node/v20.19.6/bin/pnpm start"
  fi

  # Optionally wait for CMS before starting web. Default: true when starting both services together.
  if [[ "${WAIT_FOR_CMS:-true}" == "true" ]]; then
    # Wait up to 6s for CMS (non-fatal: we still start web if CMS doesn't come up)
    if wait_for_cms 6; then
      echo "Proceeding to start web after CMS healthy"
    else
      echo "Warning: CMS did not become healthy; starting web anyway"
    fi
  fi

  start_service "web" "$WEB_DIR" "$mode" "$(web_pidfile)" "$(web_logfile)" "$cmd"
}

start_cms() {
  local mode="$1"
  local cmd
  if [[ "$mode" == "dev" ]]; then
    cmd="./build.sh && npm run develop"
  else
    cmd="npm run build && npm run start"
  fi
  start_service "cms" "$CMS_DIR" "$mode" "$(cms_pidfile)" "$(cms_logfile)" "$cmd"
}

stop_web() { stop_service "web" "$(web_pidfile)"; }
stop_cms() { stop_service "cms" "$(cms_pidfile)"; }

# Status
status_service() {
  local name="$1"
  local pidfile="$2"
  local logfile="$3"
  local pid
  pid="$(read_pidfile "$pidfile")"

  if [[ -z "$pid" ]]; then
    echo "$name: not running"
    return 0
  fi

  if is_running_pid "$pid"; then
    echo "$name: running (pid=$pid)"
  else
    echo "$name: not running (stale pidfile pid=$pid); cleaning"
    rm -f "$pidfile" || true
    return 0
  fi

  if [[ -f "$logfile" ]]; then
    echo "--- last 15 log lines ---"
    tail -n 15 "$logfile" || true
  fi
}

status_web() { status_service "web" "$(web_pidfile)" "$(web_logfile)"; }
status_cms() { status_service "cms" "$(cms_pidfile)" "$(cms_logfile)"; }

# Logs
logs_service() {
  local logfile="$1"
  shift
  local n="200"
  local follow="false"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -n|--tail)
        n="${2:-$n}"
        shift 2
        ;;
      -f|--follow)
        follow="true"
        shift
        ;;
      *)
        if [[ "$1" =~ ^[0-9]+$ ]]; then
          n="$1"
        fi
        shift
        ;;
    esac
  done

  if [[ ! -f "$logfile" ]]; then
    echo "No log file yet: $logfile"
    return 0
  fi

  if [[ "$follow" == "true" ]]; then
    tail -n "$n" -f "$logfile"
  else
    tail -n "$n" "$logfile"
  fi
}

logs_web() { logs_service "$(web_logfile)" "$@"; }
logs_cms() { logs_service "$(cms_logfile)" "$@"; }

# Clean
clean_service() {
  local name="$1"
  local dir="$2"
  local pidfile="$3"
  local logfile="$4"
  echo "Cleaning $name artifacts…"
  if [[ "$name" == "web" ]]; then
    rm -rf "$dir/.next" || true
  elif [[ "$name" == "cms" ]]; then
    rm -rf "$dir/.strapi" "$dir/.tmp" "$dir/dist" "$dir/database" || true
  fi
  rm -f "$pidfile" "$logfile" || true
}

clean_web() { clean_service "web" "$WEB_DIR" "$(web_pidfile)" "$(web_logfile)"; }
clean_cms() { clean_service "cms" "$CMS_DIR" "$(cms_pidfile)" "$(cms_logfile)"; }

clean_hard_service() {
  local name="$1"
  local dir="$2"
  local pidfile="$3"
  local logfile="$4"
  clean_service "$name" "$dir" "$pidfile" "$logfile"
  echo "Removing $name node_modules…"
  rm -rf "$dir/node_modules" || true
}

clean_hard_web() { clean_hard_service "web" "$WEB_DIR" "$(web_pidfile)" "$(web_logfile)"; }
clean_hard_cms() { clean_hard_service "cms" "$CMS_DIR" "$(cms_pidfile)" "$(cms_logfile)"; }

# Doctor
doctor() {
  echo "ROOT_DIR=$ROOT_DIR"
  echo "WEB_DIR=$WEB_DIR"
  echo "CMS_DIR=$CMS_DIR"

  need_cmd node
  need_cmd pnpm
  need_cmd npm

  if [[ -d "$WEB_DIR" ]]; then
    echo "web: OK"
  else
    echo "web: MISSING" >&2
  fi

  if [[ -d "$CMS_DIR" ]]; then
    echo "cms: OK"
  else
    echo "cms: MISSING" >&2
  fi

  echo "node: $(node --version)"
  echo "pnpm: $(pnpm --version)"
  echo "npm: $(npm --version)"
}

# Main command router
cmd="${1:-}"
service="${2:-all}"
shift || true
shift || true

case "$cmd" in
  ""|"help"|"-h"|"--help")
    usage
    ;;
  doctor)
    doctor
    ;;
  dev|start)
    mode="$([[ "$cmd" == "dev" ]] && echo "dev" || echo "prod")"
    case "$service" in
      web) start_web "$mode" ;;
      cms) start_cms "$mode" ;;
      all|"") start_cms "$mode"; start_web "$mode" ;;
      *) echo "Unknown service: $service" >&2; exit 1 ;;
    esac
    ;;
  stop)
    case "$service" in
      web) stop_web ;;
      cms) stop_cms ;;
      all|"") stop_web; stop_cms ;;
      *) echo "Unknown service: $service" >&2; exit 1 ;;
    esac
    ;;
  restart)
    mode="${1:-dev}"
    case "$service" in
      web) stop_web; start_web "$mode" ;;
      cms) stop_cms; start_cms "$mode" ;;
      all|"") stop_web; stop_cms; start_cms "$mode"; if wait_for_cms 6; then start_web "$mode"; else start_web "$mode"; fi ;;
      *) echo "Unknown service: $service" >&2; exit 1 ;;
    esac
    ;;
  status)
    case "$service" in
      web) status_web ;;
      cms) status_cms ;;
      all|"") status_web; echo "---"; status_cms ;;
      *) echo "Unknown service: $service" >&2; exit 1 ;;
    esac
    ;;
  log|logs)
    case "$service" in
      web) logs_web "$@" ;;
      cms) logs_cms "$@" ;;
      *) echo "Specify service: web or cms" >&2; exit 1 ;;
    esac
    ;;
  clean)
    case "$service" in
      web) clean_web ;;
      cms) clean_cms ;;
      all|"") clean_web; clean_cms ;;
      *) echo "Unknown service: $service" >&2; exit 1 ;;
    esac
    ;;
  clean-hard)
    case "$service" in
      web) clean_hard_web ;;
      cms) clean_hard_cms ;;
      all|"") clean_hard_web; clean_hard_cms ;;
      *) echo "Unknown service: $service" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage
    exit 1
    ;;
esac
