import React from 'react';
import useTranslation from '../hooks/useTranslation';

export default function TermsModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'var(--color-surface)', width: '90%', maxWidth: 600, maxHeight: '80vh', 
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', 
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>📜 {t('termsTitle') || 'Términos y Condiciones'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--color-text-secondary)', lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, lineHeight: 1.6, color: 'var(--color-text)' }}>
          <h3>Aceptación de los Términos</h3>
          <p>Al acceder y utilizar esta aplicación, usted acepta estar sujeto a estos términos y condiciones de uso.</p>
          
          <h3>Privacidad y Datos</h3>
          <p>Nos tomamos muy en serio la privacidad de sus documentos. Los PDFs que visualice o compare en esta plataforma se procesan principalmente de forma local en su navegador.</p>
          <ul>
            <li>No almacenamos el contenido de sus PDFs en nuestros servidores a menos que utilice explícitamente una función de sincronización en la nube (si está disponible).</li>
            <li>La información de su cuenta (correo) se utiliza únicamente para propósitos de autenticación.</li>
          </ul>

          <h3>Uso Aceptable</h3>
          <p>Usted se compromete a utilizar esta aplicación únicamente para fines legales y de manera que no infrinja los derechos de, restrinja o inhiba el uso de esta aplicación por parte de cualquier tercero.</p>

          <h3>Limitación de Responsabilidad</h3>
          <p>El servicio se proporciona "tal cual". No nos hacemos responsables de cualquier pérdida de datos, interrupción del servicio o daños directos/indirectos derivados del uso de la aplicación.</p>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Última actualización: Marzo 2026
          </p>
        </div>

        <div style={{ padding: '16px 24px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            {t('close') || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
