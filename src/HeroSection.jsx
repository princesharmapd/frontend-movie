import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Card, CardMedia, Typography } from "@mui/material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

const HeroSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMovie, setActiveMovie] = useState(null);
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://torrent-fast-api.onrender.com/api/v1/trending?site=yts&limit=0&page=1")
      .then((res) => res.json())
      .then((response) => {
        const moviesData = response.data || [];
        const filteredMovies = moviesData.filter(
          (movie) => movie.name && movie.poster && movie.rating
        );
        setMovies(filteredMovies);
        if (filteredMovies.length > 0) {
          setActiveMovie(filteredMovies[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    beforeChange: (oldIndex, newIndex) => {
      setActiveMovie(movies[newIndex]);
    },
  };

  return (
    <Box sx={{ maxWidth: "100vw", overflow: "hidden" }}>
      {loading ? (
        <CircularProgress
          size={50}
          sx={{
            color: "white",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ) : (
        <Slider {...settings} ref={sliderRef}>
          {movies.map((movie, index) => (
            <Box
              key={index}
              sx={{
                position: "relative",
                height: "80vh",
                overflow: "hidden",
                borderRadius: 10,
                marginTop: 5,
                maxWidth: "100vw",
              }}
            >
              <Card>
                <CardMedia
                  component="img"
                  image={movie.poster}
                  alt={movie.name}
                  sx={{ height: "80vh", objectFit: "cover" }}
                />
              </Card>
              <Box
                sx={{
                  position: "absolute",
                  bottom: 50,
                  left: 50,
                  color: "white",
                  width: "40%",
                }}
              >
                <Typography variant="h3" fontWeight="bold">
                  {movie.name}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2, fontSize: "12px" }}>
                  {movie.description}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Genres:</strong> {movie.genre.join(", ")}
                </Typography>
                <Typography variant="body2">
                  <strong>Runtime:</strong> {movie.runtime}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2, borderRadius: 10 }}
                  onClick={() => navigate(`/movie/${index}`, { state: { movie } })}
                >
                  Watch Now
                </Button>
              </Box>
            </Box>
          ))}
        </Slider>
      )}
    </Box>
  );
};

export default HeroSection;