import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import MovieListTrending from "./MovieListTrending";
import MovieListAll from "./MovieListAll";
import MovieDetail from "./MovieDetail";
import { IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Tooltip from "@mui/material/Tooltip";
import MovieListAllTorrent from "./MovieListAllTorrent";
import MovieDetailAllTorrent from "./MovieDetailAllTorrent";
import TorrentStreamingAppBar from "./TorrentStreamingAppBar";

const App = () => {
  return (
    <>
    <TorrentStreamingAppBar />
    <Router>
      <Routes>
        <Route path="/" element={<MovieListWithSearch />} />
        <Route path="/movies" element={<MovieListAll />} />
        <Route path="/moviesalltorrent" element={<MovieListAllTorrent />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/moviesalltorrent/:id" element={<MovieDetailAllTorrent />} />
      </Routes>
    </Router>
    </>
    
  );
};

const MovieListWithSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show the search icons on the home page
  const shouldShowSearchIcons = location.pathname !== "/movies";

  return (
    <div>
      {shouldShowSearchIcons && (
        <>
          {/* Regular Search Icon */}
          <IconButton
            onClick={() => navigate("/movies")}
            sx={{
              position: "fixed",
              top: 120,
              right: 20,
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: 3,
              
            }}
          >
            <SearchIcon />
          </IconButton>

          {/* Search in All Torrent with Tooltip */}
          <Tooltip title="Search in All Torrent" arrow>
            <IconButton
              onClick={() => navigate("/moviesalltorrent")} // Corrected navigation
              sx={{
                position: "fixed",
                top: 70, // Positioned lower than the first button
                right: 20,
                zIndex: 1000,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                boxShadow: 3,
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* Render the MovieListTrending component */}
      <MovieListTrending />
    </div>
  );
};

export default App;
