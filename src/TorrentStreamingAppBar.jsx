import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import axios from "axios";
import logo from "./assets/logo.png";

const GradientAppBar = styled(AppBar)({
  background: "linear-gradient(90deg, white, #ff4500)",
  margin: 0,
  padding: 0,
  top: 0,
  height: 48,
});

const TorrentStreamingAppBar = () => {
  const [version, setVersion] = useState(null);
  const [uptime, setUptime] = useState(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await axios.get("https://torrent-fast-api.onrender.com/health");
        setVersion(response.data.version);
        setUptime(response.data.uptime);
      } catch (error) {
        console.error("Error fetching health data:", error);
      }
    };

    fetchHealthData();
  }, []);

  return (
    <GradientAppBar position="fixed" sx={{ height: 48, margin: 0, padding: 0, top: -5, borderRadius: 10 }}>
      <Toolbar sx={{ minHeight: 48, height: 48, marginTop: "-5px" }}>
        <img src={logo} alt="Logo" style={{ height: 40, marginRight: 20 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "0.875rem",color:"black",fontWeight:"bold" }}>
          Movies Streaming
        </Typography>
        {version && uptime && (
          <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
            Version: {version} | Uptime: {uptime}s
          </Typography>
        )}
      </Toolbar>
    </GradientAppBar>
  );
};

export default TorrentStreamingAppBar;
