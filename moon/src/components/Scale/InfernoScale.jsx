import React, { useEffect, useRef } from 'react';
import { scaleSequential } from 'd3-scale';
import { interpolateInferno } from 'd3-scale-chromatic';

const InfernoScale = ({ minValue, maxValue, width, height, scaleRightMargin }) => {

    const canvasRef = useRef(null);

    useEffect(() => {
        if (minValue === null || maxValue === null) {
            return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Create the inferno scale
        const infernoScale = scaleSequential(interpolateInferno).domain([minValue, maxValue]);

        // Draw the scale
        for (let y = 0; y < height; y++) {
            // Map the y-coordinate to the inferno scale (invert for vertical)
            const value = minValue + ((height - y) / height) * (maxValue - minValue);
            const color = infernoScale(value);

            // Set the fill style to the interpolated color
            ctx.fillStyle = color;

            // Draw a horizontal strip
            ctx.fillRect(0, y, width, 1);
        }
    }, [minValue, maxValue, width, height]);

    // Generate labels
    const divisions = 8; // Number of divisions
    const labels = Array.from({ length: divisions + 1 }, (_, i) =>
        minValue + ((maxValue - minValue) / divisions) * i
    );

    if (minValue === null || maxValue === null) {
        return null;
    }
    return (
        <div style={{
            position: 'absolute',
            top: '90px',
            right: `${scaleRightMargin}px`,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            transition: 'right 0.3s ease'
        }}>
            {/* Canvas for the scale */}
            <canvas ref={canvasRef} width={width} height={height} />

            {/* Labels beside the scale */}
            <div style={{
                marginLeft: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: `${height}px`,
                color: "white",
                fontSize: "8px"
            }}>
                {labels.reverse().map((label, index) => (
                    <span key={index} style={{ fontSize: '12px', textAlign: 'left' }}>
                        {label.toFixed(4)}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default InfernoScale;
