import { useConfigStore } from '@/store/configStore';
import { t, Language } from '@/lib/i18n';

export function useTranslation() {
  const { configuracao } = useConfigStore();
  const lang = configuracao.idioma as Language;

  return {
    t: (key: string, params?: Record<string, string>) => t(key, lang, params),
    lang,
  };
}
