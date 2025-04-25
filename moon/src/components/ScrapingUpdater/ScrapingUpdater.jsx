import React, { useState } from "react";
import {
    Card,
    CardContent,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Box,
    Alert,
    CircularProgress
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../utils/constants";

const ScrapingStatusUploader = () => {
    const [formData, setFormData] = useState({
        status: "",
        userAgent: "",
        fgtServer: "",
        jsessionid1: "",
        jsessionid2: "",
        oauthTokenRequestState: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const styles = {
        container: {
            minHeight: "100vh",
            padding: "24px",
            background: "linear-gradient(180deg, #1a237e 0%, #0d1117 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        card: {
            maxWidth: 600,
            width: "100%",
            background: "rgba(13, 17, 23, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
        },
        title: {
            color: "#fff",
            marginBottom: "8px",
            fontWeight: 600,
        },
        subtitle: {
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "24px",
        },
        formControl: {
            marginBottom: "16px",
            width: "100%",
        },
        input: {
            "& .MuiOutlinedInput-root": {
                color: "#fff",
                "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.23)",
                },
                "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.4)",
                },
                "&.Mui-focused fieldset": {
                    borderColor: "#3f51b5",
                },
            },
            "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
            },
            "& .MuiInputLabel-root.Mui-focused": {
                color: "#3f51b5",
            },
        },
        select: {
            color: "#fff",
            "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.23)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.4)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3f51b5",
            },
        },
        submitButton: {
            background: "linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)",
            color: "white",
            padding: "12px",
            marginTop: "16px",
            "&:hover": {
                background: "linear-gradient(45deg, #283593 30%, #5c6bc0 90%)",
            },
        },
        buttonProgress: {
            color: "#fff",
            position: "absolute",
            top: "50%",
            left: "50%",
            marginTop: -12,
            marginLeft: -12,
        },
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${BACKEND_SERVER_URL}/tiles/update_scraping/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: formData.status,
                    "User-Agent": formData.userAgent,
                    FGTServer: formData.fgtServer,
                    JSESSIONID1: formData.jsessionid1,
                    JSESSIONID2: formData.jsessionid2,
                    OAuth_Token_Request_State: formData.oauthTokenRequestState,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                setMessage({ type: "success", text: "Scraping status updated successfully!" });
            } else {
                setMessage({ type: "error", text: `Error: ${result.error}` });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setMessage({ type: "error", text: "An error occurred while updating the status." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={styles.container}>
            <Card sx={styles.card}>
                <CardContent>
                    <Typography variant="h4" sx={styles.title}>
                        Lunar Scraping Control
                    </Typography>
                    <Typography variant="body1" sx={styles.subtitle}>
                        Update your scraping parameters and configuration
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <FormControl sx={styles.formControl}>
                            <InputLabel id="status-label" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                Status
                            </InputLabel>
                            <Select
                                labelId="status-label"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                sx={styles.select}
                                label="Status"
                            >
                                <MenuItem value="">Select Status</MenuItem>
                                <MenuItem value="TRUE">Active</MenuItem>
                                <MenuItem value="FALSE">Inactive</MenuItem>
                            </Select>
                        </FormControl>

                        {[
                            { name: "userAgent", label: "User Agent", placeholder: "Enter User-Agent" },
                            { name: "fgtServer", label: "FGT Server", placeholder: "Enter FGT Server" },
                            { name: "jsessionid1", label: "Session ID (Primary)", placeholder: "Enter JSESSIONID1" },
                            { name: "jsessionid2", label: "Session ID (Secondary)", placeholder: "Enter JSESSIONID2" },
                            { name: "oauthTokenRequestState", label: "OAuth Token State", placeholder: "Enter OAuth Token Request State" },
                        ].map((field) => (
                            <TextField
                                key={field.name}
                                fullWidth
                                label={field.label}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                variant="outlined"
                                sx={{ ...styles.formControl, ...styles.input }}
                            />
                        ))}

                        {message && (
                            <Alert
                                severity={message.type}
                                sx={{
                                    marginBottom: 2,
                                    backgroundColor: message.type === "success" ? "rgba(46, 125, 50, 0.1)" : "rgba(211, 47, 47, 0.1)",
                                    color: "#fff",
                                }}
                            >
                                {message.text}
                            </Alert>
                        )}

                        <Box sx={{ position: "relative" }}>
                            <Button
                                type="submit"
                                fullWidth
                                disabled={loading}
                                sx={styles.submitButton}
                            >
                                {loading ? "Processing..." : "Update Configuration"}
                            </Button>
                            {loading && <CircularProgress size={24} sx={styles.buttonProgress} />}
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ScrapingStatusUploader;