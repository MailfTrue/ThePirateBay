from http.server import HTTPServer, SimpleHTTPRequestHandler


if __name__ == '__main__':
    server = HTTPServer(('', 8000), SimpleHTTPRequestHandler)
    print('Run server on 127.0.0.1:8000')
    server.serve_forever()
