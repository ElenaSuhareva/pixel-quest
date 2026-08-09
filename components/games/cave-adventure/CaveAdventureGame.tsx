"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assetPath } from "@/lib/asset-path";
import { addPlayerDiamonds } from "@/lib/player-storage";

type Question = {
  prompt: string;
  options: [string, string, string];
  correctIndex: number;
  hint: string;
};

type CellValue = "player" | "monster" | null;
type ResultKind = "correct" | "wrong";
type Winner = "player" | "monster" | "draw" | null;

type FeedbackState = {
  kind: ResultKind;
  selectedIndex: number;
  question: Question;
};

const QUESTIONS: Question[] = [
  {
    prompt: "Выбери словарное слово с непроверяемой гласной.",
    options: ["вода", "ребята", "праздник"],
    correctIndex: 1,
    hint: "Проверь, можно ли подобрать проверочное слово.",
  },
  {
    prompt: "Где слово с приставкой ПРИ- в значении приближения?",
    options: ["пригород", "приехать", "прекрасный"],
    correctIndex: 1,
    hint: "Подумай о значении: приблизиться к чему-то.",
  },
  {
    prompt: "Выбери слово с окончанием -И.",
    options: ["в тетрад_", "к стен_", "на полян_"],
    correctIndex: 0,
    hint: "Слово должно получиться в форме: в тетради.",
  },
  {
    prompt: "В каком слове нужна приставка ПРЕ-?",
    options: ["пр_красный", "пр_нести", "пр_бежать"],
    correctIndex: 0,
    hint: "ПРЕ- можно заменить словом очень.",
  },
  {
    prompt: "Выбери слово, где пишется буква И после Ц.",
    options: ["ц_рк", "ц_ган", "ц_фра"],
    correctIndex: 2,
    hint: "В большинстве слов после Ц пишется И.",
  },
  {
    prompt: "В каком слове безударную гласную можно проверить словом дом?",
    options: ["д_ма", "тр_ва", "г_ра"],
    correctIndex: 0,
    hint: "Проверочное слово должно быть однокоренным.",
  },
  {
    prompt: "Выбери существительное.",
    options: ["зелёный", "лететь", "дружба"],
    correctIndex: 2,
    hint: "Существительное отвечает на вопрос кто? что?",
  },
  {
    prompt: "В каком слове на конце приставки пишется С?",
    options: ["бе_вкусный", "ра_будить", "во_петь"],
    correctIndex: 0,
    hint: "Перед глухим согласным пишется С.",
  },
  {
    prompt: "Где слово с разделительным Ь?",
    options: ["сем_я", "птич_ка", "ноч_ка"],
    correctIndex: 0,
    hint: "Разделительный Ь стоит перед Е, Ё, Ю, Я, И.",
  },
  {
    prompt: "Выбери слово, в котором пишется ЖИ.",
    options: ["лыж_", "снеж_нка", "ж_раф"],
    correctIndex: 2,
    hint: "Сочетания ЖИ и ШИ пишутся с буквой И.",
  },
  {
    prompt: "В каком слове нужно написать НЕ слитно?",
    options: ["(не)друг", "(не) у дома", "(не) писал"],
    correctIndex: 0,
    hint: "Если слово без НЕ не употребляется как противопоставление и образует новое слово.",
  },
  {
    prompt: "Выбери слово с парной согласной, которую можно проверить словом зубы.",
    options: ["зу_", "лу_", "ша_"],
    correctIndex: 0,
    hint: "Поставь слово в форму, где после согласной слышится гласный.",
  },
  {
    prompt: "В каком слове нужно писать О после шипящей в корне?",
    options: ["ш_рох", "ч_до", "щ_ка"],
    correctIndex: 0,
    hint: "В слове шорох после Ш пишется О.",
  },
  {
    prompt: "Выбери глагол II спряжения.",
    options: ["рисовать", "видеть", "гулять"],
    correctIndex: 1,
    hint: "Видеть — глагол-исключение II спряжения.",
  },
  {
    prompt: "Где нужна буква Е?",
    options: ["по дорог_", "в тетрад_", "без помощ_"],
    correctIndex: 0,
    hint: "Слово должно получиться: по дороге.",
  },
  {
    prompt: "В каком слове есть приставка?",
    options: ["лесной", "подписать", "берёзка"],
    correctIndex: 1,
    hint: "Приставка стоит перед корнем.",
  },
  {
    prompt: "Выбери слово, где нужно писать ЧК без мягкого знака.",
    options: ["доч_ка", "печ_ка", "руч_ка"],
    correctIndex: 2,
    hint: "В сочетаниях ЧК, ЧН мягкий знак не пишется.",
  },
  {
    prompt: "Какое слово пишется через Ь?",
    options: ["ноч", "мяч", "рожь"],
    correctIndex: 2,
    hint: "У существительных 3 склонения на конце пишется Ь.",
  },
  {
    prompt: "Выбери слово с проверяемой безударной гласной.",
    options: ["л_са", "собака", "карандаш"],
    correctIndex: 0,
    hint: "Проверочное слово: лес.",
  },
  {
    prompt: "В каком слове пишется А после шипящей?",
    options: ["ч_шка", "ж_раф", "ш_лун"],
    correctIndex: 0,
    hint: "Слово чашка пишется с А.",
  },
];

