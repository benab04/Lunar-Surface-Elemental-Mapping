import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled, alpha } from '@mui/material/styles';

// Styled components
const NavButton = styled(Button)(({ theme, isElementMap }) => ({



    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(2),
    color: '#ffffff',
    backgroundColor: isElementMap ? 'rgba(238, 155, 0, 0.7)' : 'rgba(255, 255, 255, 0.1)',
    '&:hover': {
        backgroundColor: isElementMap ? 'rgba(238, 155, 0, 0.8)' : alpha('#ffffff', 0.2),
    },
    transition: 'all 0.2s ease',
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '16px',
    padding: '8px 16px',
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

const MapsDropdown = ({ onOptionSelect }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOption, setSelectedOption] = useState('Base Map');
    const open = Boolean(anchorEl);


    const mapOptions = [
        'Al Map',
        'Ca Map',
        'Cr Map',
        'Fe Map',
        // 'K Map',
        'Mg Map',
        'Mn Map',
        // 'Na Map',
        // 'P Map',
        // 'S Map',
        // 'Si Map',
        'Ti Map',
        'Base Map'
    ];

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        onOptionSelect(option);
        handleClose();
    };

    const isElementMap = selectedOption !== 'Base Map';

    return (
        <div >
            <NavButton
                id="maps-button"
                aria-controls={open ? 'maps-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}
                isElementMap={isElementMap}
            >
                {selectedOption}
            </NavButton>
            <StyledMenu
                id="maps-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'maps-button',
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
                        maxHeight: "500px",
                        overflowY: "auto",
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(128, 128, 128, 0.5)',
                            borderRadius: '4px',
                            '&:hover': {
                                background: 'rgba(128, 128, 128, 0.7)',
                            },
                        },
                    },
                }}
            >
                {mapOptions.map((option) => (
                    <StyledMenuItem
                        key={option}
                        onClick={() => handleOptionClick(option)}
                        selected={selectedOption === option}
                    >
                        {option}
                    </StyledMenuItem>
                ))}
            </StyledMenu>
        </div>
    );
};

export default MapsDropdown;