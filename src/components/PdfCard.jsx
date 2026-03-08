import React from 'react';
import useTranslation from '../hooks/useTranslation';

export default function PdfCard({ file, onClick }) {
  const { t } = useTranslation();
  const lastOpened = file.lastOpened
    ? new Date(file.lastOpened).toLocaleDateString()
    : t('never');

  const progress = file.readProgress || 0;

  return (
    <div className="card pdf-card" onClick={() => onClick(file)}>
      <div className="pdf-card-thumbnail">
        {file.thumbnail ? (
          <img src={file.thumbnail} alt={file.name} />
        ) : (
          <span className="placeholder-icon">📄</span>
        )}
      </div>
      <div className="pdf-card-info">
        <div className="pdf-card-name" title={file.name}>{file.name}</div>
        <div className="pdf-card-meta">{t('lastOpened')}{lastOpened}</div>
        <div className="pdf-card-progress">
          <div
            className="pdf-card-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