const BOARD_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getWinner(board: CellValue[]): Winner {
  for (const [a, b, c] of BOARD_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === "player" ? "player" : "monster";
    }
  }

  if (board.every(Boolean)) return "draw";
  return null;
}

function getMonsterMove(board: CellValue[]) {
  const empty = board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index >= 0);

  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function CaveAdventureGame() {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const [board, setBoard] = useState<CellValue[]>(() => Array(9).fill(null));
  const [questions, setQuestions] = useState<Question[]>(() => shuffle(QUESTIONS));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [diamonds, setDiamonds] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const [winner, setWinner] = useState<Winner>(null);
  const [isMonsterTurn, setIsMonsterTurn] = useState(false);
  const [statusText, setStatusText] = useState("Твой ход: выбери клетку на поле");

  const currentQuestion = useMemo(
    () => questions[questionIndex % questions.length],
    [questions, questionIndex],
  );

  const modalOpen = activeCell !== null || feedback !== null || paused || winner !== null;

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const playClick = useCallback(() => {
    if (!soundOn) return;
    const audio = new Audio(assetPath("/assets/sounds/button-click.wav"));
    audio.volume = 0.2;
    audio.play().catch(() => undefined);
  }, [soundOn]);

  const goHome = useCallback(() => {
    playClick();
    router.push("/");
  }, [playClick, router]);

  const restart = useCallback(() => {
    playClick();
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setBoard(Array(9).fill(null));
    setQuestions(shuffle(QUESTIONS));
    setQuestionIndex(0);
    setActiveCell(null);
    setSelectedAnswer(null);
    setFeedback(null);
    setDiamonds(0);
    setPaused(false);
    setWinner(null);
    setIsMonsterTurn(false);
    setStatusText("Твой ход: выбери клетку на поле");
  }, [playClick]);

  const queueMonsterMove = useCallback((nextBoard: CellValue[]) => {
    setIsMonsterTurn(true);
    setStatusText("Ход монстра...");

    timeoutRef.current = window.setTimeout(() => {
      const move = getMonsterMove(nextBoard);
      if (move === null) {
        setWinner("draw");
        setStatusText("Ничья!");
        setIsMonsterTurn(false);
        return;
      }

      const updatedBoard = [...nextBoard];
      updatedBoard[move] = "monster";
      setBoard(updatedBoard);

      const gameWinner = getWinner(updatedBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setStatusText(
          gameWinner === "monster"
            ? "Монстр победил!"
            : gameWinner === "player"
              ? "Победа!"
              : "Ничья!",
        );
      } else {
        setStatusText("Твой ход: выбери клетку на поле");
      }

      setIsMonsterTurn(false);
    }, 850);
  }, []);

  const openCell = useCallback((index: number) => {
    if (paused || winner || isMonsterTurn || board[index] !== null || activeCell !== null || feedback) return;
    playClick();
    setActiveCell(index);
    setSelectedAnswer(null);
  }, [paused, winner, isMonsterTurn, board, activeCell, feedback, playClick]);

  const closeQuestion = useCallback(() => {
    playClick();
    setActiveCell(null);
    setSelectedAnswer(null);
  }, [playClick]);

  const chooseAnswer = useCallback((index: number) => {
    if (activeCell === null) return;
    playClick();
    setSelectedAnswer(index);
    setFeedback({
      kind: index === currentQuestion.correctIndex ? "correct" : "wrong",
      selectedIndex: index,
      question: currentQuestion,
    });
  }, [activeCell, currentQuestion, playClick]);

  const applyPlayerMove = useCallback(() => {
    if (activeCell === null || !feedback) return;

    playClick();
    const updatedBoard = [...board];
    updatedBoard[activeCell] = "player";
    setBoard(updatedBoard);

    if (feedback.kind === "correct") {
      setDiamonds((value) => value + 1);
      addPlayerDiamonds(1);
    }

    setQuestionIndex((value) => value + 1);
    setFeedback(null);
    setActiveCell(null);
    setSelectedAnswer(null);

    const gameWinner = getWinner(updatedBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setStatusText(gameWinner === "player" ? "Победа!" : gameWinner === "draw" ? "Ничья!" : "Монстр победил!");
      return;
    }

    queueMonsterMove(updatedBoard);
  }, [activeCell, feedback, board, playClick, queueMonsterMove]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && winner === null && feedback === null) {
        event.preventDefault();
        setPaused((value) => !value);
      }

      if (activeCell !== null && feedback === null) {
        if (["1", "2", "3"].includes(event.key)) {
          event.preventDefault();
          chooseAnswer(Number(event.key) - 1);
        }
      }

      if (feedback && event.key === "Enter") {
        event.preventDefault();
        applyPlayerMove();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCell, feedback, winner, chooseAnswer, applyPlayerMove]);

  return (
    <main
      className="cave-game"
      style={{
        backgroundImage: `linear-gradient(rgba(6, 11, 34, 0.18), rgba(6, 11, 34, 0.28)), url("${assetPath("/assets/games/cave-adventure/cave-background.png")}")`,
      }}
    >
      <div className="cave-game__title">
        <img src={assetPath("/assets/games/cave-adventure/title-panel.png")} alt="Победи монстра" />
      </div>

      <div className="cave-game__playerPanel">
        <img src={assetPath("/assets/games/cave-adventure/player-panel.png")} alt="Игрок" />
      </div>

      <div className="cave-game__monsterPanel">
        <img src={assetPath("/assets/games/cave-adventure/monster-panel.png")} alt="Монстр" />
      </div>

      <div className="cave-game__diamondBox">
        <img src={assetPath("/assets/common-ui/diamond.png")} alt="Алмазы" />
        <strong>{diamonds}</strong>
      </div>

      <div className="cave-game__controls">
        <button type="button" onClick={() => { playClick(); setSoundOn((value) => !value); }} title={soundOn ? "Выключить звук" : "Включить звук"}>
          <img src={assetPath(soundOn ? "/assets/common-ui/ui-sound-on.png" : "/assets/common-ui/ui-sound-off.png")} alt={soundOn ? "Звук включен" : "Звук выключен"} />
        </button>
        <button type="button" onClick={() => { playClick(); setPaused((value) => !value); }} title={paused ? "Продолжить" : "Пауза"}>
          <img src={assetPath(paused ? "/assets/common-ui/ui-play.png" : "/assets/common-ui/ui-pause.png")} alt={paused ? "Продолжить" : "Пауза"} />
        </button>
        <button type="button" onClick={goHome} title="На главную">
          <img src={assetPath("/assets/common-ui/ui-home.png")} alt="На главную" />
        </button>
      </div>

      <div className="cave-game__hintBox">
        <p>
          Собери <strong>три знака в ряд</strong>, чтобы победить монстра!
        </p>
      </div>

      <section className="cave-game__boardWrap">
        <img className="cave-game__boardImage" src={assetPath("/assets/games/cave-adventure/game-board.png")} alt="Игровое поле" />
        <div className="cave-game__boardGrid">
          {board.map((cell, index) => (
            <button
              key={index}
              type="button"
              className={`cave-cell ${cell ? "is-filled" : ""}`}
              onClick={() => openCell(index)}
              disabled={cell !== null || isMonsterTurn || paused || winner !== null}
              aria-label={cell ? `Клетка ${index + 1} занята` : `Выбрать клетку ${index + 1}`}
            >
              {cell === "player" && <img src={assetPath("/assets/games/cave-adventure/x-mark.png")} alt="Твой знак" />}
              {cell === "monster" && <img src={assetPath("/assets/games/cave-adventure/o-mark.png")} alt="Знак монстра" />}
            </button>
          ))}
        </div>
      </section>

      <img className="cave-game__hero" src={assetPath("/assets/games/cave-adventure/hero.png")} alt="Герой" />
      <img className="cave-game__monster" src={assetPath("/assets/games/cave-adventure/monster.png")} alt="Монстр" />
      <img className="cave-game__monsterRing" src={assetPath("/assets/games/cave-adventure/monster-ring.png")} alt="" aria-hidden="true" />

      <div className="cave-game__status">
        <img src={assetPath("/assets/games/cave-adventure/turn-banner.png")} alt="" aria-hidden="true" />
        <p>{statusText}</p>
      </div>

      {activeCell !== null && feedback === null && (
        <div className="cave-modal-backdrop">
          <section className="cave-question" style={{ backgroundImage: `url("${assetPath("/assets/games/cave-adventure/question-window.png")}")` }}>
            <button type="button" className="cave-question__close" onClick={closeQuestion} aria-label="Закрыть" />
            <div className="cave-question__content">
              <h2>{currentQuestion.prompt}</h2>
              <div className="cave-question__answers">
                {currentQuestion.options.map((option, index) => (
                  <button key={option} type="button" className={`cave-question__answer ${selectedAnswer === index ? "is-selected" : ""}`} onClick={() => chooseAnswer(index)}>
                    {option}
                  </button>
                ))}
              </div>
              <p className="cave-question__hint">💡 Подсказка: {currentQuestion.hint}</p>
            </div>
          </section>
        </div>
      )}

      {feedback && (
        <div className="cave-modal-backdrop">
          <section className="cave-feedback">
            <div
              className={`cave-feedback__window cave-feedback__window--${feedback.kind}`}
              style={{
                backgroundImage: `url("${assetPath(
                  feedback.kind === "correct"
                    ? "/assets/games/cave-adventure/correct-window.png"
                    : "/assets/games/cave-adventure/error-window.png",
                )}")`,
              }}
            >
              <button type="button" className="cave-feedback__action" onClick={applyPlayerMove} aria-label="Продолжить" />
            </div>
            <div className={`cave-feedback__note cave-feedback__note--${feedback.kind}`}>
              {feedback.kind === "correct" ? (
                <>
                  <strong>Верно!</strong> Клетка станет твоей, и ты получишь <strong>+1 алмаз</strong>.
                </>
              ) : (
                <>
                  <strong>Ошибка.</strong> Клетка всё равно станет твоей, но <strong>без алмаза</strong>.
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {paused && winner === null && (
        <div className="cave-modal-backdrop">
          <section className="cave-overlayPanel">
            <h2>Пауза</h2>
            <p>Можешь продолжить игру, начать заново или вернуться на главную.</p>
            <div className="cave-overlayPanel__buttons">
              <button type="button" onClick={() => { playClick(); setPaused(false); }}>Продолжить</button>
              <button type="button" onClick={restart}>Сначала</button>
              <button type="button" onClick={goHome}>На главную</button>
            </div>
          </section>
        </div>
      )}

      {winner !== null && (
        <div className="cave-modal-backdrop">
          <section className="cave-overlayPanel cave-overlayPanel--final">
            <h2>
              {winner === "player" && "Победа!"}
              {winner === "monster" && "Монстр победил"}
              {winner === "draw" && "Ничья"}
            </h2>
            <p>
              {winner === "player" && "Ты собрал линию из трёх знаков и победил монстра!"}
              {winner === "monster" && "Монстр успел собрать линию первым. Попробуй ещё раз!"}
              {winner === "draw" && "Свободных клеток не осталось. Попробуй сыграть ещё раз!"}
            </p>
            <div className="cave-overlayPanel__stats">
              <div>
                <span>Алмазы</span>
                <strong>{diamonds}</strong>
              </div>
              <div>
                <span>Клеток игрока</span>
                <strong>{board.filter((cell) => cell === "player").length}</strong>
              </div>
              <div>
                <span>Клеток монстра</span>
                <strong>{board.filter((cell) => cell === "monster").length}</strong>
              </div>
            </div>
            <div className="cave-overlayPanel__buttons">
              <button type="button" onClick={restart}>Сыграть ещё раз</button>
              <button type="button" onClick={goHome}>К списку игр</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
