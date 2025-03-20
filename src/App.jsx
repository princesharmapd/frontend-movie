import React, { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import HomeYts from './componentsyts/HomeYts';
import HomeTorlock from './componentsTorlock/HomeTorlock';  // Example for Torlock
import HomePiratebay from './componentsPiratebay/HomePiratebay';
import HomeGlodls from './componentsGlodls/HomeGlodls';

const supportedSites = [
  "torlock", "yts","piratebay","glodls"
];

const App = () => {
  const [selectedSite, setSelectedSite] = useState("yts"); // Default to 'yts'

  const handleSiteChange = (event) => {
    setSelectedSite(event.target.value);
  };

  // Function to render the appropriate component based on the selected site
  const renderHomeComponent = () => {
    switch (selectedSite) {
      case 'yts':
        return <HomeYts />;
      case 'torlock':
        return <HomeTorlock  />;
        case 'piratebay':
        return <HomePiratebay  />;
        case 'glodls':
        return <HomeGlodls  />;
      
      default:
        return <div>Please select a torrent site.</div>;
    }
  };

  return (
    <div>
      {/* Positioned Dropdown */}
      <Box sx={{
        position: 'absolute', 
        top: 10, 
        left: 10, 
        width: 'auto', // Adjust the width here
        maxWidth: 250, // Set a wider max-width for the dropdown
      }}>
        <FormControl fullWidth>
          <InputLabel id="site-select-label">Select Torrent Site</InputLabel>
          <Select
            labelId="site-select-label"
            id="site-select"
            value={selectedSite}
            label="Select Torrent Site"
            onChange={handleSiteChange}
            sx={{
              width: 150, // Adjusts width based on the content
              maxWidth: 250, // Maximum width for the dropdown
              height: 35, // Adjust the height of the dropdown
              backgroundColor: 'white', // Set the background color to white
            }}
          >
            {supportedSites.map((site) => (
              <MenuItem key={site} value={site} sx={{ height: 30 }}>
                {site}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Conditionally Render Components */}
      {renderHomeComponent()}
    </div>
  );
};

export default App;
