import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CircularProgress,
  MenuItem,
  Select,
} from "@mui/material";

const MovieDetail = () => {
  const { state } = useLocation();
  const movie = state?.movie;
  const [videoFiles, setVideoFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  console.log("Movie Data:", movie);

  const findMagnetLink = (movieData) => {
    if (!movieData) return null;
    if (movieData.magnet) return movieData.magnet;
    if (movieData.torrents && Array.isArray(movieData.torrents)) {
      for (const torrent of movieData.torrents) {
        if (torrent.magnet) return torrent.magnet;
      }
    }
    for (const key in movieData) {
      if (typeof movieData[key] === "object") {
        const magnet = findMagnetLink(movieData[key]);
        if (magnet) return magnet;
      }
    }
    return null;
  };

  const findTorrentUrl = (movieData) => {
    if (!movieData) return null;
    if (movieData.torrent) return movieData.torrent;
    if (movieData.torrents && Array.isArray(movieData.torrents)) {
      for (const torrent of movieData.torrents) {
        if (torrent.url && torrent.url.endsWith('.torrent')) return torrent.url;
        if (torrent.torrent) return torrent.torrent;
      }
    }
    return null;
  };

  const fetchVideoFiles = async () => {
    // First try to find magnet link
    const magnetLink = findMagnetLink(movie);
    // If no magnet link, look for torrent URL
    const torrentUrl = findTorrentUrl(movie);
    
    if (!magnetLink && !torrentUrl) {
      console.warn("No magnet link or torrent URL found for this movie.");
      return;
    }
    
    try {
      // Use magnet link if available, otherwise use torrent URL
      const torrentIdentifier = magnetLink || torrentUrl;
      const response = await fetch(
        `https://webtorrent-stream.onrender.com/list-files/${encodeURIComponent(torrentIdentifier)}`
      );
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setVideoFiles(data);
      if (data.length > 0) setSelectedFile(data[0].name);
    } catch (error) {
      console.error("Error fetching video files:", error);
    }
  };

  useEffect(() => {
    fetchVideoFiles();
  }, [movie]);

  const startStream = () => {
    if (!selectedFile) {
      alert("Please select a video file to stream.");
      return;
    }
    
    // First try to find magnet link
    const magnetLink = findMagnetLink(movie);
    // If no magnet link, look for torrent URL
    const torrentUrl = findTorrentUrl(movie);
    
    if (!magnetLink && !torrentUrl) {
      alert("No valid magnet link or torrent URL found.");
      return;
    }
    
    // Use magnet link if available, otherwise use torrent URL
    const torrentIdentifier = magnetLink || torrentUrl;
    setVideoSrc(
      `https://webtorrent-stream.onrender.com/stream/${encodeURIComponent(torrentIdentifier)}/${encodeURIComponent(selectedFile)}`
    );
    setLoading(true);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    video.addEventListener("playing", () => setLoading(false));
    return () => video.removeEventListener("playing", () => setLoading(false));
  }, [videoSrc]);

  if (!movie) return <Typography variant="h4">Movie not found</Typography>;

  const hasValidPoster =
    movie.poster && movie.poster !== "https://l.t0r.site/no-cover.png";

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
          
          {videoFiles.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Typography variant="body2"><strong>Select Video File:</strong></Typography>
              <Select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                sx={{ width: "100%", marginTop: 1 }}
              >
                {videoFiles.map((file) => (
                  <MenuItem key={file.name} value={file.name}>
                    {file.name} ({(file.length / (1024 * 1024)).toFixed(2)} MB)
                  </MenuItem>
                ))}
              </Select>
            </div>
          )}

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={startStream}
            disabled={!videoFiles.length}
          >
            {videoFiles.length ? "Stream Movie" : "No Video Files Found"}
          </Button>
        </Grid>
      </Grid>

      {videoSrc && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Typography variant="h5">Now Playing</Typography>
          {loading && <CircularProgress sx={{ margin: 2 }} />}
          <video 
            ref={videoRef} 
            controls 
            width="100%" 
            src={videoSrc}
            style={{ maxHeight: '70vh' }}
            onError={(e) => {
              console.error("Video error:", e);
              alert("Error loading video. Please try again.");
              setLoading(false);
            }}
          />
        </div>
      )}
    </Container>
  );
};

export default MovieDetail;