// Node.js built in http module
import http from 'http'

// the port the server will listen on
const port = 4002;


// Create a server. This callback runs whenever a request arrives
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-Type': 'text/plain' });
    res.end('Server is running!');
});

// handle server errors such as the port already being in use
server.on('error', (error) => {
    console.error('Server error: ', error.message);
});
 
// start listening 
server.listen(port, () => {
    console.log(`Server is runing natively on http://localhost:${port}`);
})