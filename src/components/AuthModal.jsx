import React, { useState } from "react";
import { useAuth } from "../store/authStore";
import { Eye, EyeOff, X, Lock, Mail, User } from "lucide-react";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!formData.name) {
          setErrorMsg("Please enter your name.");
          setIsSubmitting(false);
          return;
        }
        await signUp(formData.name, formData.email, formData.password);
      } else {
        await login(formData.email, formData.email, formData.password); // or login(formData.email, formData.password) based on your authStore signature
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "An error occurred during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* Close Button */}
        <button onClick={onClose} type="button" className="auth-close-btn">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="auth-header">
          <h2>{isSignUp ? "Create Account" : "Welcome Back"}</h2>
          <p>
            {isSignUp
              ? "Sync your library & custom AI taste profile."
              : "Log in to access your customized playlists."}
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={16} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={16} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="auth-input"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-password-toggle"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
            {isSubmitting ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="auth-footer-text">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="auth-toggle-link"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}