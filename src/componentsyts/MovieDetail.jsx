import React, { useState, useContext, useEffect } from 'react';
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
import axios from 'axios';

const MovieDetail = () => {
  const { id } = useParams();
  const { movies } = useContext(MoviesContext);
  const movie = movies[id];
  const [selectedQuality, setSelectedQuality] = useState(movie?.torrents[0]?.quality || '');
  const [selectedImage, setSelectedImage] = useState('');
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (movie) {
      const selectedTorrent = movie.torrents.find((torrent) => torrent.quality === selectedQuality);
      if (selectedTorrent) {
        fetchFiles(selectedTorrent.magnet);
      }
    }
  }, [movie, selectedQuality]);

  // Fetch files from the backend
  const fetchFiles = async (magnet) => {
    try {
      const encodedMagnet = encodeURIComponent(magnet);
      const response = await axios.get(`https://movies-backend-ruddy.vercel.app/list-files/${encodedMagnet}`);
      const videos = response.data.filter((file) => file.type === 'video');
      setFileList(videos);
      if (videos.length) setSelectedFile(videos[0].name);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleQualityChange = (event) => {
    setSelectedQuality(event.target.value);
  };

  const handleOpen = (image) => {
    setSelectedImage(image);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!movie) {
    return (
      <Typography variant="h4" color="error" align="center" sx={{ mt: 3 }}>
        Movie not found
      </Typography>
    );
  }

  const selectedTorrent = movie.torrents.find((torrent) => torrent.quality === selectedQuality);

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
                <Chip label={`Genre: ${movie.genre.join(', ')}`} color="secondary" />
                <Chip label={`Runtime: ${movie.runtime}`} />
                <Chip label={`Rating: ${movie.rating}`} />
              </Box>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
                {movie.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Screenshots */}
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

      {/* Quality Selector */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="quality-select-label">Select Quality</InputLabel>
          <Select
            labelId="quality-select-label"
            id="quality-select"
            value={selectedQuality}
            onChange={handleQualityChange}
          >
            {movie.torrents.map((torrent, index) => (
              <MenuItem key={index} value={torrent.quality}>
                {torrent.quality} - {torrent.size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Video Selector */}
      {fileList.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="file-select-label">Select Video File</InputLabel>
            <Select
              labelId="file-select-label"
              id="file-select"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              {fileList.map((file, index) => (
                <MenuItem key={index} value={file.name}>
                  {file.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Video Player */}
      {selectedFile && selectedTorrent && (
        <Box sx={{ mt: 4, boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <video key={selectedFile} controls width="100%">
            <source
              src={`https://movies-backend-ruddy.vercel.app/stream/${encodeURIComponent(selectedTorrent.magnet)}/${encodeURIComponent(selectedFile)}`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </Box>
      )}

      {/* Screenshot Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <img src={selectedImage} alt="Selected Screenshot" style={{ width: '100%', height: 'auto' }} />
      </Dialog>
    </Container>
  );
};

export default MovieDetail;
