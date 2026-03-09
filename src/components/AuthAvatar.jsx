import React from 'react';

export default function AuthAvatar({ inputLength = 0, isPasswordFocused = false, isSuccess = false, isFail = false }) {
  const maxChars = 30;
  const progress = Math.min(1, Math.max(0, inputLength / maxChars));
  
  // Left: 0 to 100% of range. 
  // Pupil translate: from -5 to +5 to stay inside the eye.
  const pupilX = -5 + (progress * 10);

  // Status Colors
  const baseColor = isSuccess ? '#10B981' : (isFail ? '#EF4444' : 'var(--color-primary)');

  return (
    <div style={{ 
      width: 140, height: 140, margin: '0 auto 16px auto', 
      position: 'relative', zIndex: 10,
      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))',
      animation: 'float 4s ease-in-out infinite'
    }}>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Back Flap of Folder */}
        <path d="M10 32 C10 27, 14 23, 19 23 L35 23 C38 23, 41 25, 43 28 L47 33 C49 36, 52 38, 55 38 L81 38 C86 38, 90 42, 90 47 L90 80 C90 85, 86 89, 81 89 L19 89 C14 89, 10 85, 10 80 L10 32 Z" fill={baseColor} style={{ transition: 'fill 0.3s' }} />
        <path d="M10 32 C10 27, 14 23, 19 23 L35 23 C38 23, 41 25, 43 28 L47 33 C49 36, 52 38, 55 38 L81 38 C86 38, 90 42, 90 47 L90 80 C90 85, 86 89, 81 89 L19 89 C14 89, 10 85, 10 80 L10 32 Z" fill="#000" opacity="0.15" />
        
        {/* Paper sticking out */}
        <g style={{
          transform: isPasswordFocused ? 'translateY(12px)' : 'translateY(0px)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <rect x="20" y="22" width="60" height="40" rx="3" fill="#FFFFFF" />
          {/* PDF Details */}
          <rect x="25" y="28" width="20" height="4" rx="2" fill="#E2E8F0" />
          <line x1="28" y1="38" x2="68" y2="38" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="46" x2="60" y2="46" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
          
          {/* PDF logo tiny */}
          <rect x="68" y="26" width="12" height="12" rx="2" fill="#EF4444" opacity="0.8" />
          <text x="70.5" y="34.5" fill="#FFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">P</text>
        </g>

        {/* Front Flap of Folder */}
        <path d="M10 47 C10 42, 14 38, 19 38 L81 38 C86 38, 90 42, 90 47 L90 80 C90 85, 86 89, 81 89 L19 89 C14 89, 10 85, 10 80 L10 47 Z" fill={baseColor} style={{ transition: 'fill 0.3s' }} />
        {/* Inner shadow for 3D effect */}
        <path d="M10 47 C10 42, 14 38, 19 38 L81 38 C86 38, 90 42, 90 47 L90 80 C90 85, 86 89, 81 89 L19 89 C14 89, 10 85, 10 80 L10 47 Z" fill="none" stroke="#FFF" strokeOpacity="0.2" strokeWidth="1" />

        {/* Face */}
        <g style={{ transform: isPasswordFocused ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.3s' }}>
          
          {isPasswordFocused ? (
            // Eyes squeezed internally when covered
             <>
              <path d="M 32 58 Q 38 52 44 58" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 56 58 Q 62 52 68 58" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : isSuccess ? (
            // Happy eyes
            <>
              <path d="M 32 58 Q 38 48 44 58" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 56 58 Q 62 48 68 58" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          ) : isFail ? (
            // Sad / Error eyes
            <>
              <line x1="32" y1="53" x2="42" y2="61" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
              <line x1="42" y1="53" x2="32" y2="61" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
              
              <line x1="58" y1="53" x2="68" y2="61" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
              <line x1="68" y1="53" x2="58" y2="61" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            // Normal watching eyes
            <>
               <circle cx="38" cy="58" r="9" fill="#FFF" />
              <circle cx="62" cy="58" r="9" fill="#FFF" />
              
              {/* Pupils */}
              <circle cx={38 + pupilX} cy="58" r="4.5" fill="#0F172A" style={{ transition: 'cx 0.1s ease-out' }} />
              <circle cx={62 + pupilX} cy="58" r="4.5" fill="#0F172A" style={{ transition: 'cx 0.1s ease-out' }} />
              {/* Catchlights */}
              <circle cx={38 + pupilX - 1.5} cy="56" r="1.5" fill="#FFF" style={{ transition: 'cx 0.1s ease-out' }} />
              <circle cx={62 + pupilX - 1.5} cy="56" r="1.5" fill="#FFF" style={{ transition: 'cx 0.1s ease-out' }} />
            </>
          )}

          {/* Expressions Mouth */}
          {isSuccess && (
            <path d="M 44 68 Q 50 75 56 68" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
          {isFail && (
            <path d="M 45 74 Q 50 68 55 74" stroke="#FFF" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
          {!isSuccess && !isFail && !isPasswordFocused && (
            <path d="M 47 68 C 47 68, 50 71, 53 68" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          )}
          {isPasswordFocused && (
            <circle cx="50" cy="70" r="2" fill="#FFF" />
          )}
        </g>

        {/* Floating Hands (Covering Eyes) */}
        {/* Left Hand */}
        <g style={{
          transform: isPasswordFocused ? 'translate(38px, 58px) rotate(10deg) scale(1.1)' : 'translate(20px, 75px) rotate(-35deg)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <rect x="-10" y="-8" width="20" height="16" rx="8" fill="#FFF" />
          <rect x="-10" y="-8" width="20" height="16" rx="8" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Right Hand */}
        <g style={{
          transform: isPasswordFocused ? 'translate(62px, 58px) rotate(-10deg) scale(1.1)' : 'translate(80px, 75px) rotate(35deg)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <rect x="-10" y="-8" width="20" height="16" rx="8" fill="#FFF" />
          <rect x="-10" y="-8" width="20" height="16" rx="8" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
