#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import threading
import time
import os

PORT = 8005

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache') 
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        print(f"Timeline page: http://localhost:{PORT}/timeline-version.html")
        print("Press Ctrl+C to stop the server")
        
        # Try to open browser automatically
        time.sleep(1)
        try:
            webbrowser.open(f'http://localhost:{PORT}/timeline-version.html')
        except:
            print("Could not open browser automatically")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")

if __name__ == "__main__":
    start_server()