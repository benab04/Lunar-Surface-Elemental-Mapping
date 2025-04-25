import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { BACKEND_SERVER_URL } from '../../utils/constants';
const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const storedUsername = process.env.REACT_APP_USERNAME;
            const storedPassword = process.env.REACT_APP_PASSWORD;

            if (username !== storedUsername || password !== storedPassword) {
                alert('Invalid username or password');
                return;
            }

            const userData = {
                ipAddress: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip).catch(error => "error in fetching"),
                userAgent: navigator.userAgent,
                timeOfLogin: new Date().toISOString(),
                location: await fetch('https://ipapi.co/json/').then(res => res.json()).catch(error => "error in fetching"),
            };

            const response = await fetch(`${BACKEND_SERVER_URL}/tiles/store_logs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loginData: userData })
            });
            const data = await response.json();

            if (data.message === "success") {
                Cookies.set('logged_in', 'true', { expires: 1 / 24 });
                window.location.href = '/';
            } else {
                alert('Error during login process');

            }

        } catch (error) {
            console.error('Login error:', error);
            alert('Error during login process');
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #1a237e 0%, #000051 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2
        }}>
            <Paper sx={{
                maxWidth: 400,
                width: '100%',
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(25, 25, 25, 0.9)',
                backdropFilter: 'blur(10px)'
            }}>
                <DarkModeIcon sx={{
                    fontSize: 48,
                    color: '#3f51b5',
                    marginBottom: 2
                }} />
                <Typography variant="h4" sx={{
                    color: 'white',
                    marginBottom: 1
                }}>
                    Welcome Back
                </Typography>
                <Typography variant="body2" sx={{
                    color: '#bdbdbd',
                    marginBottom: 4
                }}>
                    Please sign in to your account
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{
                        marginBottom: 2,
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                                borderColor: '#424242',
                            },
                            '&:hover fieldset': {
                                borderColor: '#3f51b5',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#bdbdbd',
                        },
                    }}
                />
                <TextField
                    fullWidth
                    type="password"
                    variant="outlined"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                        marginBottom: 3,
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                                borderColor: '#424242',
                            },
                            '&:hover fieldset': {
                                borderColor: '#3f51b5',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#bdbdbd',
                        },
                    }}
                />
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    sx={{
                        background: '#3f51b5',
                        '&:hover': {
                            background: '#303f9f',
                        },
                        padding: '12px',
                    }}
                >
                    Sign in
                </Button>
            </Paper>
        </Box>
    );
};

export default LoginPage;