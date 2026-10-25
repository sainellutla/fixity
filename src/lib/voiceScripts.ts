import type { Category, Severity, VoiceLanguage } from './types'

// DEMO ONLY: "voice reporting" plays back these scripted transcripts word by word.
// No audio is recorded and no speech or translation service is called.

export const VOICE_LANGUAGES: { id: VoiceLanguage; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
]

/** Voice-panel UI strings, shown in the speaker's chosen language. */
export const VOICE_UI: Record<VoiceLanguage, { pickType: string; tapToSpeak: string; listening: string; stop: string; done: string; again: string }> = {
  en: { pickType: 'What kind of problem is it?', tapToSpeak: 'Tap to speak', listening: 'Listening…', stop: 'Stop', done: 'Got it! Check your report below.', again: 'Record again' },
  es: { pickType: '¿Qué tipo de problema es?', tapToSpeak: 'Toca para hablar', listening: 'Escuchando…', stop: 'Detener', done: '¡Listo! Revisa tu reporte abajo.', again: 'Grabar de nuevo' },
  pa: { pickType: 'ਇਹ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀ ਸਮੱਸਿਆ ਹੈ?', tapToSpeak: 'ਬੋਲਣ ਲਈ ਦਬਾਓ', listening: 'ਸੁਣ ਰਹੇ ਹਾਂ…', stop: 'ਰੋਕੋ', done: 'ਹੋ ਗਿਆ! ਹੇਠਾਂ ਆਪਣੀ ਰਿਪੋਰਟ ਦੇਖੋ।', again: 'ਦੁਬਾਰਾ ਰਿਕਾਰਡ ਕਰੋ' },
}

export interface VoiceScript {
  id: string
  icon: string
  label: Record<VoiceLanguage, string>
  /** English title the city sees; chosen so the rule-based classifier recognizes it. */
  title: string
  category: Category
  severity: Severity
  transcript: Record<VoiceLanguage, string>
}

