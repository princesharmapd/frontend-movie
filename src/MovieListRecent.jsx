import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, Box, CircularProgress, Skeleton } from "@mui/material";

const MovieListRecent = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    fetch("https://torrent-fast-api.onrender.com/api/v1/recent?site=yts&limit=0&page=1")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          const filteredMovies = data.data.filter(movie => movie.name && movie.poster && movie.rating);
          setMovies(filteredMovies);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleWheelScroll = (e) => {
      e.preventDefault();
      slider.scrollLeft += e.deltaY * 2;
    };

    slider.addEventListener("wheel", handleWheelScroll, { passive: false });
    return () => slider.removeEventListener("wheel", handleWheelScroll);
  }, []);

  return (
    <>
    <Box sx={{ mt: 3, ml: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Recent Movies
      </Typography>

      <Box
        ref={sliderRef}
        sx={{
          display: "flex",
          gap: 2,
          cursor: "grab",
          overflowX: "auto",
          userSelect: "none",
          paddingBottom: "10px",
          '& > *': {
            flex: '0 0 auto',
            width: { xs: '45%', sm: '160px' },
          },
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
      >
        {loading
          ? [...Array(7)].map((_, index) => (
              <Card key={index} sx={{ height: "250px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxShadow: 3 }}>
                <Box sx={{ position: "relative", width: "100%", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Skeleton variant="rectangular" width="100%" height="100%" />
                  <CircularProgress sx={{ position: "absolute" }} />
                </Box>
                <CardContent sx={{ textAlign: "center", padding: "8px", width: "100%" }}>
                  <Skeleton width="80%" height={20} />
                  <Skeleton width="50%" height={15} />
                </CardContent>
              </Card>
            ))
          : movies.map((movie, index) => (
              <Card
                key={index}
                sx={{ cursor: "pointer", boxShadow: 3, transition: "transform 0.2s", "&:hover": { transform: "scale(1.05)" } }}
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
      </Box>
    </>
  );
};

export default MovieListRecent;
