#!/usr/bin/env python3
"""Serve the AFTERGLOW demo to the local network only (private/loopback client IPs)."""
import functools, ipaddress, os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8070"))
ROOT = os.path.dirname(os.path.abspath(__file__))
ALLOWED = {"/", "/index.html", "/core.js", "/world.js", "/audio.js", "/crt.js", "/dialogue.js", "/lore.js", "/game.js"}
LAN_NETS = [ipaddress.ip_network(n) for n in (
    "127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "169.254.0.0/16",
    "::1/128", "fc00::/7", "fe80::/10")]

class LanOnly(SimpleHTTPRequestHandler):
    def _allowed_client(self):
        ip = ipaddress.ip_address(self.client_address[0])
        if getattr(ip, "ipv4_mapped", None):
            ip = ip.ipv4_mapped
        return any(ip in n for n in LAN_NETS)

    def do_GET(self):
        if not self._allowed_client():
            self.send_error(403, "LAN only"); return
        if self.path.split("?")[0] not in ALLOWED:
            self.send_error(404); return
        super().do_GET()

    def do_HEAD(self):
        self.do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

if __name__ == "__main__":
    handler = functools.partial(LanOnly, directory=ROOT)
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), handler)
    print(f"AFTERGLOW on http://0.0.0.0:{PORT} (LAN only)", flush=True)
    srv.serve_forever()
