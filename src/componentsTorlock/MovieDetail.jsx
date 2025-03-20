import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  Chip,
} from '@mui/material';
import { MoviesContext } from '../context/MoviesContext';

const MovieDetailpirets = () => {
  const { id } = useParams();
  const { movies } = useContext(MoviesContext);
  const movie = movies[id];

  const [videoFiles, setVideoFiles] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (movie) {
      // Fetch video files from backend
      fetch(`https://movies-backend-ruddy.vercel.app/list-files/${encodeURIComponent(movie.magnet)}`)
        .then((res) => res.json())
        .then((files) => {
          const videos = files.filter((file) => file.type === 'video');
          setVideoFiles(videos);
          if (videos.length > 0) setSelectedVideo(videos[0].name);
        })
        .catch((err) => console.error('Error fetching files:', err));
    }
  }, [movie]);

  if (!movie) {
    return (
      <Typography variant="h4" color="error" align="center" sx={{ mt: 3 }}>
        Movie not found
      </Typography>
    );
  }

  // Open screenshot dialog
  const handleOpen = (image) => {
    setSelectedImage(image);
    setOpen(true);
  };

  // Close screenshot dialog
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Movie Poster and Details */}
      <Grid container spacing={3}>
        {/* Poster */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
            <CardMedia
              component="img"
              height="500"
              image={movie.poster}
              alt={movie.name}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        {/* Movie Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, p: 3 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                {movie.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label={`Release: ${movie.date}`} color="primary" />
                <Chip label={`Size: ${movie.size}`} color="secondary" />
                <Chip label={`Seeders: ${movie.seeders}`} />
                <Chip label={`Leechers: ${movie.leechers}`} />
              </Box>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
                Description: {movie.description || 'No description available.'}
              </Typography>

              {/* Video Selector */}
              {videoFiles.length > 0 && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Select Video</InputLabel>
                  <Select
                    value={selectedVideo}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                  >
                    {videoFiles.map((video) => (
                      <MenuItem key={video.name} value={video.name}>
                        {video.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Screenshot Gallery */}
      {movie.screenshot && movie.screenshot.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Screenshots
          </Typography>
          <Grid container spacing={2}>
            {movie.screenshot.map((screenshot, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                  onClick={() => handleOpen(screenshot)}
                >
                  <CardMedia
                    component="img"
                    image={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    sx={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Video Player */}
      {selectedVideo && (
        <Box sx={{ mt: 4, boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <video key={selectedVideo} controls width="100%">
            <source
              src={`https://movies-backend-ruddy.vercel.app/stream/${encodeURIComponent(
                movie.magnet
              )}/${encodeURIComponent(selectedVideo)}`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </Box>
      )}

      {/* Screenshot Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <img
          src={selectedImage}
          alt="Selected Screenshot"
          style={{ width: '100%', height: 'auto' }}
        />
      </Dialog>
    </Container>
  );
};

export default MovieDetailpirets;
