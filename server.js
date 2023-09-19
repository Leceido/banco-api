const http = require('http')
const app = require('./app')
const PORT = process.env.PORT? Number(process.env.PORT): 5000
const HOST = "0.0.0.0"
const server = http.createServer(app)

server.listen(PORT, HOST, () => {
    console.log('Server running!');
})