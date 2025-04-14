const express = require('express');
const http = require('http');  
const socketIo = require('socket.io');
const path = require('path'); 

const app = express();
const server = http.createServer({
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
}, app);
const io = socketIo(server, {
  cors: {
      origin: '*'
  }
});

// Serve React static files from build
app.use(express.static(path.join(__dirname, 'build')));

// Fallback to index.html for SPA routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// --- WebRTC + socket logic ---
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    const clients = io.sockets.adapter.rooms.get(roomId) || new Set();
    const clientsArray = [...clients].filter(id => id !== socket.id);

    socket.emit('allUsers', clientsArray);
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit('newUser', socket.id);
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socket.broadcast.emit('userLeft', socket.id);
  });
});

const PORT = process.env.PORT || 25575;
server.listen(PORT, () => {
  console.log('Ready!');
  console.log(`Server running on port ${PORT}`);
});
