import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CoordinateInput from './CoordinateInput';
import { parseOverlays } from '../../utils/jsonConverter';
import { BACKEND_SERVER_URL } from '../../utils/constants';

const FileUploadPanel = ({ setIsProcessedDataSidebarOpen, processedData, setProcessedData, canvasRef, setFileUploadMode, setDynamicRendering, setTileIndexAnimte, setModifiedTileData, currentOverlay, mapType }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);



    function getZoomOffset(axis) {
        const offsets = {
            12: { x: 0, y: 0 },     // Base level stays at origin
            24: { x: -0.001, y: -0.38 }, // Compensate for rightward/downward drift
            48: { x: -1.2, y: -0.8 }  // Further compensation for higher zoom
        };

        return offsets[48][axis];
    }

    const getAdjustedPosition = (tileIndex, cols, rows, cellWidth, cellHeight) => {
        const col = Math.floor(tileIndex / rows);
        const row = tileIndex % rows;

        const zoomOffsetX = getZoomOffset('x');
        const zoomOffsetY = getZoomOffset('y');

        return {
            x: (col + zoomOffsetX) * cellWidth,
            y: (row + zoomOffsetY) * cellHeight
        };
    };

    const highlightTile = (ctx, tileIndex, duration = 6000) => {
        if (!ctx) return;

        const cols = 48;
        const rows = 48;
        const cellWidth = ctx.canvas.width / cols;
        const cellHeight = ctx.canvas.height / rows;

        // Get position with zoom offset applied
        const { x, y } = getAdjustedPosition(tileIndex, cols, rows, cellWidth, cellHeight);

        // Store the original state at the offset position with a slight padding
        const padding = 1; // 1px padding to handle edge artifacts
        const originalImageData = ctx.getImageData(
            x - padding,
            y - padding,
            cellWidth + (2 * padding) + 1,
            cellHeight + (2 * padding) + 2
        );

        // Apply highlight at the exact offset position
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);
        ctx.restore();

        // Update texture
        if (ctx.canvas.parentTextureCallback) {
            ctx.canvas.parentTextureCallback();
        }

        // Schedule removal of highlight
        setTimeout(() => {
            // Clear the area first to remove any artifacts
            ctx.clearRect(x - padding, y - padding, cellWidth, cellHeight);

            // Restore the original image with padding
            ctx.putImageData(originalImageData, x - padding, y - padding);

            // Force a clean edge render
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, cellWidth, cellHeight);
            ctx.clip();
            ctx.drawImage(
                ctx.canvas,
                x - padding,
                y - padding,
                cellWidth + (2 * padding),
                cellHeight + (2 * padding),
                x - padding,
                y - padding,
                cellWidth + (2 * padding),
                cellHeight + (2 * padding)
            );
            ctx.restore();

            // Update texture after cleanup
            if (ctx.canvas.parentTextureCallback) {
                ctx.canvas.parentTextureCallback();
            }
        }, duration);
    };

    const updateCanvas = (imageData) => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const { cols, rows } = { cols: 48, rows: 48 };
        const cellWidth = canvasRef.current.width / cols;
        const cellHeight = canvasRef.current.height / rows;

        let loadedImages = 0;
        const totalImages = imageData.length;

        const firstTileIndex = imageData[0]?.tileIndex;

        imageData.forEach(({ tileIndex, image }) => {
            const img = new Image();
            img.onload = () => {
                // Get position with zoom offset applied
                const { x, y } = getAdjustedPosition(tileIndex, cols, rows, cellWidth, cellHeight);

                // Clear the specific tile area at offset position
                ctx.clearRect(x, y, cellWidth, cellHeight);

                // Draw the image at the offset position
                ctx.drawImage(img, x, y, cellWidth, cellHeight);

                // Highlight will be applied at the same offset position
                highlightTile(ctx, tileIndex);

                loadedImages++;
                if (loadedImages === totalImages && canvasRef.current.parentTextureCallback) {
                    canvasRef.current.parentTextureCallback();
                }

                if (firstTileIndex !== undefined) {
                    setTileIndexAnimte(firstTileIndex)
                }
            };
            img.src = `data:image/png;base64,${image}`;

            img.onerror = () => {
                console.error(`Failed to load image for tile ${tileIndex}`);
                loadedImages++;
                if (loadedImages === totalImages && canvasRef.current.parentTextureCallback) {
                    canvasRef.current.parentTextureCallback();
                }
            };
        });
    };

    // Rest of the component remains the same...
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        const fitsFiles = files.filter(file =>
            file.name.toLowerCase().endsWith('.fits')
        );
        setSelectedFiles(fitsFiles);
    };

    const handleUpload = async () => {
        const element = parseOverlays(currentOverlay)
        if (element === "Base") {
            alert('Please select an elemental map');
            return;
        }
        if (selectedFiles.length === 0) {
            alert('Please select at least one FITS file');
            return;
        }

        setIsUploading(true);
        setFileUploadMode(true)
        setDynamicRendering(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('file', file);
        });
        formData.append("element", element)
        formData.append('mapType', mapType)

        try {
            const response = await fetch(`${BACKEND_SERVER_URL}/tiles/process-fits/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setModifiedTileData(data[0].images)
            console.log('Images received successfully:', data[0].images);
            setProcessedData(data[0].data)
            updateCanvas(data[0].images);
            setSelectedFiles([]);

        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload files. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                left: '26px',
                bottom: '50px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '20px',
                borderRadius: '12px',
                color: 'white',
                width: '240px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <Box sx={{
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '10px'
            }}>
                <Typography sx={{ fontSize: '16px', fontWeight: '600' }}>
                    FITS File Upload
                </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
                <input
                    accept=".fits"
                    style={{ display: 'none' }}
                    id="file-input"
                    multiple
                    type="file"
                    onChange={handleFileSelect}
                />
                <label htmlFor="file-input">
                    <Button
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            }
                        }}
                    >
                        Select Files
                    </Button>
                </label>
            </Box>

            {selectedFiles.length > 0 && (
                <Box sx={{
                    mb: 2,
                    maxHeight: '200px',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '3px'
                    }
                }}>
                    <List dense>
                        {selectedFiles.map((file, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={file.name}
                                    secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                    primaryTypographyProps={{
                                        sx: { color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }
                                    }}
                                    secondaryTypographyProps={{
                                        sx: { color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            <Button
                fullWidth
                disabled={selectedFiles.length === 0 || isUploading}
                onClick={handleUpload}
                sx={{
                    backgroundColor: isUploading ? 'rgba(153, 157, 158, 0.3)' : 'transparent',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:disabled': {
                        backgroundColor: 'rgba(153, 157, 158, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)'
                    }
                }}
            >
                {isUploading ? (
                    <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        Uploading...
                    </>
                ) : (
                    'Upload'
                )}
            </Button>
            <Box sx={{
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '10px',
            }}>
                <Typography sx={{ marginTop: '10px', fontSize: '10', fontWeight: '400', }}>
                    {parseOverlays(currentOverlay) === "Base" ? "No element selected" : `Selected Element : ${parseOverlays(currentOverlay)}`}
                </Typography>
            </Box>
            {processedData ? <Button
                fullWidth
                onClick={() => {
                    setIsProcessedDataSidebarOpen(true)
                }}
                sx={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&:disabled': {
                        backgroundColor: 'rgba(153, 157, 158, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)'
                    }
                }}
            >
                Show Fetched Data
            </Button> : null}
        </Box>
    );
};

export default FileUploadPanel;