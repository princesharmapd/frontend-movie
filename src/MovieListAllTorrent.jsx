import React, { useState, useEffect } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Container,
  Skeleton,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const MovieListAllTorrent = () => {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");  // Stores user input for search
  const [searchQuery, setSearchQuery] = useState("movies"); // Stores final query for API call
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchMovies = async (currentPage, searchQuery) => {
    if (loading) return;
    setLoading(true);
  
    try {
      const queryParam = searchQuery ? `query=${encodeURIComponent(searchQuery)}` : "";
      const response = await fetch(
        `https://torrent-fast-api.onrender.com/api/v1/all/search?query=${queryParam}&limit=0&page=${currentPage}`
      );
      const responseData = await response.json(); 
      
      if (!responseData.data || !Array.isArray(responseData.data)) {
        throw new Error("Invalid data format received");
      }
      
      const filteredMovies = responseData.data.filter(movie => !movie.url.includes("https://libgen.is"));
      
      const allMovies = filteredMovies.map(movie => ({
        ...movie,
        poster: movie.poster && movie.poster.includes("no-cover")
          ? "/fallback-poster.jpg"
          : movie.poster || "/fallback-poster.jpg"
      }));
      setMovies(prevMovies => (currentPage === 1 ? allMovies : [...prevMovies, ...allMovies]));
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch movies when the component mounts and when page/searchQuery changes
  useEffect(() => {
    fetchMovies(page, searchQuery);
  }, [page, searchQuery]);

  // Handle infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100
      ) {
        setPage(prevPage => prevPage + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle search button click
  const handleSearch = () => {
    setMovies([]);  // Clear previous results
    setPage(1);  // Reset pagination
    setSearchQuery(query.trim());  // Trim search query to avoid unnecessary spaces
  };

  return (
   <>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Search Movies"
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
        {loading && movies.length === 0 ? (
          [...Array(6)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" width={160} height={250} sx={{ borderRadius: 2 }} />
          ))
        ) : (
          movies.map((movie, index) => (
            <Card
              key={index}
              sx={{
                width: "200px",
                boxShadow: 3,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": { transform: "scale(1.05)" }
              }}
              onClick={() => navigate(`/moviesalltorrent/${index}`, { state: { movie } })}
            >
              <CardMedia component="img" height="250" image={movie.poster} alt={movie.name} sx={{ objectFit: "cover" }} />
              <CardContent>
                <Typography variant="subtitle2" noWrap>{movie.name}</Typography>
                {movie.rating && <Typography color="textSecondary" fontSize="0.8rem">⭐ {movie.rating}</Typography>}
                {movie.seeders && movie.leechers && (
                  <Typography color="textSecondary" fontSize="0.8rem">
                    Seeders: {movie.seeders} | Leechers: {movie.leechers}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {loading && movies.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </>
  );
};

export default MovieListAllTorrent;
