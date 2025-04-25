import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { alpha } from '@mui/material/styles';

const ModeDropdown = ({ fileUploadMode, setFileUploadMode, liveMode, setLiveMode }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const getCurrentMode = () => {
        // if (fileUploadMode) return 'Upload';
        if (liveMode) return 'Live';
        return 'Dynamic';
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleModeChange = (mode) => {
        if (mode === 'upload') {
            setFileUploadMode(true);
            setLiveMode(false);
        } else if (mode === 'live') {
            setLiveMode(true);
            setFileUploadMode(false);
        } else {
            setFileUploadMode(false);
            setLiveMode(false);
        }
        handleClose();
    };

    const buttonStyles = {
        position: 'absolute',
        left: '292px',
        bottom: '0px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
        transition: 'all 0.2s ease',
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '15px',
        padding: '4px 18px',
        borderRadius: '8px',
    };

    const menuStyles = {
        '& .MuiPaper-root': {
            backgroundColor: alpha('#1a1a1a', 0.95),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            minWidth: '160px',
            marginTop: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }
    };

    const menuItemStyles = (selected) => ({
        padding: '12px 24px',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: selected ? 500 : 400,
        backgroundColor: selected ? alpha('#ffffff', 0.1) : 'transparent',
        '&:hover': {
            backgroundColor: alpha('#ffffff', 0.15),
        },
        transition: 'all 0.2s ease',
    });

    return (
        <div>
            <Button
                id="mode-button"
                aria-controls={open ? 'mode-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
                sx={buttonStyles}
            >
                {getCurrentMode()}
            </Button>
            <Menu
                id="mode-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'mode-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={menuStyles}
                PaperProps={{
                    elevation: 8,
                    sx: {
                        mt: 1.5,
                        '& .MuiList-root': {
                            padding: 0,
                        }
                    }
                }}
            >
                <MenuItem
                    onClick={() => handleModeChange('none')}
                    sx={menuItemStyles(!fileUploadMode && !liveMode)}
                >
                    Dynamic
                </MenuItem>
                <MenuItem
                    onClick={() => handleModeChange('live')}
                    sx={menuItemStyles(liveMode)}
                >
                    Live
                </MenuItem>
            </Menu>
        </div>
    );
};

export default ModeDropdown;