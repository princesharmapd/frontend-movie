import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText 
} from "@mui/material";
import axios from "axios";

const MovieDetail = () => {
  const { state } = useLocation();
  const movie = state?.movie;
  const [fileList, setFileList] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinnerColor, setSpinnerColor] = useState("white");
  const videoRef = useRef(null);

  const findTorrentIdentifier = () => {
    // First try to find magnet link
    const findMagnet = (data) => {
      if (!data) return null;
      if (data.magnet) return data.magnet;
      if (data.torrents && Array.isArray(data.torrents)) {
        for (const torrent of data.torrents) {
          if (torrent.magnet) return torrent.magnet;
        }
      }
      return null;
    };

    // Then look for torrent URL
    const findTorrentUrl = (data) => {
      if (!data) return null;
      if (data.torrent) return data.torrent;
      if (data.torrents && Array.isArray(data.torrents)) {
        for (const torrent of data.torrents) {
          if (torrent.url && torrent.url.endsWith('.torrent')) return torrent.url;
          if (torrent.torrent) return torrent.torrent;
        }
      }
      return null;
    };

    const magnet = findMagnet(movie);
    if (magnet) return magnet;

    const torrentUrl = findTorrentUrl(movie);
    if (torrentUrl) return torrentUrl;

    return null;
  };

  const fetchFiles = async () => {
    const torrentIdentifier = findTorrentIdentifier();
    if (!torrentIdentifier) {
      console.warn("No magnet link or torrent URL found");
      return;
    }

    try {
      const response = await axios.get(
        `https://webtorrent-stream.onrender.com/list-files/${encodeURIComponent(torrentIdentifier)}`
      );
      setFileList(response.data);
    } catch (error) {
      console.error("Error fetching file list:", error);
    }
  };

  const startStream = (filename) => {
    const torrentIdentifier = findTorrentIdentifier();
    if (!torrentIdentifier) {
      alert("No valid torrent source found");
      return;
    }

    setVideoSrc(
      `https://webtorrent-stream.onrender.com/stream/${encodeURIComponent(torrentIdentifier)}/${encodeURIComponent(filename)}`
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

  const hasValidPoster = movie.poster && movie.poster !== "https://l.t0r.site/no-cover.png";

  return (
    <Container sx={{ marginTop: 7 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            {hasValidPoster ? (
              <CardMedia component="img" image={movie.poster} alt={movie.name} />
            ) : movie.screenshot && movie.screenshot.length > 0 ? (
              <Grid container spacing={1} sx={{ padding: 1 }}>
                {movie.screenshot.slice(0, 4).map((screenshot, index) => (
                  <Grid item xs={6} key={index}>
                    <img
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      style={{ width: "100%", borderRadius: "5px" }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <CardMedia
                component="img"
                image="https://via.placeholder.com/300"
                alt="No Cover Available"
              />
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h4">{movie.name}</Typography>
          <Typography variant="h6" color="textSecondary">{movie.date}</Typography>
          <Typography variant="body1" sx={{ marginTop: 2 }}>
            {movie.description || "No description available."}
          </Typography>
          
          {movie.genre && (
            <Typography variant="body2" sx={{ marginTop: 2 }}>
              <strong>Genres:</strong> {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}
            </Typography>
          )}
          
          {movie.runtime && (
            <Typography variant="body2">
              <strong>Runtime:</strong> {movie.runtime}
            </Typography>
          )}

          {movie.screenshot && movie.screenshot.length > 0 && (
            <Grid container spacing={1} sx={{ marginTop: 2 }}>
              {movie.screenshot.slice(0, 4).map((screenshot, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <img
                    src={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    style={{ width: "100%", borderRadius: "5px" }}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Button 
            variant="contained" 
            color="primary" 
            sx={{ marginTop: 2 }}
            onClick={fetchFiles}
          >
            Load Available Files
          </Button>
        </Grid>
      </Grid>

      {fileList.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Typography variant="h5">Available Files</Typography>
          <List>
            {fileList.map((file, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={file.name} 
                  secondary={`${(file.length / (1024 * 1024)).toFixed(2)} MB`} 
                />
                {file.type === "video" && (
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => startStream(file.name)}
                  >
                    Play
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </div>
      )}

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
