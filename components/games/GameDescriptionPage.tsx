"use client";

import Link from "next/link";

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
    <main className="game-details-screen">
      <section className="game-details-card">
        <img className="game-details-card__image" src={image} alt="" />
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
