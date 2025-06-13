import React, { useState } from "react";

const Login = ({ onLoginSuccess = () => {} }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Please enter your username";
    if (!formData.password) newErrors.password = "Please enter your password";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validateForm()) return;

    const { username, password } = formData;
    if (username === "admin" && password === "123") {
      setLoading(true);
      setTimeout(() => {
        onLoginSuccess();
        setLoading(false);
      }, 1000);
    } else {
      setErrors({ general: "Invalid credentials" });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          margin: "0 auto",
        }}
      >
        <div
          className="login-card"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(20px)",
            padding: "50px 45px",
            width: "100%",
            maxWidth: "450px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#667eea",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px 0", color: "#1f2937", fontSize: "28px", fontWeight: "600" }}>
              Welcome Back
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "16px" }}>
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <div style={{ width: "100%" }}>
            {/* Username Field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Username
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your username"
                  style={{
                    width: "100%",
                    height: "48px",
                    paddingLeft: "40px",
                    paddingRight: "12px",
                    border: errors.username ? "1px solid #ef4444" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.username ? "#ef4444" : "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.username && (
                <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    height: "48px",
                    paddingLeft: "40px",
                    paddingRight: "12px",
                    border: errors.password ? "1px solid #ef4444" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? "#ef4444" : "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.password && (
                <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error Message */}
            {errors.general && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "20px",
                }}
              >
                <p style={{ color: "#dc2626", fontSize: "14px", margin: 0 }}>
                  {errors.general}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                height: "48px",
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "16px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }
              }}
            >
              {loading && (
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Demo Credentials Info */}
            <div
              style={{
                textAlign: "center",
                marginTop: "24px",
                padding: "12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
              }}
            >
              <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
                Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

            <style>
        {`
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Mobile devices */
          @media (max-width: 480px) {
            .login-main-container {
              padding: 16px !important;
            }
            .login-card {
              padding: 32px 24px !important;
            }
          }
          
          /* Tablets */
          @media (min-width: 481px) and (max-width: 1024px) {
            .login-main-container {
              padding: 40px !important;
            }
            .login-card {
              max-width: 500px !important;
              padding: 48px 40px !important;
            }
          }
          
          /* Desktop and larger screens */
          @media (min-width: 1025px) {
            .login-main-container {
              padding: 60px !important;
            }
            .login-card {
              max-width: 450px !important;
              padding: 50px 45px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;