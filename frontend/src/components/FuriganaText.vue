<template>
  <span class="furigana-text" :data-language="Language" @click="speak">
    <span class="main-text">{{ displayText }}</span>
    <span v-if="FuriganaText && FuriganaText !== KanjiText" class="furigana">【{{ FuriganaText }}】</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  KanjiText: string
  FuriganaText?: string | null
  Language?: 'ja' | 'ru'
}

const props = withDefaults(defineProps<Props>(), {
  FuriganaText: null,
  Language: 'ja',
})

const displayText = computed(() => props.KanjiText)
const voices = ref<SpeechSynthesisVoice[]>([])
const voicesLoaded = ref(false)

const loadVoices = () => {
  voices.value = window.speechSynthesis.getVoices()
  voicesLoaded.value = voices.value.length > 0
}

onMounted(() => {
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
})

onUnmounted(() => {
  window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
})

const speak = () => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported')
    return
  }

  const text = props.KanjiText
  if (!text) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = props.Language === 'ja' ? 'ja-JP' : 'ru-RU'

  // Try to find appropriate voice
  if (!voicesLoaded.value) {
    loadVoices()
  }
  const targetLang = props.Language === 'ja' ? 'ja' : 'ru'
  let matchingVoice = voices.value.find(v => v.lang === utterance.lang)
  if (!matchingVoice) {
    matchingVoice = voices.value.find(v => v.lang.startsWith(targetLang))
  }
  if (matchingVoice) {
    utterance.voice = matchingVoice
  }

  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}
</script>

<style scoped>
.furigana-text {
  cursor: pointer;
  display: inline;
}

.main-text {
  user-select: text;
  transition: background-position 0.3s ease;
  background-size: 200% 100%;
  background-image: linear-gradient(to right,
      white 50%,
      var(--hover-color) 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.furigana-text[data-language="ja"] .main-text {
  --hover-color: #ff0a14;
}

.furigana-text[data-language="ru"] .main-text {
  --hover-color: #004078;
  background-image: linear-gradient(to right,
      #c7cdd8 50%,
      var(--hover-color) 50%);
}

.furigana-text:hover .main-text {
  background-position: -100% 0;
}

.furigana {
  color: #c7cdd8;
  user-select: text;
  transition: background-position 0.3s ease;
  background-size: 200% 100%;
  background-image: linear-gradient(to right,
      #c7cdd8 50%,
      var(--hover-furigana-color) 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.furigana-text[data-language="ja"] .furigana {
  --hover-furigana-color: #ff0a14;
}

.furigana-text[data-language="ru"] .furigana {
  --hover-furigana-color: #004078;
}

.furigana-text:hover .furigana {
  background-position: -100% 0;
}
</style>
