import React, { useState, useEffect, useRef } from "react";
import { Card, CardMedia, CardContent, Typography, Box, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

const InfiniteScrollMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [firstPageLoaded, setFirstPageLoaded] = useState(false);
  const navigate = useNavigate();
  const observer = useRef();

  const currentYear = new Date().getFullYear();

  const fetchMovies = (currentPage) => {
    if (loading) return;
    setLoading(true);
    
    fetch(`https://torrent-fast-api.onrender.com/api/v1/search?site=yts&query=${currentYear}&limit=0&page=${currentPage}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.data || data.error) {  // Ensure 'data.data' exists
          setHasMore(false);
          setLoading(false);
          return;
        }
        
        const filteredMovies = data.data.filter(
          (movie) => movie.name && movie.poster && movie.rating
        );
  
        setMovies((prevMovies) => {
          const uniqueMovies = [...new Map([...prevMovies, ...filteredMovies].map(movie => [movie.url, movie])).values()];
          return uniqueMovies;
        });
  
        setFirstPageLoaded(true);
        setLoading(false);
        setHasMore(filteredMovies.length > 0);
      })
      .catch(() => {
        setLoading(false);
        setHasMore(false);
      });
  };
  

  const lastMovieElementRef = useRef();
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    const loadMoreMovies = (entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && firstPageLoaded) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          fetchMovies(nextPage);
          return nextPage;
        });
      }
    };

    if (lastMovieElementRef.current) {
      observer.current = new IntersectionObserver(loadMoreMovies, options);
      observer.current.observe(lastMovieElementRef.current);
    }

    return () => {
      if (observer.current && lastMovieElementRef.current) {
        observer.current.unobserve(lastMovieElementRef.current);
      }
    };
  }, [hasMore, loading, firstPageLoaded]);

  useEffect(() => {
    fetchMovies(1);
  }, []);

  return (
    <>
    <Box sx={{ mt: 3, ml: 2 }}>
    <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Latest Movies
      </Typography>
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 2,
        justifyContent: "center",
        alignItems: "start",
        width: "100%",
        margin: "auto",
      }}>
        {movies.map((movie, index) => (
          <Card
            key={index}
            sx={{
              cursor: "pointer",
              width: "160px",
              boxShadow: 3,
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
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {hasMore && <div ref={lastMovieElementRef} style={{ height: "20px", width: "100%" }} />}
      </Box>
    </>
      
  );
};

export default InfiniteScrollMovies;
