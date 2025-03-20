import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { TextField, Box, CircularProgress, Button } from '@mui/material';
import axios from 'axios';
import { MoviesContext } from '../context/MoviesContext';
import './MovieList.css';

const defaultPoster = 'data:image/jpeg;base64,/9j/...'; // Default image if poster not available

const MovieList = () => {
  const { movies, setMovies } = useContext(MoviesContext);
  const currentYear = new Date().getFullYear();
  const storedQuery = sessionStorage.getItem('searchQuery');

  const [query, setQuery] = useState(storedQuery || '');
  const [searchTerm, setSearchTerm] = useState(storedQuery || String(currentYear));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [apiError, setApiError] = useState(false); // Tracks API error state

  const site = 'glodls'; // Default site for movie search

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    if (!hasMore || loading || page >= 10 || apiError) return; // Stop if conditions met

    setLoading(true);

    try {
      const response = await axios.get(
        `https://torrent-fast-api.onrender.com/api/v1/search?site=${site}&query=${searchTerm}&limit=0&page=${page}`
      );

      // Handle "Website Blocked" error
      if (response.data.error && response.data.error.includes("Website Blocked Change IP or Website Domain")) {
        console.error("Website Blocked. Changing IP or website domain is needed.");
        setHasMore(false);
        setApiError(true);
        return;
      }

      if (response.data.data.length > 0) {
        // Filter out invalid movie objects (only containing 'url')
        const filteredMovies = response.data.data.filter((movie) => {
          const keys = Object.keys(movie);
          return !(keys.length === 1 && keys.includes('url'));
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
      setApiError(true); // Stop further calls on error
    } finally {
      setLoading(false);
    }
  }, [site, searchTerm, page, hasMore, loading, setMovies, apiError]);

  // Handle search input and start new search
  const handleSearch = () => {
    sessionStorage.setItem('searchQuery', query || String(currentYear));
    setSearchTerm(query || String(currentYear));
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setApiError(false); // Reset error state on new search
  };

  // Trigger search on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fetch movies when component loads or searchTerm changes
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies, searchTerm]);

  return (
    <div className="movie-list-container">
      <h1 className="movie-list-header">Movie Menu</h1>

      {/* Search Input */}
      <Box className="filter-container">
        <TextField
          label="Search Query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputLabelProps={{ style: { color: 'black' } }}
          InputProps={{ style: { color: 'black', backgroundColor: 'white' } }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          style={{ backgroundColor: 'white', color: 'black' }}
        >
          Search
        </Button>
      </Box>

      {/* Movie Grid */}
      <div className="movie-grid">
        {movies.map((movie, index) => (
          <div key={index} className="movie-card">
            <Link to={`/movie/${index}`} className="movie-link">
              <img
                src={movie.poster || defaultPoster} // Use default poster if none available
                alt={movie.name}
                className="movie-poster"
              />
              <div className="movie-details">
                <h3 className="movie-title">{movie.name}</h3>
                <h3 className="movie-title">Seeders: {movie.seeders}</h3>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Loading Spinner */}
      {loading && (
        <Box className="loading-spinner">
          <CircularProgress />
        </Box>
      )}

      {/* No More Movies Message */}
      {!loading && !hasMore && !apiError && (
        <p className="no-more-movies">No more movies to load.</p>
      )}

      {/* Error Message */}
      {apiError && (
        <p className="error-message">Failed to fetch movies. Please try again later.</p>
      )}
    </div>
  );
};

export default MovieList;
