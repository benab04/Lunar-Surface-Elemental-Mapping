import React from 'react';
import { landmarks } from '../../data/landmarks';
import * as THREE from 'three';

function ListSidebar({
    category,
    onClose,
    setSelectedLandmark,
    setIsSidebarOpen,
    setCategory,
    setIsListbarOpen,
    controlsRef,
    isAnimatingRef,
    rotation,
    rotationButtonRef,
    moonRef,
    dynamicMeshRef,
    overlayMeshRef,
    currentCamera
}) {
    const iconPaths = {
        "sites": "red",
        "seas": "green",
        "treats": "blue",
        "craters": "pink"
    };

    // Helper function to convert latitude/longitude to spherical coordinates
    // This accounts for the moon's coordinate system and rotation
    const calculateSphericalCoordinates = (latitude, longitude) => {
        // Convert to radians and adjust for coordinate system
        const latRad = (90 - latitude) * (Math.PI / 180);
        const lonRad = longitude * (Math.PI / 180);

        return {
            // Spherical coordinates (phi is latitude, theta is longitude)
            phi: latRad,
            theta: lonRad
        };
    };

    // Convert latitude/longitude to 3D vector position
    const latLongToVector3 = (latitude, longitude, radius = 3.2) => {
        const { phi, theta } = calculateSphericalCoordinates(latitude, longitude);

        // Convert spherical to Cartesian coordinates
        const x = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.cos(theta);

        return new THREE.Vector3(x, y, z);
    };

    // Calculate the quaternion for camera orientation
    const calculateCameraQuaternion = (targetPos) => {
        const upVector = new THREE.Vector3(0, 1, 0);
        const matrix = new THREE.Matrix4();

        // Create a look-at matrix
        matrix.lookAt(
            targetPos,                    // Camera position
            new THREE.Vector3(0, 0, 0),   // Look at center
            upVector                      // Up direction
        );

        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(matrix);

        return quaternion;
    };


    const animateRotationToDefault = (targetRotation, onComplete) => {
        if (isAnimatingRef.current || !moonRef.current) return;
        isAnimatingRef.current = true;

        const startTime = performance.now();
        const ROTATION_DURATION = 1000;

        // Store initial rotations
        const startRotations = {
            moon: moonRef?.current?.rotation?.y,
            overlay: overlayMeshRef?.current?.rotation?.y,
            // dynamic: dynamicMeshRef?.current?.rotation?.y
        };

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / ROTATION_DURATION, 1);

            // Easing function for smooth animation
            const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOutCubic(progress);

            // Interpolate all rotations
            const currentRotation = THREE.MathUtils.lerp(
                startRotations.moon,
                targetRotation,
                easedProgress
            );

            // Apply rotations
            moonRef.current.rotation.y = currentRotation;
            overlayMeshRef.current.rotation.y = currentRotation;
            // dynamicMeshRef.current.rotation.y = currentRotation;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final values are set exactly
                moonRef.current.rotation.y = targetRotation;
                overlayMeshRef.current.rotation.y = targetRotation;
                // dynamicMeshRef.current.rotation.y = targetRotation;

                isAnimatingRef.current = false;
                rotation.current = 0;

                if (rotationButtonRef.current) {
                    rotationButtonRef.current.textContent = 'Start Rotation';
                }

                // Call the completion callback
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animate);
    };

    const handleLandmarkClick = (landmark) => {
        // First animate the rotation
        console.log("Present here");
        currentCamera.current = 'main'
        animateRotationToDefault(-Math.PI / 2, () => {
            // Then start the landmark animation
            animateToLandmark(landmark);
        });
    };


    const animateToLandmark = (landmark) => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        // Animation parameters
        const PATH_DURATION = 3500;   // Time to travel the path
        const ZOOM_DURATION = 1500;   // Additional time for final zoom
        const TOTAL_DURATION = PATH_DURATION + ZOOM_DURATION;
        const FINAL_RADIUS = 3.2;     // Final close-up distance
        const startTime = performance.now();

        // Get initial camera state
        const startPosition = controlsRef.current.object.position.clone();
        const startRotation = controlsRef.current.object.quaternion.clone();
        rotation.current = 0

        // Calculate landmark position and final camera position
        const landmarkPosition = latLongToVector3(
            landmark.coordinates.latitude,
            landmark.coordinates.longitude
        );
        const landmarkDirection = landmarkPosition.clone().normalize();

        // Calculate initial radius (current camera distance)
        const initialRadius = startPosition.length();
        const MIN_RADIUS = Math.max(initialRadius, FINAL_RADIUS + 1); // Ensure MIN_RADIUS is not less than current radius

        // Determine animation phase based on progress
        const getAnimationPhase = (progress) => {
            if (progress <= PATH_DURATION / TOTAL_DURATION) {
                return 'path';
            }
            return 'zoom';
        };

        // Calculate position along the great circle path
        const calculatePathPoint = (pathProgress, radius) => {
            const startDirection = startPosition.clone().normalize();
            const endDirection = landmarkDirection.clone();

            // Calculate the angle between vectors
            const angle = startDirection.angleTo(endDirection);

            // Create rotation axis
            const rotationAxis = new THREE.Vector3()
                .crossVectors(startDirection, endDirection)
                .normalize();

            // Create the rotation quaternion
            const quaternion = new THREE.Quaternion()
                .setFromAxisAngle(rotationAxis, angle * pathProgress);

            // Apply rotation to start direction
            const currentDirection = startDirection.clone();
            currentDirection.applyQuaternion(quaternion);

            // Return point at specified radius
            return currentDirection.multiplyScalar(radius);
        };

        // Custom easing functions for different animation phases
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easeInOutCubic = (t) => t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / TOTAL_DURATION, 1);
            const phase = getAnimationPhase(progress);

            if (progress < 1) {
                let currentPosition;
                let currentRadius;

                if (phase === 'path') {
                    // During path phase, move along great circle while smoothly transitioning radius
                    const pathProgress = easeInOutCubic(elapsed / PATH_DURATION);
                    currentRadius = initialRadius + (MIN_RADIUS - initialRadius) * pathProgress;
                    currentPosition = calculatePathPoint(pathProgress, currentRadius);
                } else {
                    // During zoom phase, maintain position but reduce radius
                    const zoomProgress = easeOutCubic((elapsed - PATH_DURATION) / ZOOM_DURATION);
                    currentRadius = MIN_RADIUS + (FINAL_RADIUS - MIN_RADIUS) * zoomProgress;
                    currentPosition = landmarkDirection.clone().multiplyScalar(currentRadius);
                }

                // Update camera position
                controlsRef.current.object.position.copy(currentPosition);

                // Calculate and update camera orientation
                const lookMatrix = new THREE.Matrix4();
                lookMatrix.lookAt(
                    currentPosition,
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 1, 0)
                );

                const targetQuaternion = new THREE.Quaternion()
                    .setFromRotationMatrix(lookMatrix);

                // Smooth rotation interpolation
                controlsRef.current.object.quaternion.slerpQuaternions(
                    startRotation,
                    targetQuaternion,
                    easeInOutCubic(progress)
                );

                controlsRef.current.update();
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                const finalPosition = landmarkDirection.multiplyScalar(FINAL_RADIUS);
                controlsRef.current.object.position.copy(finalPosition);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
                controlsRef.current.enabled = false;
                isAnimatingRef.current = false;

                // Update UI state
                setSelectedLandmark({
                    name: landmark.name,
                    coordinates: landmark.coordinates,
                    data: { description: landmark.data.description },
                    type: landmark.type,
                    image: landmark.image,
                });
                setIsSidebarOpen(true);
                setCategory(null);
                setIsListbarOpen(false);
            }
        };

        requestAnimationFrame(animate);
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
            transform: category ? 'translateX(0)' : 'translateX(100%)'
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

            {category && (
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        marginBottom: '16px',
                    }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {landmarks.filter(landmark => landmark.type === category).map((landmark) => (
                            <button
                                key={landmark.name}
                                onClick={() => {
                                    handleLandmarkClick(landmark)
                                }}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    textAlign: 'left',
                                    color: '#fff',
                                    width: '100%',
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            >
                                {landmark.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ListSidebar;