"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assetPath } from "@/lib/asset-path";
import { addPlayerDiamonds } from "@/lib/player-storage";

type Vec = { x: number; y: number };
type Task = { fragment: string; answer: "З" | "С"; word: string };
type Diamond = { x: number; y: number; collected: boolean };
type Pickup = { x: number; y: number; collected: boolean };
type Enemy = {
  id: string;
  kind: "slime" | "hedgehog";
  x: number;
  y: number;
  speed: number;
  active: boolean;
};

const WORLD_W = 5550;
const GROUND_Y = 590;
const HERO_W = 108;
const HERO_H = 112;
const MAX_LIVES = 5;
const START_LIVES = 3;
const STORAGE_KEY = "pixelQuest.braveKnight.best";

const TASKS: Task[] = [
  { fragment: "ра_писать", answer: "С", word: "расписать" },
  { fragment: "ра_будить", answer: "З", word: "разбудить" },
  { fragment: "ра_крыть", answer: "С", word: "раскрыть" },
  { fragment: "ра_делить", answer: "З", word: "разделить" },
  { fragment: "ра_сказать", answer: "С", word: "рассказать" },
  { fragment: "бе_вкусный", answer: "З", word: "безвкусный" },
  { fragment: "бе_платный", answer: "С", word: "бесплатный" },
  { fragment: "бе_шумный", answer: "С", word: "бесшумный" },
  { fragment: "бе_звучный", answer: "З", word: "беззвучный" },
  { fragment: "бе_крайний", answer: "С", word: "бескрайний" },
  { fragment: "и_править", answer: "С", word: "исправить" },
  { fragment: "и_менить", answer: "З", word: "изменить" },
  { fragment: "и_пугать", answer: "С", word: "испугать" },
  { fragment: "и_дать", answer: "З", word: "издать" },
  { fragment: "и_ходить", answer: "С", word: "исходить" },
  { fragment: "во_становить", answer: "С", word: "восстановить" },
  { fragment: "во_главить", answer: "З", word: "возглавить" },
  { fragment: "во_кликнуть", answer: "С", word: "воскликнуть" },
  { fragment: "в_бежать", answer: "З", word: "взбежать" },
  { fragment: "в_лететь", answer: "З", word: "взлететь" },
];

