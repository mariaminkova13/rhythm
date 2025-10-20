#!/usr/bin/env python3
"""
Simple HTTP server for local development.
Serves files from the current directory to avoid CORS issues with ES6 modules.

Usage:
    python server.py [port]

Default port is 8000 if not specified.
Press Ctrl+C to stop the server.
"""

import http.server
import socketserver
import sys
import os

# Get port from command line argument, default to 8000
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# Change to the directory where this script is located
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Custom handler that sets UTF-8 encoding
class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith('.html') or self.path == '/':
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        super().end_headers()

# Create the server
Handler = UTF8Handler

print(f"Starting server on http://localhost:{PORT}")
print(f"Serving files from: {os.getcwd()}")
print("Press Ctrl+C to stop the server\n")

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server is running at http://localhost:{PORT}")
        print(f"Open this URL in your browser to view your game\n")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n\nServer stopped.")
    sys.exit(0)
except OSError as e:
    if e.errno == 98 or e.errno == 10048:  # Address already in use
        print(f"\nError: Port {PORT} is already in use.")
        print(f"Try a different port: python server.py 8001")
    else:
        print(f"\nError: {e}")
    sys.exit(1)

# python -m http.server 8000
# Then visit http://localhost:8000
# python server.py