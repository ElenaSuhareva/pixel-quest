"use client";

import { useEffect, useState } from "react";
import { createPlayer, getPlayer } from "@/lib/player-storage";
import HomeScreen from "@/components/home/HomeScreen";

type PlayerView = {
  name: string;
  diamonds: number;
};

export default function WelcomeScreen() {
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<PlayerView | null>(null);

  useEffect(() => {
    const savedPlayer = getPlayer();

    if (savedPlayer) {
      setPlayer({
        name: savedPlayer.name,
        diamonds: savedPlayer.diamonds ?? 0
      });
    }
  }, []);

  function handleStart() {
    const clickSound = new Audio("/assets/sounds/button-click.wav");
    clickSound.volume = 0.45;
    clickSound.play();

    const cleanName = name.trim();

    if (!cleanName) {
      return;
    }

    const newPlayer = createPlayer(cleanName);

    setPlayer({
      name: newPlayer.name,
      diamonds: newPlayer.diamonds ?? 0
    });
  }

  if (player) {
    return (
      <HomeScreen
        name={player.name}
        diamonds={player.diamonds}
      />
    );
  }

  return (
    <main className="welcome-screen">
      <section className="welcome-panel">
        <img
          className="welcome-logo-image"
          src="/assets/brand/welcome-logo.png"
          alt="Pixel Quest"
        />

        <h1>
          Добро пожаловать,
          <br />
          герой!
        </h1>

        <p>Как тебя зовут?</p>

        <div className="welcome-input-frame">
          <input
            className="welcome-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleStart();
              }
            }}
            placeholder="Имя ученика"
            maxLength={20}
          />
        </div>

        <button
          className="welcome-button-image"
          type="button"
          onClick={handleStart}
          aria-label="Начать приключения"
        >
          <img
            src="/assets/ui/welcome-button.png"
            alt="Начать приключения"
          />
        </button>
      </section>
    </main>
  );
}
