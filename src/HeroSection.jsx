import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Box, Button, CircularProgress, Card, CardMedia } from "@mui/material";
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
    fetch("https://movies-backend-kql9bihp3-prince-sharmas-projects-0b2d6a4a.vercel.app/movies/trending")
      .then((res) => res.json())
      .then((data) => {
        const filteredMovies = data.filter(movie => movie.name && movie.poster && movie.rating);
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
    autoplay: true,       // Enable autoplay
    autoplaySpeed: 3000,  // Set to 3 seconds
    beforeChange: (oldIndex, newIndex) => {
      setActiveMovie(movies[newIndex]);
    },
  };
  

  return (
    <>
      {loading ? (
        <CircularProgress size={50} sx={{ color: "white", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
      ) : (
        <Slider {...settings} ref={sliderRef}>
          {movies.map((movie, index) => (
            <Box key={index} sx={{ position: "relative", height: "80vh", overflow: "hidden",borderRadius: 10,marginTop: 5 }}>
              <Card>
                <CardMedia component="img" image={movie.poster} alt={movie.name} sx={{ height: "80vh", objectFit: "cover" }} />
              </Card>
              <Box sx={{ position: "absolute", bottom: 50, left: 50, color: "white", width: "40%" }}>
                <Typography variant="h3" fontWeight="bold">{movie.name}</Typography>
                <Typography variant="h6" sx={{ mt: 2,fontSize:"12px" }}>{movie.description}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Genres:</strong> {movie.genre.join(", ")}</Typography>
                <Typography variant="body2"><strong>Runtime:</strong> {movie.runtime}</Typography>
                <Button variant="contained" color="primary" sx={{ mt: 2,borderRadius:10 }} onClick={() => navigate(`/movie/${index}`, { state: { movie } })}>
                  Watch Now
                </Button>
              </Box>
            </Box>
          ))}
        </Slider>
      )}
    </>
  );
};

export default HeroSection;
