import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

const CoordinateInput = ({ setAnimateCoordinates, animateCoordinates, isCompositionBarOpen, liveMode }) => {
    const [lat, setLat] = useState("");
    const [long, setLong] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (lat && long) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(long);
            if (!isNaN(latitude) && !isNaN(longitude)) {
                if ((latitude !== animateCoordinates.lat || longitude !== animateCoordinates.long) || !isCompositionBarOpen) {
                    setAnimateCoordinates({
                        lat: latitude,
                        long: longitude,
                    });
                }
            }
        }
    };

    const containerStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '20px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        width: '100%',
        height: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    };

    const titleStyle = {
        color: '#fff',
        fontSize: '15px',
        marginBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '8px'
    };

    const formStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%'
    };

    const inputStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        '& .MuiOutlinedInput-root': {
            color: 'white',
            '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
            },
            '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#4CAF50',
                borderWidth: '1px'
            },
            '& input': {
                padding: '12px 14px',
                fontSize: '14px'
            }
        },
        '& .MuiInputLabel-root': {
            color: '#aaa',
            fontSize: '14px',
            transform: 'translate(14px, 14px) scale(1)',
            '&.Mui-focused, &.MuiFormLabel-filled': {
                transform: 'translate(14px, -9px) scale(0.75)',
                color: '#fff'
            }
        },
        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0
        },
        '& input[type=number]': {
            MozAppearance: 'textfield'
        }
    };

    const buttonStyle = {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        textTransform: 'none',
        fontWeight: '500',
        fontSize: '14px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
            backgroundColor: '#45a049',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
        }
    };

    const inputContainerStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '16px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    };


    // if (liveMode) {
    //     return <></>
    // }

    return (<>
        <Box style={containerStyle}>
            <div style={titleStyle}>Enter Coordinates</div>
            <div style={inputContainerStyle}>

                <form onSubmit={handleSubmit} style={formStyle}>
                    <TextField
                        type="number"
                        label="Latitude"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="-90 to 90"
                        inputProps={{
                            min: -90,
                            max: 90,
                            step: 0.01
                        }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={inputStyle}
                    />
                    <TextField
                        type="number"
                        label="Longitude"
                        value={long}
                        onChange={(e) => setLong(e.target.value)}
                        placeholder="-180 to 180"
                        inputProps={{
                            min: -180,
                            max: 180,
                            step: 0.01
                        }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={inputStyle}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        sx={buttonStyle}
                        fullWidth
                    >
                        Navigate to Location
                    </Button>
                </form>
            </div>
        </Box>
    </>
    );
};

export default CoordinateInput;