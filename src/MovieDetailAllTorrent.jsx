import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  List, 
  ListItem, 
  ListItemText,
  Snackbar,
  Alert,
  Box,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  IconButton,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress
} from "@mui/material";
import { Info, PlayArrow, Download, Close, Delete } from '@mui/icons-material';

// IndexedDB setup
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoStreamDB', 1);
    request.onerror = (event) => reject('Database error: ' + event.target.errorCode);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
    };
  });
};

const storeVideoChunk = async (videoId, chunk, chunkIndex) => {
  const db = await openDB();
  const transaction = db.transaction(['videos'], 'readwrite');
  const store = transaction.objectStore('videos');
  return new Promise((resolve, reject) => {
    const request = store.get(videoId);
    request.onsuccess = (event) => {
      const data = event.target.result || { id: videoId, chunks: [], metadata: {} };
      data.chunks[chunkIndex] = chunk;
      const putRequest = store.put(data);
      putRequest.onsuccess = resolve;
      putRequest.onerror = reject;
    };
    request.onerror = reject;
  });
};

const getVideoChunks = async (videoId) => {
  const db = await openDB();
  const transaction = db.transaction(['videos'], 'readonly');
  const store = transaction.objectStore('videos');
  return new Promise((resolve, reject) => {
    const request = store.get(videoId);
    request.onsuccess = (event) => resolve(event.target.result?.chunks || []);
    request.onerror = reject;
  });
};

const deleteVideoFromDB = async (videoId) => {
  const db = await openDB();
  const transaction = db.transaction(['videos'], 'readwrite');
  const store = transaction.objectStore('videos');
  return new Promise((resolve, reject) => {
    const request = store.delete(videoId);
    request.onsuccess = resolve;
    request.onerror = reject;
  });
};

