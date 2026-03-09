import React, { useState } from 'react';
import useAppStore from '../stores/appStore';
import { loginUsuario, registrarUsuario, loginAnonimo } from '../services/firebase';
import useTranslation from '../hooks/useTranslation';
import AuthAvatar from '../components/AuthAvatar';
import TermsModal from '../components/TermsModal';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Status flags for the Animated Avatar
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFail, setIsFail] = useState(false);

  const showToast = useAppStore(s => s.showToast);
  const { t } = useTranslation();

  const getFriendlyErrorMessage = (error) => {
    if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
      return t('errWrongPassword') || 'Incorrect credentials';
    }

    switch (error.code) {
      case 'auth/invalid-email': return t('errInvalidEmail') || 'Invalid email address';
      case 'auth/user-not-found': return t('errUserNotFound') || 'User not found';
      case 'auth/wrong-password': 
      case 'auth/invalid-credential': 
      case 'auth/invalid-login-credentials': return t('errWrongPassword') || 'Incorrect credentials';
      case 'auth/email-already-in-use': return t('errEmailInUse') || 'Email is already registered';
      case 'auth/weak-password': return t('errWeakPassword') || 'Password should be at least 6 characters';
      case 'auth/account-exists-with-different-credential': return t('errDifferentCredential') || 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/popup-closed-by-user': return t('errPopupClosed') || 'Login popup was closed. (Check AdBlock/Shields)';
      case 'auth/popup-blocked': return t('errPopupBlocked') || 'Login popup was blocked by the browser.';
      case 'auth/network-request-failed': return t('errNetwork') || 'Network error, or cookies are blocked by Brave Shields.';
      case 'auth/internal-error': return t('errInternal') || 'Internal auth error. If using Brave, lower Shields.';
      default: return error.message || t('errDefault') || 'An authentication error occurred';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSuccess(false);
    setIsFail(false);
    
    if (!isLogin) {
      if (password !== confirmPassword) {
        setIsFail(true);
        showToast(t('errPasswordsNotMatch') || 'Passwords do not match', 'error');
        setLoading(false);
        setTimeout(() => setIsFail(false), 2000);
        return;
      }
      if (!acceptedTerms) {
        setIsFail(true);
        showToast(t('errAcceptTerms') || 'You must accept the terms and conditions', 'error');
        setLoading(false);
        setTimeout(() => setIsFail(false), 2000);
        return;
      }
    }

    try {
      if (isLogin) {
        await loginUsuario(email, password);
        setIsSuccess(true);
        showToast(t('loginSuccess') || 'Logged in successfully', 'success');
      } else {
        await registrarUsuario(email, password);
        setIsSuccess(true);
        showToast(t('registerSuccess') || 'Registered successfully', 'success');
      }
    } catch (err) {
      setIsFail(true);
      showToast(getFriendlyErrorMessage(err), 'error');
    } finally {
      setLoading(false);
      // Reset fail animation after 2 seconds
      setTimeout(() => setIsFail(false), 2000);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setIsSuccess(false);
    setIsFail(false);
    try {
      await loginAnonimo();
      setIsSuccess(true);
      showToast(t('loginSuccess') || 'Logged in successfully', 'success');
    } catch (err) {
      setIsFail(true);
      showToast(getFriendlyErrorMessage(err), 'error');
      setTimeout(() => setIsFail(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 24, background: 'var(--color-bg)'
    }}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
        padding: 32, width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)', zIndex: 1, position: 'relative'
      }}>
        
        <div style={{ marginTop: -80, position: 'relative', zIndex: 10 }}>
          <AuthAvatar 
            inputLength={email.length} 
            isPasswordFocused={isPasswordFocused}
            isSuccess={isSuccess}
            isFail={isFail}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2>{isLogin ? (t('loginTitle') || 'Welcome Back') : (t('registerTitle') || 'Create Account')}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
            {t('authSubtitle') || 'Sign in to sync your PDFs securely.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            type="email" 
            placeholder={t('emailPlaceholder') || 'Email'} 
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setIsPasswordFocused(false)}
            required
            autoComplete="email"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', boxSizing: 'border-box' }}
          />
          
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder={t('passwordPlaceholder') || 'Password'} 
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, 
                color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center'
              }}
              title={showPassword ? "Ocultar" : "Mostrar"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          {!isLogin && (
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder={t('confirmPasswordPlaceholder') || 'Confirm Password'} 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
                autoComplete="new-password"
                style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, 
                  color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center'
                }}
                title={showConfirmPassword ? "Ocultar" : "Mostrar"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          )}

          {!isLogin && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <input 
                type="checkbox" 
                id="termsCheckbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                style={{ marginTop: 2, cursor: 'pointer' }}
              />
              <label htmlFor="termsCheckbox" style={{ cursor: 'pointer', lineHeight: 1.4 }}>
                {t('termsTextPrefix') || 'Acepto los '}
                <span 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }} 
                  style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                >
                  {t('termsTextLink') || 'Términos de Servicio y la Política de Privacidad'}
                </span>.
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ padding: '12px', fontSize: 15, fontWeight: 600, marginTop: 8 }}
          >
            {loading ? '...' : (isLogin ? (t('loginBtn') || 'Sign In') : (t('registerBtn') || 'Sign Up'))}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setConfirmPassword('');
              setAcceptedTerms(false);
            }} 
            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500 }}
          >
            {isLogin ? (t('needAccount') || 'Don\'t have an account? Sign up') : (t('haveAccount') || 'Already have an account? Sign in')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t('orContinueWith') || 'o continúa con'}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button  
            type="button" 
            className="btn btn-secondary" 
            onClick={handleAnonymousLogin}
            disabled={loading}
            style={{ padding: '12px' }}
          >
            <span style={{ fontWeight: 500 }}>👤 {t('loginAnonymous') || 'Continue as Guest'}</span>
          </button>
        </div>
      </div>
      
      {/* Terms Modal */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}
