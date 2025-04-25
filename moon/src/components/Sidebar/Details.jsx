import React, { useEffect, useState } from 'react';

function LandmarkSidebar({ landmark, onClose, imageUrl, getData }) {
    const [geologicalData, setGeologicalData] = useState(null);

    const iconPaths = {
        "sites": "red",
        "seas": "green",
        "treats": "blue",
        "craters": "pink"
    };

    useEffect(() => {
        const fetchData = async () => {
            const data = await getData(landmark.coordinates.latitude, landmark.coordinates.longitude);
            if (!data) return;
            setGeologicalData(data);
        }
        if (landmark) fetchData();
    }, [landmark, getData]);

    const formatPercent = (value) => {
        return typeof value === 'number' ? value.toFixed(2) + '%' : 'N/A';
    };

    const formatRatio = (value) => {
        return typeof value === 'number' ? value.toFixed(3) : 'N/A';
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
            padding: '24px',
            color: 'white',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.3s ease-out',
            transform: landmark ? 'translateX(0)' : 'translateX(100%)'
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

            {landmark && (
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        marginBottom: '16px',
                        color: iconPaths[landmark.type]
                    }}>
                        {landmark.name}
                    </h2>

                    {landmark.image && (
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            marginBottom: '20px'
                        }}>
                            <img
                                src={imageUrl}
                                alt={`${landmark.name}`}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '4px',
                                    display: 'block'
                                }}
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <p style={{
                            color: '#aaa',
                            marginBottom: '4px'
                        }}>
                            Coordinates:
                        </p>
                        <p style={{ color: '#fff' }}>
                            Latitude: {landmark.coordinates.latitude.toFixed(4)}°
                            <br />
                            Longitude: {landmark.coordinates.longitude.toFixed(4)}°
                        </p>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <p style={{
                            color: '#aaa',
                            marginBottom: '4px'
                        }}>
                            Description:
                        </p>
                        <p style={{
                            color: '#fff',
                            lineHeight: '1.6'
                        }}>
                            {landmark.data.description}
                        </p>
                    </div>

                    {geologicalData && (
                        <>
                            {/* Rock Compositions Section */}
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                padding: '4px 16px',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    color: '#fff',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    paddingBottom: '8px'
                                }}>
                                    Rock Compositions
                                </h3>
                                <div style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '16px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{
                                        color: '#4CAF50',
                                        textTransform: 'capitalize',
                                        fontWeight: '500',
                                        fontSize: '16px',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {geologicalData.rock_compositions.rock_type}
                                    </span>
                                </div>
                                {Object.entries(geologicalData.rock_compositions)
                                    .filter(([key]) => key !== 'rock_type')
                                    .map(([mineral, value]) => (
                                        <div key={mineral} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}>
                                            <span style={{
                                                color: '#aaa',
                                                textTransform: 'capitalize',
                                                fontSize: '14px'
                                            }}>
                                                {mineral.replace('_', ' ')}
                                            </span>
                                            <span style={{
                                                color: '#fff',
                                                fontWeight: '500'
                                            }}>
                                                {value.toFixed(2)}%
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            {/* Elemental Ratios Section */}
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                padding: '16px',
                                borderRadius: '8px'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    color: '#fff',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    paddingBottom: '8px'
                                }}>
                                    Elemental Ratios
                                </h3>
                                {Object.entries(geologicalData.ratios).map(([element, value]) => (
                                    <div key={element} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <span style={{
                                            color: '#aaa',
                                            textTransform: 'uppercase',
                                            fontSize: '14px'
                                        }}>
                                            {element}
                                        </span>
                                        <span style={{
                                            color: '#fff',
                                            fontWeight: '500'
                                        }}>
                                            {value.toFixed(3)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div style={{
                        marginTop: '20px',
                        padding: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }} />
                </div>
            )}
        </div>
    );
}

export default LandmarkSidebar;