import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText,
  Alert,
  Snackbar,
  Box
} from "@mui/material";
import axios from "axios";

const API_BASE_URL = "https://webtorrent-stream.onrender.com";

const MovieDetail = () => {
  const { state } = useLocation();
  const movie = state?.movie;
  const [fileList, setFileList] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const findTorrentIdentifier = () => {
    if (!movie) return null;
    
    if (movie.magnet) return movie.magnet;
    if (movie.torrent) return movie.torrent;
    
    if (movie.torrents?.length) {
      const withMagnet = movie.torrents.find(t => t.magnet);
      if (withMagnet) return withMagnet.magnet;
      
      const withTorrent = movie.torrents.find(t => t.torrent);
      if (withTorrent) return withTorrent.torrent;
    }
    
    return null;
  };

  const fetchFiles = async () => {
    setError(null);
    const torrentIdentifier = findTorrentIdentifier();
    
    if (!torrentIdentifier) {
      setError("No valid torrent source found");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/list-files/${encodeURIComponent(torrentIdentifier)}`,
        { timeout: 10000 }
      );
      setFileList(response.data);
    } catch (err) {
      console.error("Fetch files error:", err);
      setError(err.response?.data?.error || err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const startStream = async (filename) => {
    setError(null);
    const torrentIdentifier = findTorrentIdentifier();
    
    if (!torrentIdentifier) {
      setError("No valid torrent source found");
      return;
    }

    try {
      setLoading(true);
      
      // Check if backend is reachable
      try {
        await axios.get(`${API_BASE_URL}/health-check`, { timeout: 5000 });
      } catch (err) {
        throw new Error("Cannot connect to the streaming server");
      }

      // Check file format support
      const ext = filename.split('.').pop().toLowerCase();
      const supportedFormats = ['mp4', 'webm', 'ogg', 'mov', 'mkv'];
      if (!supportedFormats.includes(ext)) {
        throw new Error(`Unsupported video format: .${ext}. Try MP4 files for best compatibility.`);
      }

      const streamUrl = `${API_BASE_URL}/stream/${
        encodeURIComponent(torrentIdentifier)
      }/${
        encodeURIComponent(filename)
      }`;
      
      // Reset and start stream
      setVideoSrc(null);
      await new Promise(resolve => setTimeout(resolve, 100));
      setVideoSrc(streamUrl);

    } catch (err) {
      console.error("Stream setup error:", err);
      setError(err.message || "Failed to setup video stream");
      setLoading(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      let errorMessage = "Video playback failed";
      switch(video.error?.code) {
        case 1: errorMessage = "Video loading aborted"; break;
        case 2: errorMessage = "Network error"; break;
        case 3: errorMessage = "Video decoding failed - may be corrupt or unsupported format"; break;
        case 4: errorMessage = "Video format not supported by your browser"; break;
      }
      setError(errorMessage);
      setLoading(false);
    };

    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);

    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoSrc]);

  if (!movie) return <Typography variant="h4">Movie not found</Typography>;

  return (
    <Container sx={{ marginTop: 4 }}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            {movie.poster && !movie.poster.includes('no-cover') ? (
              <CardMedia 
                component="img" 
                image={movie.poster} 
                alt={movie.name}
                sx={{ maxHeight: 500 }}
              />
            ) : (
              <Box sx={{ 
                height: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5'
              }}>
                <Typography>No poster available</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>{movie.name}</Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            {movie.year || movie.date} | {movie.runtime || 'Unknown duration'}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {movie.description || "No description available."}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={fetchFiles}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Load Available Files"}
          </Button>
        </Grid>
      </Grid>

      {fileList.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Available Files</Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {fileList.map((file, index) => (
              <ListItem key={index} divider>
                <ListItemText 
                  primary={file.name} 
                  secondary={`${(file.length / (1024 * 1024)).toFixed(2)} MB • ${file.type.toUpperCase()}`} 
                />
                {file.type === "video" && (
                  <Button
                    variant="outlined"
                    onClick={() => startStream(file.name)}
                    disabled={loading}
                  >
                    Play
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {videoSrc && (
        <Box sx={{ mt: 4, position: 'relative' }}>
          <Typography variant="h5" gutterBottom>Now Playing</Typography>
          <Box sx={{
            position: 'relative',
            backgroundColor: '#000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300
          }}>
            {loading && (
              <CircularProgress 
                size={50} 
                sx={{ 
                  color: '#fff', 
                  position: 'absolute',
                  zIndex: 1
                }} 
              />
            )}
            <video
              ref={videoRef}
              controls
              style={{
                width: '100%',
                maxHeight: '70vh',
                opacity: loading ? 0.5 : 1
              }}
              crossOrigin="anonymous"
            >
              <source src={videoSrc} type={`video/${videoSrc.split('.').pop().toLowerCase()}`} />
              Your browser does not support HTML5 video.
            </video>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default MovieDetail;