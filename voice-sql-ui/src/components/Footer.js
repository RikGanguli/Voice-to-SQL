import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-left">
        <img src="/coaction-logo.jpg" alt="Coaction Logo" className="footer-logo" />

        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a> |
          <a href="/terms-of-use">Terms of Use</a>
        </div>

        <p>©2025 Coaction Specialty Insurance Group, Inc.</p>

        <div className="footer-social">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </div>

      <div className="footer-right">
        <a href="/">Home</a>
        <a href="/about">Get to Know Us</a>
        <a href="/news">In The News</a>
        <a href="/careers">Careers</a>
        <a href="/contact">Contact Us</a>
        <a href="/claims">Claims</a>
      </div>
    </footer>
  );
};

export default Footer;
