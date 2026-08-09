
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assetPath } from "@/lib/asset-path";
import { addPlayerDiamonds } from "@/lib/player-storage";
import "./game.css";

type Cell = "X" | "O" | "";
type Result = "correct" | "wrong" | null;
type Winner = "X" | "O" | "draw" | null;

type Question = {
  text: string;
  answers: string[];
  correct: string;
};

const QUESTIONS: Question[] = [
  { text: "Ты пиш_шь письмо.", answers: ["е", "и", "я"], correct: "е" },
  { text: "Вы смотр_те фильм.", answers: ["и", "е", "я"], correct: "и" },
  { text: "Он стро_т дом.", answers: ["и", "е", "я"], correct: "и" },
  { text: "Мы игра_м во дворе.", answers: ["е", "и", "я"], correct: "е" },
  { text: "Ты вид_шь ошибку.", answers: ["и", "е", "я"], correct: "и" },
  { text: "Они чита_т книгу.", answers: ["ют", "ят", "ет"], correct: "ют" },
  { text: "Мы кле_м аппликацию.", answers: ["и", "е", "я"], correct: "и" },
  { text: "Он рису_т замок.", answers: ["ет", "ит", "ют"], correct: "ет" },
  { text: "Ты гуля_шь в парке.", answers: ["е", "и", "я"], correct: "е" },
  { text: "Они слыш_т музыку.", answers: ["ат", "ят", "ют"], correct: "ат" },
  { text: "Вы дыш_те глубоко.", answers: ["и", "е", "я"], correct: "и" },
  { text: "Мы реша_м задачу.", answers: ["е", "и", "я"], correct: "е" },
];

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Cell[]): Winner {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as "X" | "O";
    }
  }

  if (board.every(Boolean)) return "draw";
  return null;
}

