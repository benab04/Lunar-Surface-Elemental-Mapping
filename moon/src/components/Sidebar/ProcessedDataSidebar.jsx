import React, { useState } from "react";

const ProcessedDataSidebar = ({ data, onClose, isOpen }) => {
    const [expandedFile, setExpandedFile] = useState(null);

    const LoadingBlock = ({ height = "24px", width = "100%", margin = "8px 0" }) => (
        <div style={{
            height,
            width,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            margin,
            animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }} />
    );

    const formatCoordinates = (coords) => {
        if (!coords) return null;
        return {
            MIN_LAT: Math.min(coords.Lat0, coords.Lat1, coords.Lat2, coords.Lat3).toFixed(4),
            MAX_LAT: Math.max(coords.Lat0, coords.Lat1, coords.Lat2, coords.Lat3).toFixed(4),
            MIN_LON: Math.min(coords.Lon0, coords.Lon1, coords.Lon2, coords.Lon3).toFixed(4),
            MAX_LON: Math.max(coords.Lon0, coords.Lon1, coords.Lon2, coords.Lon3).toFixed(4)
        };
    };

    const DataRow = ({ label, currentValue, previousValue }) => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '40% 30% 30%',
            padding: '6px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '13px'
        }}>
            <span style={{ color: '#aaa' }}>{label === "rock_type" ? "Rock Type" : label}</span>
            <span style={{ color: '#fff', textAlign: 'center' }}>{label === "rock_type" ? currentValue.toUpperCase() : currentValue}</span>
            {/* <span style={{ color: '#888', textAlign: 'center' }}>{previousValue}</span> */}
        </div>
    );

    const FileCard = ({ item, index, isExpanded, onToggle }) => {
        const filename = Object.keys(item.fileinfo)[0];
        const coords = formatCoordinates(item.coordinates);

        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                marginBottom: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
            }}>
                <div
                    onClick={onToggle}
                    style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '14px',
                            color: '#4CAF50',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: '4px'
                        }}>
                            {filename}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#aaa'
                        }}>
                            Lat: {coords?.MIN_LAT}° to {coords?.MAX_LAT}°
                        </div>
                    </div>
                    <span style={{
                        fontSize: '18px',
                        color: '#aaa',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▼
                    </span>
                </div>

                {isExpanded && (
                    <div style={{ padding: '16px' }}>
                        {/* Coordinates */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>Location</div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '30% 70%',
                                padding: '6px 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                fontSize: '13px'
                            }}>
                                <span style={{ color: '#aaa' }}>Latitude</span>
                                <span style={{ color: '#fff' }}>
                                    {coords?.MIN_LAT}° to {coords?.MAX_LAT}°
                                </span>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '30% 70%',
                                padding: '6px 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                fontSize: '13px'
                            }}>
                                <span style={{ color: '#aaa' }}>Longitude</span>
                                <span style={{ color: '#fff' }}>
                                    {coords?.MIN_LON}° to {coords?.MAX_LON}°
                                </span>
                            </div>
                        </div>
                        {/* Data Headers */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40% 30% 30%',
                            padding: '8px 0',
                            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                            <span style={{ color: '#aaa' }}>Metric</span>
                            <span style={{ color: '#fff', textAlign: 'center' }}>Current</span>
                            {/* <span style={{ color: '#888', textAlign: 'center' }}>Previous</span> */}
                        </div>


                        {/* Ratios */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px', fontWeight: "600" }}>Chemical Ratios</div>
                            {Object.entries(item.current_data)
                                .filter(([key]) => key !== 'Rocks')
                                .map(([key, value]) => (
                                    <DataRow
                                        key={key}
                                        label={key}
                                        currentValue={value}
                                        previousValue={item.previous_data[key]}
                                    />
                                ))}
                        </div>

                        {/* Rock Composition */}
                        <div>
                            <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px', fontWeight: "600" }}>Rock Composition</div>
                            {Object.entries(item.current_data.Rocks).map(([key, value]) => (
                                <DataRow
                                    key={key}
                                    label={key}
                                    currentValue={value}
                                    previousValue={item.previous_data.Rocks[key]}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: '400px',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '22px',
            color: 'white',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.3s ease-out',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    transition: 'background-color 0.2s',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
                ×
            </button>

            <div style={{ marginTop: '45px', paddingBottom: "20px" }}>
                {data ? (
                    <>
                        <h3 style={{
                            fontSize: '18px',
                            color: '#fff',
                            marginBottom: '16px',
                            padding: '0 0 12px 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Processed Data Analysis
                        </h3>
                        {data.map((item, index) => (
                            <FileCard
                                key={index}
                                item={item}
                                index={index}
                                isExpanded={expandedFile === index}
                                onToggle={() => setExpandedFile(expandedFile === index ? null : index)}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        <h3 style={{
                            fontSize: '18px',
                            color: '#fff',
                            marginBottom: '16px',
                            padding: '0 0 12px 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Processed Data Analysis
                        </h3>
                        <LoadingBlock height="100px" />
                        <LoadingBlock height="100px" />
                        <LoadingBlock height="100px" />
                    </>
                )}
            </div>
        </div>
    );
};

export default ProcessedDataSidebar;