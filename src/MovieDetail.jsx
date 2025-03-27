import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CircularProgress, 
  MenuItem,
  Select
} from "@mui/material";
import axios from "axios";

const MovieDetail = () => {
  const { state } = useLocation();
  const movie = state?.movie;
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [spinnerColor, setSpinnerColor] = useState("white");
  const videoRef = useRef(null);

  const getMagnetLinkByQuality = (quality) => {
    if (!movie?.torrents) return null;
    const selectedTorrent = movie.torrents.find(t => t.quality === quality);
    return selectedTorrent?.magnet || null;
  };

  const startStream = (quality) => {
    const torrentIdentifier = getMagnetLinkByQuality(quality);
    if (!torrentIdentifier) {
      alert("No valid torrent source found for selected quality");
      return;
    }
    
    setVideoSrc(
      `https://webtorrent-stream.onrender.com/stream/${encodeURIComponent(torrentIdentifier)}`
    );
    setLoading(true);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const analyzeBrightness = () => {
      if (!video || !ctx || video.readyState < 2) return;
      canvas.width = video.videoWidth / 10;
      canvas.height = video.videoHeight / 10;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let pixels = imageData.data;
      let brightnessSum = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        let brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        brightnessSum += brightness;
      }

      let avgBrightness = brightnessSum / (pixels.length / 4);
      setSpinnerColor(avgBrightness > 128 ? "black" : "white");
    };

    const playHandler = () => {
      setLoading(false);
      analyzeBrightness();
      const interval = setInterval(analyzeBrightness, 5000);
      return () => clearInterval(interval);
    };

    video.addEventListener("playing", playHandler);
    video.addEventListener("loadeddata", analyzeBrightness);

    return () => {
      video.removeEventListener("playing", playHandler);
      video.removeEventListener("loadeddata", analyzeBrightness);
    };
  }, [videoSrc]);

  if (!movie) return <Typography variant="h4">Movie not found</Typography>;

  return (
    <Container sx={{ marginTop: 7 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia component="img" image={movie.poster} alt={movie.name} />
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h4">{movie.name}</Typography>
          <Typography variant="h6" color="textSecondary">{movie.date}</Typography>
          <Typography variant="body1" sx={{ marginTop: 2 }}>{movie.description}</Typography>
          
          {movie.torrents && (
            <Select
              value={selectedQuality}
              onChange={(e) => {
                setSelectedQuality(e.target.value);
                startStream(e.target.value);
              }}
              displayEmpty
              sx={{ marginTop: 2, minWidth: 200 }}
            >
              <MenuItem value="" disabled>Select Quality</MenuItem>
              {movie.torrents.map((torrent, index) => (
                <MenuItem key={index} value={torrent.quality}>{torrent.quality} ({torrent.size})</MenuItem>
              ))}
            </Select>
          )}
        </Grid>
      </Grid>

      {videoSrc && (
        <div style={{ marginTop: 20, position: "relative", textAlign: "center" }}>
          <Typography variant="h5">Now Playing</Typography>

          {loading && (
            <CircularProgress 
              size={50} 
              sx={{ 
                color: spinnerColor, 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)",
                zIndex: 1
              }} 
            />
          )}

          <video 
            ref={videoRef} 
            controls 
            width="100%" 
            src={videoSrc}
            style={{ maxHeight: "70vh" }}
            onError={(e) => {
              console.error("Video error:", e);
              alert("Error loading video. Please try again.");
              setLoading(false);
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </Container>
  );
};

export default MovieDetail;
