import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { TextField, Box, CircularProgress, Button } from '@mui/material';
import axios from 'axios';
import { MoviesContext } from '../context/MoviesContext';
import './MovieList.css';

const defaultPoster = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...'; // Default image if poster not available

const MovieList = () => {
  const { movies, setMovies } = useContext(MoviesContext);
  const currentYear = new Date().getFullYear();
  const storedQuery = sessionStorage.getItem('searchQuery');
  const [query, setQuery] = useState(storedQuery || '');
  const [searchTerm, setSearchTerm] = useState(storedQuery || String(currentYear));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const site = 'piratebay'; // Ensuring the site is set to 'piratebay'

  const fetchMovies = useCallback(async () => {
    if (!hasMore || loading || page >= 10) return; // Stop if page >= 10
    setLoading(true);

    try {
      const response = await axios.get(
        `https://torrent-fast-api.onrender.com/api/v1/search?site=${site}&query=${searchTerm}&limit=0&page=${page}`
      );

      // Handle blocked site error
      if (response.data.error?.includes("Website Blocked Change IP or Website Domain")) {
        console.error("Website Blocked. Consider changing the IP or website domain.");
        setHasMore(false);
        return;
      }

      if (response.data.data.length > 0) {
        const filteredMovies = response.data.data.filter((movie) => {
          const keys = Object.keys(movie);
          return (
            !(keys.length === 1 && keys.includes('url')) && // Exclude if only "url" exists
            movie.seeders !== "0" && movie.seeders !== 0    // Exclude movies with seeders = 0
          );
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
    sessionStorage.setItem('searchQuery', query || String(currentYear));
    setSearchTerm(query || String(currentYear));
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
    fetchMovies(); // Auto-fetch on mount and searchTerm change
  }, [fetchMovies, searchTerm]);

  return (
    <div className="movie-list-container">
      <h1 className="movie-list-header">Movie Menu (PirateBay)</h1>
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
              <img
                src={movie.poster || defaultPoster}
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
