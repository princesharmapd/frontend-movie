import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Typography, Button, Grid, Card, CardMedia, CardContent, CircularProgress, List, ListItem, ListItemText } from "@mui/material";
import axios from "axios";

const MovieDetail = () => {
  const { state } = useLocation();
  const movie = state.movie;
  const [fileList, setFileList] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinnerColor, setSpinnerColor] = useState("white");
  const videoRef = useRef(null);

  const fetchFiles = async (magnet) => {
    try {
      const response = await axios.get(`https://movies-backend-ruddy.vercel.app/list-files/${encodeURIComponent(magnet)}`);
      setFileList(response.data);
    } catch (error) {
      console.error("Error fetching file list:", error);
    }
  };

  const startStream = (magnet, filename) => {
    setVideoSrc(`https://movies-backend-ruddy.vercel.app/stream/${encodeURIComponent(magnet)}/${encodeURIComponent(filename)}`);
    setLoading(true);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const analyzeBrightness = () => {
      if (!video || !ctx) return;
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

    video.addEventListener("playing", () => {
      setLoading(false);
      analyzeBrightness();
      setInterval(analyzeBrightness, 5000);
    });

    return () => clearInterval(analyzeBrightness);
  }, [videoSrc]);

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
          <Typography variant="body2" sx={{ marginTop: 2 }}>
            <strong>Genres:</strong> {movie.genre.join(", ")}
          </Typography>
          <Typography variant="body2">
            <strong>Runtime:</strong> {movie.runtime}
          </Typography>
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
          {movie.torrents?.map((torrent) => (
            <Button 
              key={torrent.hash} 
              variant="contained" 
              color="primary" 
              sx={{ marginTop: 2, marginRight: 1 }}
              onClick={() => fetchFiles(torrent.magnet)}
            >
              Load Files ({torrent.quality})
            </Button>
          ))}
        </Grid>
      </Grid>

      {fileList.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Typography variant="h5">Available Files</Typography>
          <List>
            {fileList.map((file, index) => (
              <ListItem key={index}>
                <ListItemText primary={file.name} />
                {file.type === "video" && (
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => startStream(movie.torrents[0].magnet, file.name)}
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
              sx={{ color: spinnerColor, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} 
            />
          )}

          <video 
            ref={videoRef} 
            controls 
            width="100%" 
            src={videoSrc} 
            onLoadedData={() => setLoading(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </Container>
  );
};

export default MovieDetail;
