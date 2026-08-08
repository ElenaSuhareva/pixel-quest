"use client";

import Header from "@/components/layout/Header";
import GameCard from "@/components/games/GameCard";
import { games } from "@/data/games";

type HomeScreenProps = {
  name: string;
  diamonds: number;
};

export default function HomeScreen({ name, diamonds }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <Header name={name} diamonds={diamonds} />

      <div className="home-content">
        <section className="home-welcome" aria-labelledby="home-welcome-title">
          <h1 id="home-welcome-title" className="sr-only">
            Добро пожаловать, юный герой!
          </h1>
          <img
            className="home-welcome__banner"
            src="/assets/home/welcome-banner.png"
            alt="Добро пожаловать, юный герой!"
          />
          <div className="home-welcome__subtitle">
            <div className="home-welcome__name">
              <span aria-hidden="true">✦</span>
              <strong>{name}</strong>
              <span aria-hidden="true">✦</span>
            </div>

            <div className="home-welcome__text">
              Выбери игру и начни своё приключение!
            </div>
          </div>
        </section>

        <section className="games-grid" aria-label="Игры">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </section>
      </div>
    </main>
  );
}
