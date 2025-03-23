// src/components/Header.tsx
"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  InputBase,
  Avatar,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SearchContainer = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.action.hover, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.action.hover, 0.25),
  },
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const StyledCheck = styled("div")(({ theme }) => ({
  padding: theme.spacing(1),
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // add left padding for the search icon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "20ch",
      "&:focus": {
        width: "30ch",
      },
    },
  },
}));

const Header: React.FC = () => {
  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        {/* Left: Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6" noWrap component="div">
            MyAppLogo
          </Typography>
        </Box>

        {/* Middle: Expanded Search Field */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
          <SearchContainer>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
            />
          </SearchContainer>
        </Box>

        <CustomComponent />
        <CustomCheck />
        <CustomWhat />

        {/* Right: Avatar */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar alt="User Avatar" src="/static/images/avatar/1.jpg" />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

const CustomComponent = () => <>
<StyledCheck>
<h1>hi</h1>
</StyledCheck>
</>
const CustomCheck = () => <>
<StyledCheck>

<h1>hi</h1>
</StyledCheck>
</>

const CustomWhat = () => <>
<div>

<h1>hi</h1>
</div>
</>


export default Header;
