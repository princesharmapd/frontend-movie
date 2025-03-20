import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MovieList from './MovieList';
import MovieDetail from './MovieDetail';
import { MoviesProvider } from '../context/MoviesContext';


const HomePiratebay = () => {
  return (
    <MoviesProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MovieList />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
        </Routes>
      </Router>
    </MoviesProvider>
  );
};

export default HomePiratebay;