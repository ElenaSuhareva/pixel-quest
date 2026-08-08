# Главный экран Pixel Quest

Этот пакет добавляет главный экран после ввода имени.

## Что заменить / добавить

Скопируй содержимое папки пакета в корень текущего проекта с заменой совпадающих файлов.

Будут добавлены/заменены:

- `components/home/HomeScreen.tsx`
- `components/games/GameCard.tsx`
- `components/layout/Header.tsx`
- `components/player/WelcomeScreen.tsx`
- `data/games.ts`
- `styles/home.css`

## Последний обязательный шаг

В `app/layout.tsx` после:

```tsx
import "./globals.css";
```

добавь:

```tsx
import "@/styles/home.css";
```

После сохранения обнови `localhost:3000`.

Чтобы снова увидеть приветственный экран, удали `pixelQuest.player` из Local Storage.
