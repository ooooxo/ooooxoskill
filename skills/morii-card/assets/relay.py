import sys, json, threading, queue, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(sys.argv[1]); CARD = sys.argv[2]
state = {"phase": "pending"}
lock = threading.Lock()
clients = []                      # list[queue.Queue]
clients_lock = threading.Lock()
MARK = re.compile(r'(<script id="state"[^>]*>)(.*?)(</script>)', re.S)

def write_through(snap):
    try:
        with open(CARD, "r", encoding="utf-8") as f: html = f.read()
        html = MARK.sub(lambda m: m.group(1) + snap + m.group(3), html, count=1)
        with open(CARD, "w", encoding="utf-8") as f: f.write(html)
    except Exception: pass

def merge(patch):
    with lock:
        for k in ("phase","title","sections","outcome","note","headline","progress"):
            if k in patch: state[k] = patch[k]
        if "units" in patch: state["units"] = patch["units"]
        if "unit" in patch:
            u = patch["unit"]; arr = state.setdefault("units", [])
            for i, x in enumerate(arr):
                if x.get("id") == u.get("id"): arr[i] = {**x, **u}; break
            else: arr.append(u)
        if "metrics" in patch: state["metrics"] = patch["metrics"]
        if "metric" in patch:
            mt = patch["metric"]; arr = state.setdefault("metrics", [])
            for i, x in enumerate(arr):
                if x.get("label") == mt.get("label"): arr[i] = {**x, **mt}; break
            else: arr.append(mt)
        snap = json.dumps(state, ensure_ascii=False)
    write_through(snap)
    with clients_lock:
        for q in list(clients): q.put(snap)
    return snap

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _cors(self): self.send_header("Access-Control-Allow-Origin", "*")
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/events":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache"); self._cors(); self.end_headers()
            q = queue.Queue()
            with clients_lock: clients.append(q)
            with lock: snap = json.dumps(state, ensure_ascii=False)
            try:
                self.wfile.write(f"data: {snap}\n\n".encode()); self.wfile.flush()
                while True:
                    try: msg = q.get(timeout=15)
                    except queue.Empty:
                        self.wfile.write(b": ping\n\n"); self.wfile.flush(); continue
                    self.wfile.write(f"data: {msg}\n\n".encode()); self.wfile.flush()
            except Exception: pass
            finally:
                with clients_lock:
                    if q in clients: clients.remove(q)
            return
        if path in ("/", "/" + CARD.replace("\\", "/").split("/")[-1]):
            try:
                with open(CARD, "rb") as f: body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8"); self._cors(); self.end_headers()
                self.wfile.write(body)
            except Exception:
                self.send_response(404); self.end_headers()
            return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        if urlparse(self.path).path == "/push":
            n = int(self.headers.get("Content-Length", 0) or 0)
            try: patch = json.loads(self.rfile.read(n) or b"{}")
            except Exception: patch = {}
            merge(patch)
            self.send_response(204); self._cors(); self.end_headers()
            return
        self.send_response(404); self.end_headers()

ThreadingHTTPServer.daemon_threads = True
srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
print(f"SERVE_OK :{PORT}", flush=True)
srv.serve_forever()
