"use client";

import Link from "next/link";
import { assetPath } from "@/lib/asset-path";

type GameDescriptionPageProps = {
  title: string;
  description: string;
  image: string;
  details: string;
};

export default function GameDescriptionPage({
  title,
  description,
  image,
  details
}: GameDescriptionPageProps) {
  return (
    <main
      className="game-details-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 13, 48, 0.18), rgba(5, 13, 48, 0.24)), url("${assetPath("/assets/home/home-bg.png")}")`,
      }}
    >
      <section className="game-details-card">
        <img className="game-details-card__image" src={assetPath(image)} alt="" />
        <div className="game-details-card__content">
          <Link className="game-details-card__back" href="/">
            ← На главную
          </Link>
          <h1>{title}</h1>
          <p className="game-details-card__lead">{description}</p>
          <p>{details}</p>
          <div className="game-details-card__status">Игра скоро будет здесь</div>
        </div>
      </section>
    </main>
  );
}
