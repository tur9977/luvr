import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Button from '@mui/material/Button';        // 引入 Material-UI 按鈕
import HomeIcon from '@mui/icons-material/Home'; // 引入 Material-UI 圖標
import './App.css';                              // 保留原有的 CSS

const Home = () => (
  <div className="App">
    <header className="App-header">
      <p>歡迎來到首頁</p>
    </header>
  </div>
);

const About = () => (
  <div className="App">
    <header className="App-header">
      <p>關於我們</p>
    </header>
  </div>
);

function App() {
  return (
    <Router>
      <div>
        <nav>
          <Button variant="contained" color="primary" startIcon={<HomeIcon />}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>首頁</Link>
          </Button>
          <Button variant="contained" color="secondary" style={{ marginLeft: '10px' }}>
            <Link to="/about" style={{ color: 'white', textDecoration: 'none' }}>關於</Link>
          </Button>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;