function shuffledTasks() {
  const items = [...TASKS];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const SPIKES = [
  { x: 930, w: 96 },
  { x: 2050, w: 96 },
  { x: 3500, w: 96 },
  { x: 4570, w: 96 },
];

// Алмазы специально расставлены реже, чтобы между заданиями был игровой участок.
const INITIAL_DIAMONDS: Diamond[] = [
  { x: 520, y: 430, collected: false },
  { x: 1080, y: 405, collected: false },
  { x: 1640, y: 430, collected: false },
  { x: 2200, y: 400, collected: false },
  { x: 2760, y: 430, collected: false },
  { x: 3320, y: 405, collected: false },
  { x: 3880, y: 430, collected: false },
  { x: 4440, y: 400, collected: false },
  { x: 4900, y: 430, collected: false },
  { x: 5200, y: 405, collected: false },
];

const INITIAL_HEARTS: Pickup[] = [
  { x: 1800, y: 455, collected: false },
  { x: 3650, y: 455, collected: false },
  { x: 4820, y: 455, collected: false },
];

// Враг активируется только когда герой подходит к нему, затем идёт справа налево
// и больше никогда не разворачивается и не телепортируется назад.
const INITIAL_ENEMIES: Enemy[] = [
  { id: "slime-1", kind: "slime", x: 1510, y: 510, speed: 90, active: false },
  { id: "hedgehog-1", kind: "hedgehog", x: 3050, y: 510, speed: 102, active: false },
  { id: "slime-2", kind: "slime", x: 4310, y: 510, speed: 94, active: false },
];

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export default function BraveKnightGame() {
  const router = useRouter();
  const [hero, setHero] = useState<Vec>({ x: 120, y: GROUND_Y - HERO_H });
  const velocity = useRef<Vec>({ x: 0, y: 0 });
  const keys = useRef<Set<string>>(new Set());
  const lastTime = useRef<number | null>(null);
  const damageCooldown = useRef(0);
  const heroXRef = useRef(120);
  const taskLock = useRef(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const [cameraX, setCameraX] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [diamonds, setDiamonds] = useState(INITIAL_DIAMONDS);
  const [heartPickups, setHeartPickups] = useState(INITIAL_HEARTS);
  const [enemies, setEnemies] = useState(INITIAL_ENEMIES);
  const [collected, setCollected] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [taskOrder, setTaskOrder] = useState<Task[]>(() => shuffledTasks());
  const [leaving, setLeaving] = useState(false);
  const [pauseSelection, setPauseSelection] = useState(0);
  const [endSelection, setEndSelection] = useState(0);

  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [taskIndex, setTaskIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<"З" | "С" | null>(null);
  const [keyboardAnswer, setKeyboardAnswer] = useState<"З" | "С">("З");
  const [taskCorrect, setTaskCorrect] = useState<boolean | null>(null);
  const [pendingDiamond, setPendingDiamond] = useState<number | null>(null);

  const [finished, setFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [best, setBest] = useState(0);

  const task = taskIndex === null ? null : taskOrder[taskIndex];

  useEffect(() => {
    router.prefetch("/");
    const saved = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
    if (Number.isFinite(saved)) setBest(saved);
  }, []);

  useEffect(() => {
    const music = new Audio(
      assetPath("/assets/games/brave-knight/castle-pathways.mp3"),
    );
    music.loop = true;
    music.volume = 0.12;
    musicRef.current = music;

    const startMusic = () => {
      if (!soundOn || finished || gameOver) return;
      if (paused && !task) return;
      music.play().catch(() => undefined);
    };

    window.addEventListener("pointerdown", startMusic, { once: true });
    window.addEventListener("keydown", startMusic, { once: true });

    return () => {
      window.removeEventListener("pointerdown", startMusic);
      window.removeEventListener("keydown", startMusic);

      music.pause();
      music.currentTime = 0;
      musicRef.current = null;

    };
  }, []);

  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;

    // Основная музыка играет во время уровня, заданий и на победном экране.
    // Она останавливается только при обычной паузе, поражении или выключенном звуке.
    const backgroundMusicShouldPlay =
      soundOn && !gameOver && (finished || !paused || Boolean(task));

    if (backgroundMusicShouldPlay) {
      music.volume = 0.12;
      music.play().catch(() => undefined);
    } else {
      music.pause();
    }
  }, [soundOn, paused, finished, gameOver, task]);

  const playTone = useCallback(
    (frequency: number, duration = 0.08) => {
      if (!soundOn) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = frequency;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
        osc.addEventListener("ended", () => ctx.close());
      } catch {
        // Звук не влияет на механику игры.
      }
    },
    [soundOn],
  );

  const resetGame = useCallback(() => {
    setHero({ x: 120, y: GROUND_Y - HERO_H });
    heroXRef.current = 120;
    velocity.current = { x: 0, y: 0 };
    keys.current.clear();
    taskLock.current = false;
    setCameraX(0);
    setLives(START_LIVES);
    setDiamonds(INITIAL_DIAMONDS.map((item) => ({ ...item })));
    setHeartPickups(INITIAL_HEARTS.map((item) => ({ ...item })));
    setEnemies(INITIAL_ENEMIES.map((item) => ({ ...item })));
    setCollected(0);
    setCorrectAnswers(0);
    setTaskOrder(shuffledTasks());
    setLeaving(false);
    setPauseSelection(0);
    setEndSelection(0);
    setPaused(false);
    setTaskIndex(null);
    setSelectedAnswer(null);
    setKeyboardAnswer("З");
    setTaskCorrect(null);
    setPendingDiamond(null);
    setFinished(false);
    setGameOver(false);


    damageCooldown.current = 0;
    lastTime.current = null;
  }, []);

  const loseLife = useCallback(() => {
    if (damageCooldown.current > 0 || finished || gameOver) return;

    damageCooldown.current = 1.25;
    playTone(120, 0.15);

    setLives((current) => {
      const next = current - 1;
      if (next <= 0) {
        setGameOver(true);
        setPaused(true);
        return 0;
      }
      return next;
    });

    setHero((current) => ({
      x: Math.max(120, current.x - 260),
      y: GROUND_Y - HERO_H,
    }));
    velocity.current = { x: 0, y: 0 };
  }, [finished, gameOver, playTone]);

  const completeGame = useCallback(() => {
    setFinished(true);
    setPaused(true);
    playTone(660, 0.18);

    setBest((oldBest) => {
      const nextBest = Math.max(oldBest, collected);
      localStorage.setItem(STORAGE_KEY, String(nextBest));
      return nextBest;
    });
  }, [collected, playTone]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (paused || task || finished || gameOver) {
      lastTime.current = null;
      return;
    }

    let frame = 0;

    const loop = (time: number) => {
      if (lastTime.current === null) lastTime.current = time;
      const dt = Math.min((time - lastTime.current) / 1000, 0.032);
      lastTime.current = time;

      if (damageCooldown.current > 0) {
        damageCooldown.current = Math.max(0, damageCooldown.current - dt);
      }

      setEnemies((current) =>
        current.map((enemy) => {
          const activationDistance = Math.max(window.innerWidth, 1000) * 0.78;
          const shouldActivate =
            enemy.active || enemy.x <= heroXRef.current + activationDistance;

          if (!shouldActivate) return enemy;

          return {
            ...enemy,
            active: true,
            x: enemy.x - enemy.speed * dt,
          };
        }),
      );

      setHero((currentHero) => {
        let { x, y } = currentHero;
        const vel = velocity.current;

        const left = keys.current.has("ArrowLeft") || keys.current.has("KeyA");
        const right = keys.current.has("ArrowRight") || keys.current.has("KeyD");
        const wantsJump =
          keys.current.has("ArrowUp") ||
          keys.current.has("Space") ||
          keys.current.has("KeyW");

        const grounded = y >= GROUND_Y - HERO_H - 1;
        const targetSpeed = left ? -320 : right ? 320 : 0;
        vel.x += (targetSpeed - vel.x) * Math.min(1, dt * 13);

        if (wantsJump && grounded) {
          // Прыжок специально сделан выше и длиннее, чем в V1:
          // шипы и врагов теперь можно уверенно перепрыгнуть.
          vel.y = -820;
          playTone(300, 0.05);
          keys.current.delete("ArrowUp");
          keys.current.delete("Space");
          keys.current.delete("KeyW");
        }

        vel.y += 1350 * dt;
        x += vel.x * dt;
        y += vel.y * dt;

        x = Math.max(0, Math.min(WORLD_W - HERO_W, x));
        heroXRef.current = x;

        if (y >= GROUND_Y - HERO_H) {
          y = GROUND_Y - HERO_H;
          vel.y = 0;
        }

        // Узкая зона героя: визуальные края меча/щита не считаются столкновением.
        const heroRect = {
          x: x + 30,
          y: y + 18,
          w: HERO_W - 60,
          h: HERO_H - 24,
        };

        for (const spike of SPIKES) {
          // Шипы опасны только у самой земли. Если герой уже поднялся в прыжке,
          // визуальный край картинки не должен отнимать жизнь.
          const hitW = spike.w * 0.42;
          const spikeRect = {
            x: spike.x + (spike.w - hitW) / 2,
            y: GROUND_Y - 20,
            w: hitW,
            h: 20,
          };
          const feetNearGround = y + HERO_H > GROUND_Y - 12;
          if (feetNearGround && rectsOverlap(heroRect, spikeRect)) {
            queueMicrotask(loseLife);
            break;
          }
        }

        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const enemyRect =
            enemy.kind === "slime"
              ? { x: enemy.x + 24, y: enemy.y + 20, w: 72, h: 52 }
              : { x: enemy.x + 24, y: enemy.y + 22, w: 78, h: 52 };
          if (rectsOverlap(heroRect, enemyRect)) {
            queueMicrotask(loseLife);
            break;
          }
        }

        for (let index = 0; index < diamonds.length; index += 1) {
          const diamond = diamonds[index];
          if (diamond.collected || taskLock.current) continue;
          const gemRect = { x: diamond.x, y: diamond.y, w: 72, h: 60 };
          if (rectsOverlap(heroRect, gemRect)) {
            taskLock.current = true;
            queueMicrotask(() => {
              setDiamonds((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, collected: true } : item,
                ),
              );
              setPendingDiamond(index);
              setTaskIndex(index);
              setSelectedAnswer(null);
              setKeyboardAnswer("З");
              setTaskCorrect(null);
              setPaused(true);
              playTone(520, 0.08);
            });
            break;
          }
        }

        for (let index = 0; index < heartPickups.length; index += 1) {
          const heart = heartPickups[index];
          if (heart.collected) continue;
          const heartRect = { x: heart.x, y: heart.y, w: 66, h: 56 };
          if (rectsOverlap(heroRect, heartRect)) {
            queueMicrotask(() => {
              setHeartPickups((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, collected: true } : item,
                ),
              );
              setLives((current) => Math.min(MAX_LIVES, current + 1));
              playTone(740, 0.07);
            });
            break;
          }
        }

        if (x > 5350) {
          queueMicrotask(completeGame);
        }

        return { x, y };
      });

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [
    paused,
    task,
    finished,
    gameOver,
    diamonds,
    heartPickups,
    enemies,
    loseLife,
    completeGame,
    playTone,
  ]);

  useEffect(() => {
    const viewport = Math.max(900, window.innerWidth);
    const next = Math.max(0, Math.min(WORLD_W - viewport, hero.x - viewport * 0.3));
    setCameraX(next);
  }, [hero.x]);

  useEffect(() => {
    if (!task) return;

    const onTaskKeyDown = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        setKeyboardAnswer("З");
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        setKeyboardAnswer("С");
        return;
      }

      if (event.code === "Enter") {
        event.preventDefault();

        if (selectedAnswer) {
          understandTask();
        } else {
          answerTask(keyboardAnswer);
        }
      }
    };

    window.addEventListener("keydown", onTaskKeyDown);
    return () => window.removeEventListener("keydown", onTaskKeyDown);
  }, [task, selectedAnswer, keyboardAnswer]);

  useEffect(() => {
    if (task) return;

    const onMenuKeyDown = (event: KeyboardEvent) => {
      const move = (current: number, max: number, direction: number) =>
        (current + direction + max) % max;

      if (paused && !finished && !gameOver) {
        if (event.code === "ArrowUp" || event.code === "ArrowLeft") {
          event.preventDefault();
          setPauseSelection((value) => move(value, 3, -1));
          return;
        }
        if (event.code === "ArrowDown" || event.code === "ArrowRight") {
          event.preventDefault();
          setPauseSelection((value) => move(value, 3, 1));
          return;
        }
        if (event.code === "Enter") {
          event.preventDefault();
          if (pauseSelection === 0) setPaused(false);
          if (pauseSelection === 1) resetGame();
          if (pauseSelection === 2) goToGames();
        }
        return;
      }

      if (finished || gameOver) {
        if (event.code === "ArrowUp" || event.code === "ArrowLeft") {
          event.preventDefault();
          setEndSelection((value) => move(value, 2, -1));
          return;
        }
        if (event.code === "ArrowDown" || event.code === "ArrowRight") {
          event.preventDefault();
          setEndSelection((value) => move(value, 2, 1));
          return;
        }
        if (event.code === "Enter") {
          event.preventDefault();
          if (endSelection === 0) resetGame();
          if (endSelection === 1) goToGames();
        }
      }
    };

    window.addEventListener("keydown", onMenuKeyDown);
    return () => window.removeEventListener("keydown", onMenuKeyDown);
  }, [task, paused, finished, gameOver, pauseSelection, endSelection, resetGame]);

  const answerTask = (letter: "З" | "С") => {
    if (!task || selectedAnswer) return;
    setSelectedAnswer(letter);
    const correct = letter === task.answer;
    setTaskCorrect(correct);
    if (correct) {
      setCorrectAnswers((value) => value + 1);
      playTone(690, 0.1);
    } else {
      playTone(170, 0.12);
    }
  };

  const understandTask = () => {
    if (pendingDiamond !== null) {
      setCollected((value) => value + 1);
      addPlayerDiamonds(1);
    }
    setTaskIndex(null);
    setSelectedAnswer(null);
    setKeyboardAnswer("З");
    setTaskCorrect(null);
    setPendingDiamond(null);
    setPaused(false);
    taskLock.current = false;
    lastTime.current = null;
  };

  const lifeSlots = useMemo(
    () => Array.from({ length: MAX_LIVES }, (_, index) => index < lives),
    [lives],
  );

  const goToGames = () => {
    if (leaving) return;
    setLeaving(true);
    setPaused(true);
    window.setTimeout(() => router.push("/"), 170);
  };

  return (
    <main className={`brave-game${leaving ? " brave-game--leaving" : ""}`}>
      <div className="brave-game__viewport">
        <div
          className="brave-game__background"
          style={{
            backgroundImage: `url(${assetPath(
              "/assets/games/brave-knight/background.png",
            )})`,
            backgroundPositionX: `${-cameraX * 0.1}px`,
          }}
        />

        <div
          className="brave-game__world"
          style={{ transform: `translate3d(${-cameraX}px, 0, 0)` }}
        >
          <div className="brave-game__ground" />

          <img
            className="brave-game__start-sign"
            src={assetPath("/assets/games/brave-knight/start-sign.png")}
            alt="Старт"
          />

          {SPIKES.map((spike, index) => (
            <img
              key={`spike-${index}`}
              className="brave-game__spikes"
              src={assetPath("/assets/games/brave-knight/spikes.png")}
              alt=""
              style={{ left: spike.x, width: spike.w }}
            />
          ))}

          {diamonds.map(
            (diamond, index) =>
              !diamond.collected && (
                <img
                  key={`diamond-${index}`}
                  className="brave-game__diamond"
                  src={assetPath("/assets/games/brave-knight/diamond.png")}
                  alt="Алмаз"
                  style={{ left: diamond.x, top: diamond.y }}
                />
              ),
          )}

          {heartPickups.map(
            (heart, index) =>
              !heart.collected && (
                <img
                  key={`heart-${index}`}
                  className="brave-game__heart-pickup"
                  src={assetPath("/assets/games/brave-knight/heart-full.png")}
                  alt="Сердце"
                  style={{ left: heart.x, top: heart.y }}
                />
              ),
          )}

          {enemies.map((enemy) => (
            <img
              key={enemy.id}
              className={`brave-game__enemy brave-game__enemy--${enemy.kind}`}
              src={assetPath(
                enemy.kind === "slime"
                  ? "/assets/games/brave-knight/enemy-slime.png"
                  : "/assets/games/brave-knight/enemy-hedgehog.png",
              )}
              alt=""
              style={{ left: enemy.x, top: enemy.y }}
            />
          ))}

          <img
            className="brave-game__castle"
            src={assetPath("/assets/games/brave-knight/castle.png")}
            alt="Замок"
          />

          <img
            className={`brave-game__hero ${
              damageCooldown.current > 0 ? "brave-game__hero--hurt" : ""
            }`}
            src={assetPath("/assets/games/brave-knight/hero.png")}
            alt="Храбрый рыцарь"
            style={{ left: hero.x, top: hero.y }}
          />
        </div>

        <section className="brave-game__hud" aria-label="Панель игры">
          <div className="brave-game__lives" aria-label={`Жизни: ${lives}`}>
            {lifeSlots.map((full, index) => (
              <img
                key={index}
                src={assetPath(
                  full
                    ? "/assets/games/brave-knight/heart-full.png"
                    : "/assets/games/brave-knight/heart-empty.png",
                )}
                alt=""
              />
            ))}
          </div>

          <div className="brave-game__score">
            <img src={assetPath("/assets/games/brave-knight/diamond.png")} alt="" />
            <strong>{collected}/10</strong>
          </div>

          <div className="brave-game__controls">
            <button
              type="button"
              className="brave-game__icon-button"
              onClick={goToGames}
              aria-label="На главную"
              data-tooltip="На главную"
            >
              <img
                src={assetPath("/assets/games/brave-knight/ui-home.png")}
                alt=""
              />
            </button>

            <button
              type="button"
              className="brave-game__icon-button"
              onClick={() => setSoundOn((value) => !value)}
              aria-label={soundOn ? "Выключить звук" : "Включить звук"}
              data-tooltip={soundOn ? "Выключить звук" : "Включить звук"}
            >
              <img
                src={assetPath(
                  soundOn
                    ? "/assets/games/brave-knight/ui-sound-on.png"
                    : "/assets/games/brave-knight/ui-sound-off.png",
                )}
                alt=""
              />
            </button>

            <button
              type="button"
              className="brave-game__icon-button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? "Продолжить" : "Пауза"}
              data-tooltip={paused ? "Продолжить" : "Пауза"}
              disabled={Boolean(task) || finished || gameOver}
            >
              <img
                src={assetPath(
                  paused
                    ? "/assets/games/brave-knight/ui-play.png"
                    : "/assets/games/brave-knight/ui-pause.png",
                )}
                alt=""
              />
            </button>
          </div>
        </section>

        <div className="brave-game__hint">
          <span>← → движение</span>
          <span>Пробел прыжок</span>
        </div>

        {paused && !task && !finished && !gameOver && (
          <div className="brave-game__overlay">
            <section className="brave-game__pause-card">
              <h2>Пауза</h2>
              <button
                type="button"
                className={pauseSelection === 0 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                onMouseEnter={() => setPauseSelection(0)}
                onClick={() => setPaused(false)}
              >
                Продолжить
              </button>
              <button
                type="button"
                className={pauseSelection === 1 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                onMouseEnter={() => setPauseSelection(1)}
                onClick={resetGame}
              >
                Начать сначала
              </button>
              <button
                type="button"
                className={pauseSelection === 2 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                onMouseEnter={() => setPauseSelection(2)}
                onClick={goToGames}
              >
                К списку игр
              </button>
            </section>
          </div>
        )}

        {task && (
          <div className="brave-game__overlay brave-game__overlay--task">
            <section
              className="brave-task"
              style={{
                backgroundImage: `url(${assetPath(
                  "/assets/games/brave-knight/task-panel.png",
                )})`,
              }}
            >
              <p className="brave-task__eyebrow">З / С на конце приставок</p>
              <h2>{task.fragment}</h2>

              {!selectedAnswer ? (
                <>
                  <p className="brave-task__instruction">Вставь пропущенную букву.</p>
                  <div className="brave-task__answers">
                    {(["З", "С"] as const).map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        className={keyboardAnswer === letter ? "brave-task__answer brave-task__answer--selected" : "brave-task__answer"}
                        onMouseEnter={() => setKeyboardAnswer(letter)}
                        onClick={() => answerTask(letter)}
                        style={{
                          backgroundImage: `url(${assetPath(
                            "/assets/games/brave-knight/task-button.png",
                          )})`,
                        }}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="brave-task__result">
                  <strong
                    className={
                      taskCorrect
                        ? "brave-task__status brave-task__status--correct"
                        : "brave-task__status brave-task__status--wrong"
                    }
                  >
                    {taskCorrect ? "Верно!" : "Неверно"}
                  </strong>
                  <p>
                    Правильный ответ:
                    <b>{task.word}</b>
                  </p>
                  <button
                    type="button"
                    className="brave-task__continue brave-task__continue--selected"
                    onClick={understandTask}
                    style={{
                      backgroundImage: `url(${assetPath(
                        "/assets/games/brave-knight/task-continue.png",
                      )})`,
                    }}
                  >
                    Понятно
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {gameOver && (
          <div className="brave-game__overlay">
            <section className="brave-game__end-card">
              <h2>Жизни закончились</h2>
              <p>Собрано алмазов: {collected}/10</p>
              <button
                type="button"
                className={endSelection === 0 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                onMouseEnter={() => setEndSelection(0)}
                onClick={resetGame}
              >
                Попробовать ещё раз
              </button>
              <button
                type="button"
                className={endSelection === 1 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                onMouseEnter={() => setEndSelection(1)}
                onClick={goToGames}
              >
                К списку игр
              </button>
            </section>
          </div>
        )}

        {finished && (
          <div className="brave-game__overlay">
            <section className="brave-game__end-card brave-game__end-card--win">
              <span className="brave-game__end-gem">◆</span>
              <h2>Приключение завершено!</h2>
              <p>
                Собрано алмазов: <b>{collected}/10</b>
              </p>
              <p>
                Правильных ответов: <b>{correctAnswers}/10</b>
              </p>
              <p className="brave-game__best">
                Лучший результат: {Math.max(best, collected)}/10
              </p>
              {collected > best && <strong>Новый рекорд!</strong>}
              <div className="brave-game__end-actions">
                <button
                  type="button"
                  className={endSelection === 0 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                  onMouseEnter={() => setEndSelection(0)}
                  onClick={resetGame}
                >
                  Сыграть ещё раз
                </button>
                <button
                  type="button"
                  className={endSelection === 1 ? "brave-menu-button brave-menu-button--selected" : "brave-menu-button"}
                  onMouseEnter={() => setEndSelection(1)}
                  onClick={goToGames}
                >
                  К списку игр
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {leaving && (
        <div
          className="brave-nav-cover brave-nav-cover--visible"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(6, 22, 74, 0.04), rgba(5, 14, 50, 0.12)), url("${assetPath("/assets/home/home-bg.png")}")`,
          }}
          aria-hidden="true"
        />
      )}
    </main>
  );
}
