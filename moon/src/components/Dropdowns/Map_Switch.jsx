import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled, alpha } from '@mui/material/styles';

// Styled components
const CameraButton = styled(Button)(({ theme }) => ({
    position: 'absolute',
    right: '155px',
    top: '18px',
    color: '#ffffff',
    backgroundColor: 'rgba(128, 128, 128, 0.5)', // Gray tint
    '&:hover': {
        backgroundColor: 'rgba(128, 128, 128, 0.7)',
    },
    transition: 'all 0.2s ease',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '16px',
    padding: '6px 16px',
    borderRadius: '8px',
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        backgroundColor: alpha('#1a1a1a', 0.95),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        minWidth: '160px',
        marginTop: '8px',
    }
}));

const StyledMenuItem = styled(MenuItem)(({ theme, selected }) => ({
    padding: '12px 24px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: selected ? 500 : 400,
    backgroundColor: selected ? alpha('#ffffff', 0.1) : 'transparent',
    '&:hover': {
        backgroundColor: alpha('#ffffff', 0.15),
    },
    '&:first-of-type': {
        marginTop: '8px',
    },
    '&:last-of-type': {
        marginBottom: '8px',
    },
    transition: 'all 0.2s ease',
}));

const MapSwitchDropdown = ({ currentCamera, onCameraChange, liveMode, fileUploadMode }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const cameraOptions = [
        { value: 'inferno', label: 'Inferno' },
        { value: 'uncertainty', label: 'Uncertainty' }
    ];

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOptionClick = (option) => {
        onCameraChange(option.value);
        handleClose();
    };

    // Get current camera label
    const getCurrentLabel = () => {
        const current = cameraOptions.find(opt => opt.value === currentCamera);
        return current ? current.label : 'Map Type';
    };
    if (liveMode || fileUploadMode) {
        return null
    }

    return (
        <div>
            <CameraButton
                id="camera-button"
                aria-controls={open ? 'camera-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
            >
                {getCurrentLabel()}
            </CameraButton>
            <StyledMenu
                id="camera-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'camera-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    elevation: 8,
                    sx: {
                        mt: 1.5,
                        '& .MuiList-root': {
                            padding: 0,
                        },
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    },
                }}
            >
                {cameraOptions.map((option) => (
                    <StyledMenuItem
                        key={option.value}
                        onClick={() => handleOptionClick(option)}
                        selected={currentCamera === option.value}
                    >
                        {option.label}
                    </StyledMenuItem>
                ))}
            </StyledMenu>
        </div>
    );
};

export default MapSwitchDropdown;