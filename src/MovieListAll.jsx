import React, { useState } from "react";
import { Card, CardMedia, CardContent, Typography, Box, TextField, Pagination, CircularProgress, Container, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const MovieListAll = () => {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchMovies = (currentPage) => {
    if (!query.trim()) return; // Prevent empty search calls
  
    setLoading(true);
    
    fetch(`https://torrent-fast-api.onrender.com/api/v1/search?site=yts&query=${query}&limit=0&page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.data || !Array.isArray(data.data)) { // Fix: Accessing `data.data`
          setMovies([]);
          setLoading(false);
          return;
        }
  
        const formattedMovies = data.data.map((movie) => ({  // Fix: Use `data.data`
          name: movie.name,
          poster: movie.poster,
          rating: movie.rating,
          url: movie.url,
          description: movie.description,
          date: movie.date,
          genre: movie.genre,
          runtime: movie.runtime,
          screenshot: movie.screenshot,
          torrents: movie.torrents,
        }));
  
        setMovies(formattedMovies);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  

  const handleSearch = () => {
    setPage(1);
    fetchMovies(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchMovies(value);
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", marginBottom: 2,marginTop: 7 }}>
        {/* Search Input */}
        <TextField
          label="Search Movies"
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "200px",
              height: "50px",
            },
            "& .MuiInputBase-input": {
              padding: "10px",
            },
          }}
        />
        {/* Search Button */}
        <Button variant="contained" color="primary" onClick={handleSearch} sx={{ height: "45px", borderRadius: "8px" }}>
          Search
        </Button>
      </Box>

      {/* Movie List */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {loading
          ? [...Array(7)].map((_, index) => (
              <Card key={index} sx={{ width: "160px", height: "250px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <CircularProgress />
              </Card>
            ))
          : movies.map((movie, index) => (
              <Card
                key={index}
                sx={{
                  cursor: "pointer",
                  width: "160px",
                  boxShadow: 3,
                  flex: "0 0 auto",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
                onClick={() => navigate(`/movie/${index}`, { state: { movie } })}
              >
                <CardMedia component="img" height="180" image={movie.poster} alt={movie.name} sx={{ objectFit: "cover" }} />
                <CardContent sx={{ textAlign: "center", padding: "8px" }}>
                  <Typography variant="subtitle2" noWrap>
                    {movie.name}
                  </Typography>
                  <Typography color="textSecondary" fontSize="0.8rem">
                    ⭐ {movie.rating}
                  </Typography>
                </CardContent>
              </Card>
            ))}
      </Box>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <Pagination count={10} page={page} onChange={handlePageChange} color="primary" />
      </Box>
    </>
  );
};

export default MovieListAll;
