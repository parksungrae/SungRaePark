"use client";

import Link from "next/link";
import React from "react";

interface BackButtonProps {
  href?: string;
  className?: string;
  label?: string;
}

export const BackButton = ({ href = "/", className = "", label }: BackButtonProps) => {
  return (
    <Link 
      href={href} 
      className={`unified-back-button ${className}`}
      aria-label={label || "Go back"}
    >
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M36 12H4M4 12L12 4M4 12L12 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ stroke: 'inherit' }}
        />
      </svg>
      {label && <span className="back-button-label">{label}</span>}
      
      <style jsx>{`
        :global(.unified-back-button),
        :global(.unified-back-button:link),
        :global(.unified-back-button:visited),
        :global(.unified-back-button:active) {
          display: inline-flex !important;
          align-items: center !important;
          gap: 12px !important;
          text-decoration: none !important;
          color: #ffffff !important;
          opacity: 1 !important;
          transition: all 0.2s ease-in-out !important;
          z-index: 10001 !important;
          pointer-events: auto !important;
        }

        :global(.unified-back-button svg),
        :global(.unified-back-button svg path) {
          stroke: #ffffff !important;
          color: #ffffff !important;
        }

        :global([data-theme="light"] .unified-back-button),
        :global([data-theme="light"] .unified-back-button:link),
        :global([data-theme="light"] .unified-back-button:visited) {
          color: #000000 !important;
        }

        :global([data-theme="light"] .unified-back-button svg),
        :global([data-theme="light"] .unified-back-button svg path) {
          stroke: #000000 !important;
          color: #000000 !important;
        }

        .unified-back-button:hover {
          opacity: 0.7 !important;
          transform: translateX(-6px) !important;
        }

        .back-button-label {
          font-size: 14px;
          font-weight: 400;
          letter-spacing: -0.02em;
          text-transform: lowercase;
        }
      `}</style>
    </Link>
  );
};
