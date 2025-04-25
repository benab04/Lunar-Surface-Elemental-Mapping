import React from "react";

const ChemicalCompositionSidebar = ({ data, onClose, isOpen }) => {
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
                        {/* Coordinates Section */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '16px',
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
                                Selected Region
                            </h3>
                            <div style={{ padding: '8px 0' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ color: '#aaa' }}>Latitude: </span>
                                    <span style={{ color: '#fff' }}>
                                        {data.coordinates.MIN_LAT}° to {data.coordinates.MAX_LAT}°
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: '#aaa' }}>Longitude: </span>
                                    <span style={{ color: '#fff' }}>
                                        {data.coordinates.MIN_LON}° to {data.coordinates.MAX_LON}°
                                    </span>
                                </div>
                            </div>
                        </div>

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
                                    {data.rock_compositions.rock_type}
                                </span>
                            </div>
                            {Object.entries(data.rock_compositions)
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
                            {Object.entries(data.ratios).map(([element, value]) => (
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
                ) : (
                    <>
                        {/* Loading Coordinates Section */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '16px',
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
                                Selected Region
                            </h3>
                            <div style={{ padding: '8px 0' }}>
                                <LoadingBlock />
                                <LoadingBlock marginBottom="0" />
                            </div>
                        </div>

                        {/* Loading Rock Compositions Section */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '16px',
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
                                display: "flex",
                                justifyContent: "center"
                            }}>
                                <LoadingBlock height="20px" width="60%" margin="0" />
                            </div>
                            <div style={{ padding: '0 0px' }}>
                                <LoadingBlock margin="12px 0" />
                                <LoadingBlock margin="12px 0" />
                                <LoadingBlock margin="12px 0" />
                                <LoadingBlock margin="12px 0 4px 0" />
                            </div>
                        </div>

                        {/* Loading Elemental Ratios Section */}
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
                            <LoadingBlock />
                            <LoadingBlock />
                            <LoadingBlock />
                            <LoadingBlock marginBottom="0" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChemicalCompositionSidebar;