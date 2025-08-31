"use client";

import React from "react";

// Animated SVG mascot styled similar to your reference
export function CornerCoder() {
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 select-none" aria-hidden>
      <svg className="coder" viewBox="0 0 260 160" width="200" height="120">
        {/* desk line */}
        <rect x="30" y="142" width="180" height="6" rx="3" fill="#2A2E37" opacity="0.6" />

        {/* tower removed */}



        {/* kid group */}
        <g transform="translate(30,70)">
          {/* arm back */}
          <rect className="arm arm-left" x="50" y="50" width="26" height="8" rx="4" fill="#F8C56B" stroke="#C58D2D" strokeWidth="2" />

          {/* body */}
          <rect x="18" y="36" width="36" height="28" rx="8" fill="#3BC77A" stroke="#0C7A43" strokeWidth="3" />

          {/* head */}
          <g className="head">
            <circle cx="28" cy="20" r="16" fill="#FFD694" stroke="#C58D2D" strokeWidth={3} />
            {/* hair */}
            <path d="M16,14 C22,6 36,6 42,14 L42,14 L40,18 C34,12 22,12 18,18 Z" fill="#6B4F3B" />
            {/* eyes */}
            <circle cx="24" cy="20" r="3.2" fill="#111827" />
            <circle cx="34" cy="20" r="3.2" fill="#111827" />
            {/* eye highlights */}
            <circle cx="23.3" cy="19.4" r="0.9" fill="#ffffff" opacity="0.9" />
            <circle cx="33.3" cy="19.4" r="0.9" fill="#ffffff" opacity="0.9" />
            {/* eyebrows */}
            <rect x="20.5" y="16.2" width="7" height="1.8" rx="0.9" fill="#2F2A28" />
            <rect x="31.5" y="16.2" width="7" height="1.8" rx="0.9" fill="#2F2A28" />
            {/* mouth */}
            <path d="M24,26 C27,27 31,27 34,26" stroke="#1F2937" strokeWidth={2.3} strokeLinecap="round" fill="none" />
            {/* headset */}
            <circle cx="12" cy="20" r="8" fill="#0EA5E9" stroke="#1E2230" strokeWidth={3} />
            <circle cx="12" cy="20" r="4" fill="#60A5FA" />
            <rect x="12" y="25" width="10" height="3" rx={1.5} fill="#1E2230" />
            <circle cx="24" cy="28" r="2" fill="#1E2230" />
          </g>

          {/* arm front */}
          <rect className="arm arm-right" x="20" y="50" width="26" height="8" rx="4" fill="#FFD694" stroke="#C58D2D" strokeWidth="2" />
        </g>

        {/* monitor (back view only) */}
        <g transform="translate(124,64)">
          {/* Outer shell */}
          <rect x="-60" y="20" width="50" height="38" rx="10" fill="#495066" stroke="#1E2230" strokeWidth={3} />
          {/* Subtle brand text on back */}
          <text x="-35" y="44" textAnchor="middle" fontSize="7" fontWeight="700" fill="#9AA4B2" opacity="0.7">
            Aytug EREN
          </text>
          {/* Stand */}
          <rect x="-46" y="58" width="22" height="6" rx="3" fill="#3A3F4B" />
        </g>

                {/* keyboard */}
        <g transform="translate(70,124)">
          <rect x="-10" y="0" width="50" height="10" rx="5" fill="#2F3441" stroke="#1E2230" strokeWidth="2" />
        </g>

        {/* bubble removed */}
      </svg>

      <style jsx>{`
        .coder { filter: drop-shadow(0 4px 10px rgba(0,0,0,.15)); }
        .head { transform-origin: 28px 20px; animation: headBob 2.6s ease-in-out infinite; }
        .arm { transform-origin: left center; }
        .arm-right { animation: typeFast .45s ease-in-out infinite alternate; }
        .arm-left { animation: typeFast .45s ease-in-out infinite alternate-reverse; }
        .kbglow { animation: glow 1.4s ease-in-out infinite; }
        /* bubble removed */

        @keyframes headBob { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(1px) rotate(1deg); } }
        @keyframes typeFast { 0% { transform: rotate(0deg) translateY(0); } 100% { transform: rotate(-10deg) translateY(1px); } }
        @keyframes glow { 0%,100% { opacity: .18; } 50% { opacity: .35; } }
        @keyframes blink { 0%, 85%, 100% { opacity: 1; } 90% { opacity: .6; } 95% { opacity: .9; } }
        /* pop animation removed */
      `}</style>
    </div>
  );
}
