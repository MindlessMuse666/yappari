<!--
  Компонент отображения японского текста с фуриганой.

  Если kana_text отсутствует, равен null или совпадает с kanji_text —
  показывается только kanji_text. Иначе: kanji_text【kana_text】.
-->

<template>
  <span class="kana-text" :data-language="Language">
    <span class="main-text">{{ KanjiText }}</span>
    <span v-if="KanaText && KanaText !== KanjiText" class="kana">【{{ KanaText }}】</span>
  </span>
</template>

<script setup lang="ts">
/**
 * Компонент для отображения японского текста с фуриганой.
 *
 * @example
 * ```vue
 * <KanaText KanjiText="食べる" KanaText="たべる" Language="ja" />
 * <!-- Результат: 食べる【たべる】 -->
 *
 * <KanaText KanjiText="こんにちは" />
 * <!-- Результат: こんにちは (без фуриганы, т.к. нет кандзи) -->
 * ```
 *
 * @module components/KanaText
 */

withDefaults(defineProps<{
  /** Японское слово (кандзи + кана) */
  KanjiText: string
  /** Чтение каной (кана) */
  KanaText?: string | null
  /** Язык для стилизации при наведении: `ja` (акцент) или `ru` (синий) */
  Language?: 'ja' | 'ru'
}>(), {
  KanaText: null,
  Language: 'ja',
})
</script>

<style scoped>
.kana-text {
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

.kana-text[data-language="ja"] .main-text {
  --hover-color: #ff0a14;
}

.kana-text[data-language="ru"] .main-text {
  --hover-color: #004078;
  background-image: linear-gradient(to right,
      #c7cdd8 50%,
      var(--hover-color) 50%);
}

.kana-text:hover .main-text {
  background-position: -100% 0;
}

.kana {
  color: #c7cdd8;
  user-select: text;
  transition: background-position 0.3s ease;
  background-size: 200% 100%;
  background-image: linear-gradient(to right,
      #c7cdd8 50%,
      var(--hover-kana-color) 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kana-text[data-language="ja"] .kana {
  --hover-kana-color: #ff0a14;
}

.kana-text[data-language="ru"] .kana {
  --hover-kana-color: #004078;
}

.kana-text:hover .kana {
  background-position: -100% 0;
}
</style>