export const VOICE_SCRIPTS: VoiceScript[] = [
  {
    id: 'traffic-signal',
    icon: '🚦',
    label: { en: 'Traffic light', es: 'Semáforo', pa: 'ਟ੍ਰੈਫਿਕ ਲਾਈਟ' },
    title: 'Traffic light not working',
    category: 'traffic_safety',
    severity: 'high',
    transcript: {
      en: 'The traffic light at this intersection is not working. Cars do not know when to go and it is very dangerous.',
      es: 'El semáforo de esta intersección no funciona. Los carros no saben cuándo pasar y es muy peligroso.',
      pa: 'ਇਸ ਚੌਰਾਹੇ ਦੀ ਟ੍ਰੈਫਿਕ ਲਾਈਟ ਕੰਮ ਨਹੀਂ ਕਰ ਰਹੀ। ਗੱਡੀਆਂ ਨੂੰ ਨਹੀਂ ਪਤਾ ਕਿ ਕਦੋਂ ਲੰਘਣਾ ਹੈ ਅਤੇ ਇਹ ਬਹੁਤ ਖ਼ਤਰਨਾਕ ਹੈ।',
    },
  },
  {
    id: 'pothole',
    icon: '🕳️',
    label: { en: 'Pothole', es: 'Bache', pa: 'ਸੜਕ ਵਿੱਚ ਟੋਆ' },
    title: 'Large pothole in the road',
    category: 'road_damage',
    severity: 'high',
    transcript: {
      en: 'There is a large pothole in the road. Cars are swerving to avoid it and it could damage tires.',
      es: 'Hay un bache muy grande en la calle. Los carros se desvían para evitarlo y puede dañar las llantas.',
      pa: 'ਸੜਕ ਵਿੱਚ ਇੱਕ ਵੱਡਾ ਟੋਆ ਹੈ। ਗੱਡੀਆਂ ਇਸ ਤੋਂ ਬਚਣ ਲਈ ਮੁੜਦੀਆਂ ਹਨ ਅਤੇ ਇਹ ਟਾਇਰਾਂ ਨੂੰ ਨੁਕਸਾਨ ਪਹੁੰਚਾ ਸਕਦਾ ਹੈ।',
    },
  },
  {
    id: 'streetlight',
    icon: '💡',
    label: { en: 'Streetlight out', es: 'Luz de la calle', pa: 'ਗਲੀ ਦੀ ਬੱਤੀ' },
    title: 'Broken streetlight near crossing',
    category: 'public_lighting',
    severity: 'medium',
    transcript: {
      en: 'The streetlight near the crosswalk is out. It is very dark at night and it is hard to see people crossing.',
      es: 'La luz de la calle cerca del cruce peatonal está apagada. En la noche está muy oscuro y es difícil ver a la gente que cruza.',
      pa: 'ਪੈਦਲ ਲਾਂਘੇ ਦੇ ਨੇੜੇ ਗਲੀ ਦੀ ਬੱਤੀ ਬੰਦ ਹੈ। ਰਾਤ ਨੂੰ ਬਹੁਤ ਹਨੇਰਾ ਹੁੰਦਾ ਹੈ ਅਤੇ ਲੰਘਦੇ ਲੋਕਾਂ ਨੂੰ ਦੇਖਣਾ ਔਖਾ ਹੈ।',
    },
  },
  {
    id: 'flooding',
    icon: '🌊',
    label: { en: 'Flooding', es: 'Inundación', pa: 'ਪਾਣੀ ਭਰਨਾ' },
    title: 'Street flooding after the rain',
    category: 'water_drainage',
    severity: 'high',
    transcript: {
      en: 'The street is flooded after the rain. The water covers the whole road and cars are getting stuck.',
      es: 'La calle está inundada después de la lluvia. El agua cubre toda la calle y los carros se están quedando atascados.',
      pa: 'ਮੀਂਹ ਤੋਂ ਬਾਅਦ ਗਲੀ ਵਿੱਚ ਪਾਣੀ ਭਰ ਗਿਆ ਹੈ। ਪਾਣੀ ਨੇ ਪੂਰੀ ਸੜਕ ਢੱਕ ਲਈ ਹੈ ਅਤੇ ਗੱਡੀਆਂ ਫਸ ਰਹੀਆਂ ਹਨ।',
    },
  },
  {
    id: 'sidewalk',
    icon: '♿',
    label: { en: 'Blocked sidewalk', es: 'Banqueta bloqueada', pa: 'ਫੁੱਟਪਾਥ ਬੰਦ' },
    title: 'Blocked sidewalk',
    category: 'sidewalk_accessibility',
    severity: 'medium',
    transcript: {
      en: 'The sidewalk is blocked. People in wheelchairs and parents with strollers have to walk in the street.',
      es: 'La banqueta está bloqueada. Las personas en silla de ruedas y los padres con carriolas tienen que caminar en la calle.',
      pa: "ਫੁੱਟਪਾਥ ਬੰਦ ਹੈ। ਵ੍ਹੀਲਚੇਅਰ ਵਾਲੇ ਲੋਕਾਂ ਅਤੇ ਬੱਚਿਆਂ ਦੀਆਂ ਗੱਡੀਆਂ ਵਾਲੇ ਮਾਪਿਆਂ ਨੂੰ ਸੜਕ 'ਤੇ ਤੁਰਨਾ ਪੈਂਦਾ ਹੈ।",
    },
  },
  {
    id: 'garbage',
    icon: '🗑️',
    label: { en: 'Missed garbage', es: 'Basura sin recoger', pa: 'ਕੂੜਾ ਨਹੀਂ ਚੁੱਕਿਆ' },
    title: 'Missed garbage collection',
    category: 'waste_sanitation',
    severity: 'medium',
    transcript: {
      en: 'The garbage was not picked up this week. The bins are full and it is starting to smell.',
      es: 'No recogieron la basura esta semana. Los botes están llenos y ya empieza a oler mal.',
      pa: 'ਇਸ ਹਫ਼ਤੇ ਕੂੜਾ ਨਹੀਂ ਚੁੱਕਿਆ ਗਿਆ। ਡੱਬੇ ਭਰੇ ਹੋਏ ਹਨ ਅਤੇ ਬਦਬੂ ਆਉਣ ਲੱਗ ਪਈ ਹੈ।',
    },
  },
]

export function languageLabel(lang: VoiceLanguage): string {
  return VOICE_LANGUAGES.find((l) => l.id === lang)?.label ?? 'English'
}

/** Milliseconds to wait after a word before showing the next — roughly natural speaking pace. */
export function wordDelay(word: string, paceMultiplier = 1): number {
  const base = 520 + Math.min(word.length, 12) * 30
  const pause = /[.!?।]$/.test(word) ? 750 : /[,;:]$/.test(word) ? 350 : 0
  return (base + pause) * paceMultiplier
}
