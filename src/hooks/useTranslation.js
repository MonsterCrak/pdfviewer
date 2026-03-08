import translations from '../i18n/translations';
import useAppStore from '../stores/appStore';

/**
 * Hook that returns a translation function `t(key)` for the current language.
 */
export default function useTranslation() {
  const language = useAppStore(s => s.language);
  const strings = translations[language] || translations.en;

  const t = (key, ...args) => {
    const val = strings[key];
    if (typeof val === 'function') return val(...args);
    return val || key;
  };

  return { t, language };
}
