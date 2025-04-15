// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VideoChat from './components/VideoChat';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Study Together
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/call">Call</Button>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<div style={{ padding: 20 }}>Welcome to the Study Platform</div>} />
        <Route path="/call" element={<VideoChat roomId="studyRoom" />} />
      </Routes>
    </Router>
  );
}

export default App;
