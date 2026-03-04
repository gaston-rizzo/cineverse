
export function mapLanguageToApi(lang: 'en' | 'es'): string {
    
  const map = {
    en: 'en-US',
    es: 'es-ES'
  }

  return map[lang]
}