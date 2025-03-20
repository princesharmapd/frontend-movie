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

const MovieDetail = () => {
  const { id } = useParams();
  const { movies } = useContext(MoviesContext);
  const movie = movies[id];

  const [videoFiles, setVideoFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (movie) {
      fetch(`http://localhost:5000/list-files/${encodeURIComponent(movie.magnet)}`)
        .then((res) => res.json())
        .then((files) => {
          const videos = files.filter((file) => file.type === 'video');
          const images = files.filter((file) => file.type === 'image');

          setVideoFiles(videos);
          setImageFiles(images);
          if (videos.length > 0) setSelectedVideo(videos[0]);
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

  const handleOpen = (image) => {
    setSelectedImage(image);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
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

              {/* Video Selector */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Video</InputLabel>
                <Select
                  value={selectedVideo ? selectedVideo.name : ''}
                  onChange={(e) => {
                    const video = videoFiles.find((v) => v.name === e.target.value);
                    setSelectedVideo(video);
                  }}
                >
                  {videoFiles.map((video) => (
                    <MenuItem key={video.name} value={video.name}>
                      {video.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Video Player */}
              {selectedVideo && (
                <Box sx={{ mt: 4 }}>
                  <video key={selectedVideo.name} controls width="100%">
                    <source
                      src={`http://localhost:5000/stream/${encodeURIComponent(movie.magnet)}/${encodeURIComponent(selectedVideo.name)}`}
                      type="video/mp4"
                    />
                  </video>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Screenshot Gallery */}
      <Grid container spacing={2} sx={{ mt: 4 }}>
        {imageFiles.map((img, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Card onClick={() => handleOpen(`http://localhost:5000/stream/${encodeURIComponent(movie.magnet)}/${encodeURIComponent(img.name)}`)} sx={{ cursor: 'pointer' }}>
              <CardMedia
                component="img"
                image={`http://localhost:5000/stream/${encodeURIComponent(movie.magnet)}/${encodeURIComponent(img.name)}`}
                alt={`Screenshot ${index + 1}`}
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <img src={selectedImage} alt="Screenshot" style={{ width: '100%' }} />
      </Dialog>
    </Container>
  );
};

export default MovieDetail;
