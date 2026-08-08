"use client";

import Link from "next/link";
import { assetPath } from "@/lib/asset-path";

export type GameCardData = {
  slug: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
};

type GameCardProps = {
  game: GameCardData;
};

export default function GameCard({ game }: GameCardProps) {
  function playClickSound() {
    const audio = new Audio(assetPath("/assets/sounds/button-click.wav"));
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  }

  return (
    <article className="game-card">
      <div
        className="game-card__surface"
        style={{ backgroundImage: `url("${assetPath("/assets/home/card-frame.png")}")` }}
      >
        <div className="game-card__preview-wrap">
          <img
            className="game-card__preview"
            src={assetPath(game.image)}
            alt=""
            style={{ objectPosition: game.imagePosition ?? "center" }}
          />
        </div>

        <div className="game-card__copy">
          <h2 className="game-card__title">{game.title}</h2>
          <p className="game-card__description">{game.description}</p>
        </div>

        <Link
          className="game-card__play"
          href={`/games/${game.slug}`}
          onClick={playClickSound}
          aria-label={`Играть: ${game.title}`}
        >
          <img src={assetPath("/assets/home/play-button.png")} alt="Играть" />
        </Link>
      </div>
    </article>
  );
}
