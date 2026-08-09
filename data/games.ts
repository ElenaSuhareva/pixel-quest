import type { GameCardData } from "@/components/games/GameCard";

export const games: GameCardData[] = [
  {
    slug: "brave-knight",
    title: "Храбрый рыцарь",
    description: "Отправляйся в путь и спаси королевство!",
    image: "/assets/home/game-knight.jpg",
    imagePosition: "center",
  },
  {
    slug: "farm-valley",
    title: "Фермерская долина",
    description: "Выращивай цветы и развивай свою ферму!",
    image: "/assets/home/game-farm.jpg",
    imagePosition: "center 52%",
  },
  {
    slug: "cave-adventure",
    title: "Победи монстра",
    description: "Сразись в пещерные крестики-нолики!",
    image: "/assets/home/game-cave.jpg",
    imagePosition: "center",
  },
];
