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
    
    request.onerror = (event) => {
      reject('Database error: ' + event.target.errorCode);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
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
      
      // Store the chunk
      data.chunks[chunkIndex] = chunk;
      
      // Update the store
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
    
    request.onsuccess = (event) => {
      resolve(event.target.result?.chunks || []);
    };
    
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

const MovieDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const movie = state?.movie;
  const videoRef = useRef(null);
  
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
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [openScreenshot, setOpenScreenshot] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [canPlay, setCanPlay] = useState(false);

  // Check for existing downloads on component mount
  useEffect(() => {
    if (!movie) {
      navigate('/');
    } else if (movie?.torrents?.length) {
      setSelectedQuality(movie.torrents[0]);
    }
  }, [movie, navigate]);

  const findTorrentIdentifier = (torrent) => {
    return torrent?.magnet || torrent?.torrent;
  };

  const fetchFiles = async () => {
    if (!selectedQuality) {
      showSnackbar("Please select a quality first", "error");
      return;
    }

    const torrentIdentifier = findTorrentIdentifier(selectedQuality);
    if (!torrentIdentifier) {
      showSnackbar("No torrent source available", "error");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, fetch: true }));
      const response = await fetch(
        `https://webtorrent-stream.onrender.com/list-files/${encodeURIComponent(torrentIdentifier)}`
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
    const torrentIdentifier = findTorrentIdentifier(selectedQuality);
    if (!torrentIdentifier) {
      showSnackbar("No torrent source available", "error");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, download: true }));
      showSnackbar("Starting download...", "info");
      
      // Create download link
      const a = document.createElement('a');
      a.href = `https://webtorrent-stream.onrender.com/download/${encodeURIComponent(torrentIdentifier)}/${encodeURIComponent(filename)}`;
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
    setActiveVideoId(videoId);
    setCanPlay(false);
    
    try {
      setLoading(prev => ({ ...prev, play: true }));
      
      // Check if we already have chunks in IndexedDB
      const existingChunks = await getVideoChunks(videoId);
      if (existingChunks.length > 0) {
        // Calculate how much we have buffered
        const totalSize = existingChunks.reduce((sum, chunk) => sum + (chunk?.byteLength || 0), 0);
        const firstChunkSize = existingChunks[0]?.byteLength || 0;
        
        // We need at least 5% buffered to start playing
        if (firstChunkSize > 0 && totalSize > firstChunkSize * 0.05) {
          const blob = new Blob(existingChunks.filter(Boolean), { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setActiveTab(1);
          showSnackbar(`Resuming playback of ${filename}`, "success");
          setCanPlay(true);
        } else {
          showSnackbar(`Not enough data buffered (${Math.round((totalSize / firstChunkSize) * 100)}%)`, "warning");
          setLoading(prev => ({ ...prev, play: false }));
          return;
        }
      }
      
      // Start streaming the file
      const torrentIdentifier = findTorrentIdentifier(selectedQuality);
      if (!torrentIdentifier) {
        throw new Error("No torrent source available");
      }
      
      showSnackbar(`Starting to stream ${filename}`, "info");
      
      // Create a new stream
      const response = await fetch(
        `https://webtorrent-stream.onrender.com/download/${encodeURIComponent(torrentIdentifier)}/${encodeURIComponent(filename)}`,
        { headers: { 'Range': 'bytes=0-' } }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;
      const contentLength = parseInt(response.headers.get('Content-Length') || 0);
      
      // Update progress
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
        
        // Store the chunk in IndexedDB
        const chunkIndex = chunks.length - 1;
        await storeVideoChunk(videoId, value, chunkIndex);
        
        // Update progress
        setDownloadProgress(prev => ({
          ...prev,
          [videoId]: { received: receivedLength, total: contentLength }
        }));
      }
      
      // If we have at least 5% buffered, create a blob URL
      if (receivedLength >= contentLength * 0.05) {
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
      
      // Final blob with all chunks
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

  const handleDeleteTempFile = async () => {
    if (!activeVideoId) return;
    
    try {
      await deleteVideoFromDB(activeVideoId);
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(null);
      setActiveVideoId(null);
      setCanPlay(false);
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

  const handleOpenScreenshot = (url) => {
    setOpenScreenshot(url);
  };

  const handleCloseScreenshot = () => {
    setOpenScreenshot(null);
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4,paddingTop: 4 }}>
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

          {movie.screenshot?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Screenshots</Typography>
              <Grid container spacing={1}>
                {movie.screenshot.map((screenshot, index) => (
                  <Grid item xs={4} key={index}>
                    <Card 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleOpenScreenshot(screenshot)}
                    >
                      <CardMedia
                        component="img"
                        image={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        height="100"
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <Typography variant="h3" component="h1">{movie.name}</Typography>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" color="text.secondary">
                {movie.date} • {movie.runtime}
              </Typography>
              {movie.rating && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Rating 
                    value={parseFloat(movie.rating) / 2} 
                    precision={0.1} 
                    readOnly 
                    size="small"
                  />
                  <Typography variant="body2">{movie.rating}/10</Typography>
                </Stack>
              )}
            </Stack>

            {movie.genre?.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {movie.genre.map((genre, index) => (
                  <Chip 
                    key={index} 
                    label={genre.trim()} 
                    size="small" 
                    variant="outlined" 
                  />
                ))}
              </Stack>
            )}

            <Typography variant="body1" paragraph>
              {movie.description || "No description available."}
            </Typography>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>Available Qualities</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                {movie.torrents?.map((torrent, index) => (
                  <Button
                    key={index}
                    variant={selectedQuality?.hash === torrent.hash ? "contained" : "outlined"}
                    onClick={() => setSelectedQuality(torrent)}
                    startIcon={<PlayArrow />}
                  >
                    {torrent.quality} ({torrent.size})
                  </Button>
                ))}
              </Stack>
            </Box>

            {selectedQuality && (
              <Button 
                variant="contained" 
                size="large"
                onClick={fetchFiles}
                disabled={loading.fetch}
                startIcon={loading.fetch ? <CircularProgress size={20} /> : <Info />}
                sx={{ alignSelf: 'flex-start' }}
              >
                {loading.fetch ? "Loading..." : "Show Files"}
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Files and Player Section */}
      {fileList.length > 0 && (
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
                  <video
                    ref={videoRef}
                    controls
                    autoPlay={canPlay}
                    style={{ width: '100%', maxHeight: '70vh' }}
                    src={videoUrl}
                    onCanPlay={() => {
                      // Ensure we have enough buffered before playing
                      if (videoRef.current && canPlay) {
                        videoRef.current.play().catch(e => {
                          console.error('Autoplay prevented:', e);
                          showSnackbar('Click the play button to start', 'info');
                        });
                      }
                    }}
                    onWaiting={() => {
                      showSnackbar('Buffering more data...', 'info');
                    }}
                    onPlaying={() => {
                      showSnackbar('Playback started', 'success');
                    }}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      showSnackbar('Error playing video', 'error');
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
      )}

      {/* Screenshot Dialog */}
      <Dialog
        open={Boolean(openScreenshot)}
        onClose={handleCloseScreenshot}
        maxWidth="md"
      >
        <DialogTitle>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseScreenshot}
            aria-label="close"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <img 
            src={openScreenshot} 
            alt="Screenshot" 
            style={{ width: '100%', height: 'auto' }} 
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x281?text=Image+not+available';
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MovieDetail;
