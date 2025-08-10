import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import MapView from './MapView';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/track/:rkey" element={<MapView />} />
    </Routes>
  );
}

export default App;
