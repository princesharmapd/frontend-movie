import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { TextField, Box, CircularProgress, Button } from '@mui/material';
import axios from 'axios';
import { MoviesContext } from '../context/MoviesContext';
import './MovieList.css';

const MovieList = () => {
  const { movies, setMovies } = useContext(MoviesContext);
  const currentYear = new Date().getFullYear();
  const storedQuery = sessionStorage.getItem('searchQuery');
  const [query, setQuery] = useState(storedQuery || ''); // Search field is empty initially
  const [searchTerm, setSearchTerm] = useState(storedQuery || String(currentYear)); // Uses current year in the background
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const site = 'yts'; // Default site set to 'yts'

  const fetchMovies = useCallback(async () => {
    if (!hasMore || loading) return;
  
    setLoading(true);
  
    try {
      const response = await axios.get(
        `https://torrent-fast-api.onrender.com/api/v1/search?site=${site}&query=${searchTerm}&limit=50&page=${page}`
      );
  
      // Handle "Result not found." error immediately
      if (response.data.error === "Result not found.") {
        setHasMore(false);
        return;
      }
  
      if (response.data.data.length > 0) {
        // Filter out objects that contain only a URL
        const filteredMovies = response.data.data.filter((movie) => {
          const keys = Object.keys(movie);
          return !(keys.length === 1 && keys.includes("url"));
        });
  
        if (filteredMovies.length > 0) {
          setMovies((prevMovies) => {
            const movieSet = new Set(prevMovies.map((m) => m.id || m.name));
            const newMovies = filteredMovies.filter((movie) => !movieSet.has(movie.id || movie.name));
            return [...prevMovies, ...newMovies];
          });
  
          setPage((prevPage) => prevPage + 1);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [site, searchTerm, page, hasMore, loading, setMovies]);
  
  

  const handleSearch = () => {
    sessionStorage.setItem('searchQuery', query || String(currentYear)); // Store the query (or default to current year)
    setSearchTerm(query || String(currentYear)); // Update the actual search term
    setMovies([]);
    setPage(1);
    setHasMore(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    fetchMovies(); // Auto-fetch movies on page load/reload
  }, [fetchMovies, searchTerm]); // Fetch movies whenever searchTerm changes

  return (
    <div className="movie-list-container">
      <h1 className="movie-list-header">Movie Menu</h1>
      <Box className="filter-container">
        <TextField
          label="Search Query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputLabelProps={{ style: { color: 'black' } }}
          InputProps={{ style: { color: 'black', backgroundColor: 'white' } }}
        />
        <Button variant="contained" onClick={handleSearch} style={{ backgroundColor: 'white', color: 'black' }}>
          Search
        </Button>
      </Box>
      <div className="movie-grid">
        {movies.map((movie, index) => (
          <div key={index} className="movie-card">
            <Link to={`/movie/${index}`} className="movie-link">
              <img src={movie.poster} alt={movie.name} className="movie-poster" />
              <div className="movie-details">
                <h3 className="movie-title">{movie.name}</h3>
                <p className="movie-rating">Rating: {movie.rating}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
      {loading && (
        <Box className="loading-spinner">
          <CircularProgress />
        </Box>
      )}
      {!hasMore && <p className="no-more-movies">No more movies to load.</p>}
    </div>
  );
};

export default MovieList;