const MovieDetailmain = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const movie = state?.movie;
  const videoRef = useRef(null);
  const activeReaderRef = useRef(null); // Track active reader for cleanup
  
  const [fileList, setFileList] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState({
    fetch: false,
    download: false,
    play: false
  });
  const [videoUrl, setVideoUrl] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [canPlay, setCanPlay] = useState(false);

  // Clean up resources when component unmounts or when switching files
  useEffect(() => {
    return () => {
      // Clean up active reader if exists
      if (activeReaderRef.current) {
        activeReaderRef.current.cancel().catch(() => {});
      }
      // Clean up video URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Automatically fetch files when component mounts
  useEffect(() => {
    if (!movie) {
      navigate('/');
    } else {
      fetchFiles();
    }
  }, [movie, navigate]);

  const fetchFiles = async () => {
    const torrentIdentifier = movie?.magnet || movie?.torrent;
    if (!torrentIdentifier) {
      showSnackbar("No torrent source available", "error");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, fetch: true }));
      const response = await fetch(
        `http://localhost:5000/list-files/${encodeURIComponent(torrentIdentifier)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setFileList(data.filter(file => file.type === 'video'));
    } catch (error) {
      showSnackbar(`Failed to fetch files: ${error.message}`, "error");
      console.error('Fetch files error:', error);
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  const handleDownload = async (filename) => {
    const torrentIdentifier = movie?.magnet || movie?.torrent;
    if (!torrentIdentifier) {
      showSnackbar("No torrent source available", "error");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, download: true }));
      showSnackbar("Starting download...", "info");
      
      const a = document.createElement('a');
      a.href = `http://localhost:5000/download/${encodeURIComponent(torrentIdentifier)}/${encodeURIComponent(filename)}`;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showSnackbar("Download started to your Downloads folder", "success");
    } catch (error) {
      showSnackbar(`Download failed: ${error.message}`, "error");
      console.error('Download error:', error);
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  const handlePlay = async (filename) => {
    const videoId = `${movie.id}-${filename}`;
    
    // Clean up any existing playback first
    await cleanupCurrentPlayback();
    
    setActiveVideoId(videoId);
    setCanPlay(false);
    
    try {
      setLoading(prev => ({ ...prev, play: true }));
      
      // Check if we already have chunks in IndexedDB
      const existingChunks = await getVideoChunks(videoId);
      if (existingChunks.length > 0) {
        const totalSize = existingChunks.reduce((sum, chunk) => sum + (chunk?.byteLength || 0), 0);
        const firstChunkSize = existingChunks[0]?.byteLength || 0;
        
        if (firstChunkSize > 0 && totalSize > firstChunkSize * 0.05) {
          const blob = new Blob(existingChunks.filter(Boolean), { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setActiveTab(1);
          showSnackbar(`Resuming playback of ${filename}`, "success");
          setCanPlay(true);
          return;
        }
      }
      
      const torrentIdentifier = movie?.magnet || movie?.torrent;
      if (!torrentIdentifier) {
        throw new Error("No torrent source available");
      }
      
      showSnackbar(`Starting to stream ${filename}`, "info");
      
      const response = await fetch(
        `http://localhost:5000/download/${encodeURIComponent(torrentIdentifier)}/${encodeURIComponent(filename)}`,
        { headers: { 'Range': 'bytes=0-' } }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body.getReader();
      activeReaderRef.current = reader; // Store the active reader
      
      const chunks = [];
      let receivedLength = 0;
      const contentLength = parseInt(response.headers.get('Content-Length') || 0);
      
      setDownloadProgress(prev => ({
        ...prev,
        [videoId]: { received: 0, total: contentLength }
      }));
      
      // First phase: get at least 5% buffered
      while (receivedLength < contentLength * 0.05) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        const chunkIndex = chunks.length - 1;
        await storeVideoChunk(videoId, value, chunkIndex);
        
        setDownloadProgress(prev => ({
          ...prev,
          [videoId]: { received: receivedLength, total: contentLength }
        }));
      }
      
      if (receivedLength >= contentLength * 0.05  ) {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setActiveTab(1);
        setCanPlay(true);
      } else {
        showSnackbar("Failed to buffer enough data", "error");
        setLoading(prev => ({ ...prev, play: false }));
        return;
      }
      
      // Second phase: continue buffering in the background
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        const chunkIndex = chunks.length - 1;
        await storeVideoChunk(videoId, value, chunkIndex);
        
        setDownloadProgress(prev => ({
          ...prev,
          [videoId]: { received: receivedLength, total: contentLength }
        }));
      }
      
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      showSnackbar(`Now playing ${filename}`, "success");
      
    } catch (error) {
      showSnackbar(`Playback failed: ${error.message}`, "error");
      console.error('Play error:', error);
    } finally {
      setLoading(prev => ({ ...prev, play: false }));
    }
  };

  const cleanupCurrentPlayback = async () => {
    // Cancel any active reader
    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel();
      } catch (error) {
        console.error('Error cancelling reader:', error);
      }
      activeReaderRef.current = null;
    }
    
    // Clean up video URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    
    // Reset playback state
    setCanPlay(false);
  };

  const handleDeleteTempFile = async () => {
    if (!activeVideoId) return;
    
    try {
      await deleteVideoFromDB(activeVideoId);
      await cleanupCurrentPlayback();
      setActiveVideoId(null);
      showSnackbar("Temporary video deleted", "success");
    } catch (error) {
      showSnackbar("Failed to delete temporary video", "error");
      console.error('Delete error:', error);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!movie) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4">No movie selected</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, paddingTop: 4 }}>
      {/* Movie Header Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              image={movie.poster || "https://via.placeholder.com/300"}
              alt={movie.name}
              sx={{ borderRadius: 1 }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <Typography variant="h3" component="h1">{movie.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {movie.date} • {movie.runtime}
            </Typography>
            <Typography variant="body1" paragraph>
              {movie.description || "No description available."}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* Files and Player Section */}
      {fileList.length > 0 ? (
        <Paper sx={{ mt: 4, p: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="File List" icon={<Download />} />
            <Tab label="Video Player" icon={<PlayArrow />} disabled={!videoUrl} />
          </Tabs>
          
          <Box sx={{ pt: 2 }}>
            {activeTab === 0 && (
              <List>
                {fileList.map((file, index) => {
                  const fileSizeMB = (file.length / (1024 * 1024)).toFixed(2);
                  const videoId = `${movie.id}-${file.name}`;
                  const progress = downloadProgress[videoId] || { received: 0, total: 1 };

                  return (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handlePlay(file.name)}
                            disabled={loading.play}
                            startIcon={loading.play ? <CircularProgress size={20} /> : <PlayArrow />}
                          >
                            {loading.play ? "Loading..." : "Play"}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleDownload(file.name)}
                            disabled={loading.download}
                            startIcon={loading.download ? <CircularProgress size={20} /> : <Download />}
                          >
                            {loading.download ? "Downloading..." : "Download"}
                          </Button>
                        </Stack>
                      }
                    >
                      <ListItemText 
                        primary={file.name} 
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {fileSizeMB} MB
                              {progress.received > 0 && (
                                <span> ({Math.round((progress.received / progress.total) * 100)}% buffered)</span>
                              )}
                            </Typography>
                            {progress.received > 0 && (
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min((progress.received / progress.total) * 100, 100)} 
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Box>
                        } 
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}

            {activeTab === 1 && videoUrl && (
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  backgroundColor: '#000',
                  borderRadius: 1,
                  overflow: 'hidden',
                  minHeight: '400px'
                }}>
                  // In your video element:
<video
  ref={videoRef}
  controls
  autoPlay={canPlay}
  style={{ width: '100%', maxHeight: '70vh' }}
  src={videoUrl}
  onCanPlay={() => {
    if (videoRef.current && canPlay) {
      videoRef.current.play().catch(e => {
        console.error('Autoplay prevented:', e);
        showSnackbar('Click the play button to start', 'info');
      });
    }
  }}
  onWaiting={() => showSnackbar('Buffering more data...', 'info')}
  onPlaying={() => showSnackbar('Playback started', 'success')}
  onError={(e) => {
    const video = e.target;
    let errorMessage = "Video playback failed";
    
    // Check the video error state
    switch(video.error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        errorMessage = "Video loading was aborted";
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        errorMessage = "Network error occurred";
        break;
      case MediaError.MEDIA_ERR_DECODE:
        errorMessage = "Video decoding failed - may be corrupt or unsupported format";
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = "Video format not supported by your browser";
        break;
      default:
        errorMessage = "Unknown video playback error";
    }
    
    console.error('Video error details:', {
      errorCode: video.error.code,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src
    });
    
    showSnackbar(errorMessage, 'error');
  }}
/>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteTempFile}
                  >
                    Delete Temporary File
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={fetchFiles}
            disabled={loading.fetch}
            startIcon={loading.fetch ? <CircularProgress size={20} /> : <Info />}
          >
            {loading.fetch ? "Loading Files..." : "Show Available Files"}
          </Button>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MovieDetailmain;