function randomQuestion() {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

export default function Page() {
  const router = useRouter();
  const monsterTimer = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(""));
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [diamonds, setDiamonds] = useState(0);
  const [winner, setWinner] = useState<Winner>(null);
  const [monsterThinking, setMonsterThinking] = useState(false);
  const [monsterTarget, setMonsterTarget] = useState<number | null>(null);
  const [lastMonsterCell, setLastMonsterCell] = useState<number | null>(null);
  const [status, setStatus] = useState("Твой ход: выбери клетку");
  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    return () => {
      if (monsterTimer.current !== null) window.clearTimeout(monsterTimer.current);
      if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    };
  }, []);


  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;

    audio.volume = 0.22;

    if (soundOn && !paused) {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [soundOn, paused]);

  const ensureMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio || !soundOn || paused) return;
    audio.volume = 0.22;
    audio.play().catch(() => undefined);
  }, [soundOn, paused]);

  const clickSound = useCallback(() => {
    if (!soundOn) return;

    const music = musicRef.current;
    if (music && !paused) {
      music.volume = 0.22;
      music.play().catch(() => undefined);
    }

    const audio = new Audio(assetPath("/assets/sounds/button-click.wav"));
    audio.volume = 0.2;
    audio.play().catch(() => undefined);
  }, [soundOn, paused]);

  const restart = useCallback(() => {
    clickSound();

    if (monsterTimer.current !== null) {
      window.clearTimeout(monsterTimer.current);
      monsterTimer.current = null;
    }
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }

    setBoard(Array(9).fill(""));
    setActiveCell(null);
    setQuestion(null);
    setResult(null);
    setDiamonds(0);
    setWinner(null);
    setMonsterThinking(false);
    setMonsterTarget(null);
    setLastMonsterCell(null);
    setPaused(false);
    setStatus("Твой ход: выбери клетку");
  }, [clickSound]);

  const makeMonsterMove = useCallback((playerBoard: Cell[]) => {
    const free = playerBoard
      .map((cell, index) => (cell === "" ? index : -1))
      .filter((index) => index >= 0);

    if (!free.length) {
      setWinner("draw");
      setStatus("Ничья");
      return;
    }

    const target = free[Math.floor(Math.random() * free.length)];

    // Phase 1: the monster is visibly thinking.
    setMonsterThinking(true);
    setMonsterTarget(null);
    setLastMonsterCell(null);
    setStatus("Монстр думает...");

    monsterTimer.current = window.setTimeout(() => {
      // Phase 2: briefly highlight the chosen cell before the O appears.
      setMonsterTarget(target);
      setStatus("Монстр выбрал клетку...");

      revealTimer.current = window.setTimeout(() => {
        const afterMonster = [...playerBoard];
        afterMonster[target] = "O";

        setBoard(afterMonster);
        setLastMonsterCell(target);
        setMonsterTarget(null);
        setMonsterThinking(false);

        const monsterWinner = checkWinner(afterMonster);

        if (monsterWinner) {
          setWinner(monsterWinner);
          setStatus(
            monsterWinner === "O"
              ? "Монстр победил"
              : monsterWinner === "draw"
                ? "Ничья"
                : "Ты победил монстра!"
          );
        } else {
          setStatus("Твой ход: выбери клетку");
        }
      }, 500);
    }, 850);
  }, []);

  function chooseCell(index: number) {
    if (
      board[index] ||
      winner ||
      paused ||
      monsterThinking ||
      question ||
      result
    ) return;

    clickSound();
    ensureMusic();
    setActiveCell(index);
    setQuestion(randomQuestion());
    setStatus("Ответь на задание");
  }

  function answer(value: string) {
    if (activeCell === null || !question || result) return;

    clickSound();
    setResult(value === question.correct ? "correct" : "wrong");
  }

  function continueAfterAnswer() {
    if (activeCell === null || !question || !result) return;

    clickSound();

    const nextBoard = [...board];
    nextBoard[activeCell] = "X";
    setBoard(nextBoard);

    if (result === "correct") {
      setDiamonds((value) => value + 1);
      addPlayerDiamonds(1);
    }

    setQuestion(null);
    setResult(null);
    setActiveCell(null);

    const playerWinner = checkWinner(nextBoard);

    if (playerWinner) {
      setWinner(playerWinner);
      setStatus(
        playerWinner === "X"
          ? "Ты победил монстра!"
          : playerWinner === "draw"
            ? "Ничья"
            : "Монстр победил"
      );
      return;
    }

    makeMonsterMove(nextBoard);
  }

  return (
    <main
      className="monster-game"
      style={{
        backgroundImage: `linear-gradient(rgba(3,8,24,.10),rgba(3,8,24,.22)),url("${assetPath("/assets/games/cave-adventure/cave-background.png")}")`,
      }}
    >
      <audio
        ref={musicRef}
        src={assetPath("/assets/games/cave-adventure/crystal-tic-tac-cave.mp3")}
        loop
        preload="auto"
      />

      <div className="monster-game__topbar">
        <div className="monster-game__panelAsset monster-game__panelAsset--player">
          <img
            src={assetPath("/assets/games/cave-adventure/player-panel.png")}
            alt="Ты"
          />
        </div>

        <div className="monster-game__titleAsset">
          <img
            src={assetPath("/assets/games/cave-adventure/title-panel.png")}
            alt="Победи монстра"
          />
          <span>Окончания глаголов</span>
        </div>

        <div className="monster-game__panelAsset monster-game__panelAsset--monster">
          <img
            src={assetPath("/assets/games/cave-adventure/monster-panel.png")}
            alt="Монстр"
          />
        </div>
      </div>

      <div className="monster-game__diamonds">
        <img src={assetPath("/assets/common-ui/diamond.png")} alt="" />
        <strong>{diamonds}</strong>
      </div>

      <div className="monster-game__controls">
        <button
          type="button"
          onClick={() => {
            clickSound();
            setSoundOn((value) => !value);
          }}
          title={soundOn ? "Выключить звук" : "Включить звук"}
        >
          <img
            src={assetPath(
              soundOn
                ? "/assets/common-ui/ui-sound-on.png"
                : "/assets/common-ui/ui-sound-off.png"
            )}
            alt=""
          />
        </button>

        <button
          type="button"
          onClick={() => {
            clickSound();
            setPaused((value) => !value);
          }}
          title={paused ? "Продолжить" : "Пауза"}
        >
          <img
            src={assetPath(
              paused
                ? "/assets/common-ui/ui-play.png"
                : "/assets/common-ui/ui-pause.png"
            )}
            alt=""
          />
        </button>

        <button type="button" onClick={() => router.push("/")} title="На главную">
          <img src={assetPath("/assets/common-ui/ui-home.png")} alt="" />
        </button>
      </div>

      <div className="monster-game__scene">
        <div className="monster-game__left">
          <div className="tip-card">
            <strong>Как победить?</strong>
            <p>Собери три своих знака в ряд.</p>
            <p>Верный ответ даёт +1 алмаз.</p>
          </div>

          <img
            className="monster-game__hero"
            src={assetPath("/assets/games/cave-adventure/hero.png")}
            alt="Герой"
          />
        </div>

        <section className="tic-board" aria-label="Поле крестики-нолики">
          {board.map((cell, index) => (
            <button
              key={index}
              type="button"
              className={[
                "tic-cell",
                cell ? "is-filled" : "",
                monsterTarget === index ? "is-monster-target" : "",
                lastMonsterCell === index ? "is-monster-new" : "",
              ].join(" ")}
              onClick={() => chooseCell(index)}
              disabled={
                Boolean(cell) ||
                Boolean(winner) ||
                paused ||
                monsterThinking
              }
              aria-label={`Клетка ${index + 1}`}
            >
              {monsterTarget === index && cell === "" && (
                <span className="monster-target-pulse" aria-hidden="true" />
              )}

              {cell === "X" && (
                <img
                  className="tic-cell__mark tic-cell__mark--x"
                  src={assetPath("/assets/games/cave-adventure/o-mark.png")}
                  alt="Твой знак"
                />
              )}

              {cell === "O" && (
                <img
                  className="tic-cell__mark tic-cell__mark--o"
                  src={assetPath("/assets/games/cave-adventure/monster-ring.png")}
                  alt="Знак монстра"
                />
              )}
            </button>
          ))}
        </section>

        <div className={`monster-game__right ${monsterThinking ? "is-thinking" : ""}`}>
          <div className="monster-thoughts" aria-hidden={!monsterThinking}>
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>

          <img
            className="monster-game__monster"
            src={assetPath("/assets/games/cave-adventure/monster.png")}
            alt="Монстр"
          />

          <div className="monster-card">
            <strong>
              {monsterThinking
                ? monsterTarget === null
                  ? "Монстр думает..."
                  : "Монстр выбрал клетку!"
                : "Монстр ждёт"}
            </strong>
          </div>
        </div>
      </div>

      <div className={`turn-status ${monsterThinking ? "turn-status--monster" : ""}`}>
        {status}
      </div>

      {question && !result && (
        <div className="game-overlay">
          <section className="question-card">
            <div className="question-card__eyebrow">Окончания глаголов</div>
            <h2>{question.text}</h2>

            <div className="question-card__answers">
              {question.answers.map((option) => (
                <button key={option} type="button" onClick={() => answer(option)}>
                  {option}
                </button>
              ))}
            </div>

            <button
              className="question-card__cancel"
              type="button"
              onClick={() => {
                clickSound();
                setQuestion(null);
                setActiveCell(null);
                setStatus("Твой ход: выбери клетку");
              }}
            >
              Закрыть
            </button>
          </section>
        </div>
      )}

      {result && (
        <div className="game-overlay">
          <section className={`result-card result-card--${result}`}>
            <div className="result-card__icon">
              {result === "correct" ? "✓" : "×"}
            </div>

            <h2>{result === "correct" ? "Верно!" : "Ошибка"}</h2>

            <p>
              {result === "correct"
                ? "Клетка станет твоей. Ты получаешь +1 алмаз."
                : "Клетка всё равно станет твоей, но без алмаза."}
            </p>

            <button type="button" onClick={continueAfterAnswer}>
              Дальше
            </button>
          </section>
        </div>
      )}

      {paused && !winner && (
        <div className="game-overlay">
          <section className="pause-card">
            <h2>Пауза</h2>

            <div>
              <button type="button" onClick={() => setPaused(false)}>
                Продолжить
              </button>
              <button type="button" onClick={restart}>
                Начать сначала
              </button>
              <button type="button" onClick={() => router.push("/")}>
                На главную
              </button>
            </div>
          </section>
        </div>
      )}

      {winner && (
        <div className="game-overlay">
          <section className={`final-card final-card--${winner}`}>
            <h2>
              {winner === "X" && "Ты победил монстра!"}
              {winner === "O" && "Монстр победил"}
              {winner === "draw" && "Ничья"}
            </h2>

            <p>
              {winner === "X" && "Три знака в ряд собраны. Отличная победа!"}
              {winner === "O" &&
                "Монстр собрал три знака первым. Попробуй ещё раз."}
              {winner === "draw" && "Поле заполнено. Победителя нет."}
            </p>

            <div className="final-card__diamonds">
              <img src={assetPath("/assets/common-ui/diamond.png")} alt="" />
              <span>
                Алмазов за игру: <strong>{diamonds}</strong>
              </span>
            </div>

            <div className="final-card__buttons">
              <button type="button" onClick={restart}>
                Играть снова
              </button>
              <button type="button" onClick={() => router.push("/")}>
                На главную
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
