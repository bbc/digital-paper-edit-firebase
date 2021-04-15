#!/usr/bin/env python
import SimpleHTTPServer, SocketServer
class MyHttpRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/status':
            self.send_response(200)
        else:
            return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)
# Create an object of the above class
handler_object = MyHttpRequestHandler
PORT = 8080
my_server = SocketServer.TCPServer(("", PORT), handler_object)
# Start the server
print("serving at port", PORT)
my_server.serve_forever()


