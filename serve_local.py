#!/usr/bin/env python3
"""
Serve project root over HTTP. Normalizes accidental /index.html. (trailing dot), which
otherwise 404s with the stock server—the browser may request index.html. instead of index.html.

Usage: python3 serve_local.py [port]
"""
from __future__ import annotations

import http.server
import os
import socketserver
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))


class PatchedHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/index.html.":
            self.path = urllib.parse.urlunparse(parsed._replace(path="/index.html"))
        return super().do_GET()


def main() -> None:
    import sys

    port = 8766
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    with socketserver.TCPServer(("", port), PatchedHandler) as httpd:
        print(f"Serving {ROOT} at http://127.0.0.1:{port}/")
        print("Tip: use /index.html (no period after .html), or this server fixes /index.html.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
