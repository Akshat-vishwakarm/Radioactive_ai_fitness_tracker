import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RADIOACTIVE_LOGO } from '../../assets/logo';

interface LoginScreenProps {
  onLocalGuestLogin?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLocalGuestLogin }) => {
  const { signInWithGoogle, authError, clearAuthError, loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async (mode: 'popup' | 'redirect' = 'popup') => {
    setLoading(true);
    setLocalError(null);
    clearAuthError();
    try {
      await signInWithGoogle(mode);
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeError = authError || localError;

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fixed Background Logo Watermark */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={RADIOACTIVE_LOGO}
          alt=""
          className="w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] object-contain opacity-[0.16] mix-blend-multiply filter contrast-125"
        />
      </div>

      {/* Main Minimalist Auth Card */}
      <div className="w-full max-w-md bg-surface border border-outline rounded-xl p-8 space-y-8 relative z-10 shadow-lg">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src={RADIOACTIVE_LOGO}
            alt="Radioactive Logo"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('radioactive-logo.png') && !target.src.includes('radioactive-logo.jpg')) {
                target.src = '/radioactive-logo.png';
              } else if (target.src.includes('radioactive-logo.png')) {
                target.src = '/radioactive-logo.jpg';
              } else {
                target.onerror = null;
              }
            }}
            className="w-16 h-16 rounded-xl object-contain bg-white border border-outline p-1.5 shadow-sm"
          />

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">OS v2.4 &bull; AUTHENTICATION</div>
            <h1 className="font-heading font-extrabold text-2xl text-on-surface tracking-tight mt-0.5 uppercase">
              RADIOACTIVE
            </h1>
          </div>

          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            Minimalist fitness operating system. Authenticate to sync your habits, training telemetry, and personal API tokens.
          </p>
        </div>

        {/* Error Alert Banner */}
        {activeError && (
          <div className="bg-surface-variant border border-outline text-on-surface p-3.5 rounded-lg text-xs font-mono space-y-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-error shrink-0 mt-0.5">error</span>
              <div className="flex-1 break-words">{activeError}</div>
              <button
                onClick={() => {
                  setLocalError(null);
                  clearAuthError();
                }}
                className="text-[10px] uppercase font-bold text-secondary hover:text-primary underline ml-1"
              >
                Dismiss
              </button>
            </div>
            {activeError.includes('not authorized') && (
              <div className="text-[10px] text-secondary leading-normal pt-1 border-t border-outline/30">
                Tip: Open Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains and add your current host: <strong className="text-primary">{window.location.hostname}</strong>
              </div>
            )}
          </div>
        )}

        {/* Primary Action: Continue with Google */}
        <div className="space-y-3">
          <button
            onClick={() => handleSignIn('popup')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-primary hover:bg-[#222222] text-on-primary font-heading font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2 font-mono">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AUTHENTICATING WITH GOOGLE...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>

          {/* Alternate Redirect Mode for mobile or strict popup blocker environments */}
          <button
            onClick={() => handleSignIn('redirect')}
            disabled={loading}
            className="w-full text-center py-2 text-[11px] font-mono text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Trouble with popups? Use Full-Page Redirect &rarr;
          </button>

          {/* Local Guest Mode for instant offline testing */}
          <button
            onClick={onLocalGuestLogin || loginAsGuest}
            disabled={loading}
            className="w-full text-center py-2.5 px-4 rounded-lg bg-surface hover:bg-surface-variant border border-outline text-xs font-mono font-bold text-on-surface transition-colors cursor-pointer"
          >
            LAUNCH LOCAL GUEST PROFILE
          </button>
        </div>

        {/* Security Disclaimers */}
        <div className="pt-4 border-t border-outline text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Cryptographic Per-User Isolation</span>
          </div>
          <p className="text-[10px] text-on-surface-variant max-w-xs mx-auto leading-normal">
            Your telemetry, gym splits, nutrition logs, and personal API tokens are encrypted and strictly bound to your authenticated identity.
          </p>
        </div>
      </div>
    </div>
  );
};
