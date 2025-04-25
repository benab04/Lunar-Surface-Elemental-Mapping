// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children }) => {
    const loggedIn = Cookies.get('logged_in');
    return loggedIn ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
