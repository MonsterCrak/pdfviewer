import React, { useState } from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';
import { vincularCuentaLocal } from '../services/firebase';

export default function ProfileModal({ isOpen, onClose }) {
  const user = useAppStore(s => s.user);
  const showToast = useAppStore(s => s.showToast);
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await vincularCuentaLocal(email, password);
      showToast(t('upgradeSuccess') || 'Account linked successfully!', 'success');
      setEmail('');
      setPassword('');
      onClose(); // Optional: Close modal on success
    } catch (error) {
      console.error("Link Account Error:", error);
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
        showToast(t('errCredentialAlreadyInUse') || 'This email is already linked to another account.', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast(t('errWeakPassword') || 'Password should be at least 6 characters', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showToast(t('errInvalidEmail') || 'Invalid email address', 'error');
      } else {
        showToast(t('errDefault') || 'An authentication error occurred', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'var(--color-surface)', width: 400, borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20 }}>👤 {t('profileTitle') || 'Mi Perfil'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>×</button>
        </div>
        
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--color-primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 600, fontSize: 24
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{user?.email || (t('guestUser') || 'Usuario Invitado')}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{user?.isAnonymous ? 'Guest Account' : 'Standard Account'}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>{t('accountDetails') || 'Detalles de la cuenta'}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Email</span>
              <span style={{ fontWeight: 500 }}>{user?.email || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>ID</span>
              <span style={{ fontWeight: 500, fontSize: 12, opacity: 0.7 }}>{user?.uid}</span>
            </div>
          </div>

          {user?.isAnonymous && (
            <div style={{ background: 'var(--color-bg)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: 4, color: 'var(--color-primary)' }}>🔒 {t('upgradeTitle') || 'Asegurar Cuenta'}</h4>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                {t('upgradeDesc') || 'Vincula un correo y contraseña para no perder tus datos si cambias de navegador o dispositivo.'}
              </p>
              
              <form onSubmit={handleLinkAccount} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input 
                  type="email" 
                  placeholder={t('emailPlaceholder') || 'Correo'} 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }}
                />
                <input 
                  type="password" 
                  placeholder={t('passwordPlaceholder') || 'Contraseña'} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', padding: '10px', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '...' : (t('upgradeBtn') || 'Vincular Cuenta')}
                </button>
              </form>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
            {t('close') || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
