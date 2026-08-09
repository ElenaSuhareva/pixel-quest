"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assetPath } from "@/lib/asset-path";
import { addPlayerDiamonds } from "@/lib/player-storage";

type Question = {
  prompt: string;
  answer: "Е" | "И";
  full: string;
};

type PlotStatus = "empty" | "watering" | "grown";

type Plot = {
  status: PlotStatus;
  flower: number;
};

const QUESTIONS: Question[] = [
  { prompt: "в рощ__", answer: "Е", full: "в роще" },
  { prompt: "о книг__", answer: "Е", full: "о книге" },
  { prompt: "к мам__", answer: "Е", full: "к маме" },
  { prompt: "по дорог__", answer: "Е", full: "по дороге" },
  { prompt: "на полян__", answer: "Е", full: "на поляне" },
  { prompt: "в комнат__", answer: "Е", full: "в комнате" },
  { prompt: "к берёз__", answer: "Е", full: "к берёзе" },
  { prompt: "о погод__", answer: "Е", full: "о погоде" },
  { prompt: "на стен__", answer: "Е", full: "на стене" },
  { prompt: "в школ__", answer: "Е", full: "в школе" },
  { prompt: "в тетрад__", answer: "И", full: "в тетради" },
  { prompt: "о ноч__", answer: "И", full: "о ночи" },
  { prompt: "к сирен__", answer: "И", full: "к сирени" },
  { prompt: "на площад__", answer: "И", full: "на площади" },
  { prompt: "о жизн__", answer: "И", full: "о жизни" },
  { prompt: "в постел__", answer: "И", full: "в постели" },
  { prompt: "без тетрад__", answer: "И", full: "без тетради" },
  { prompt: "около площад__", answer: "И", full: "около площади" },
  { prompt: "до постел__", answer: "И", full: "до постели" },
  { prompt: "из деревн__", answer: "И", full: "из деревни" },
];

const FIELD_FLOWERS = ["plot-flower-pink.png", "plot-flower-white.png", "plot-flower-orange.png"];
const PLOT_TARGET = 10;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createInitialPlots(): Plot[] {
  return Array.from({ length: PLOT_TARGET }, (_, i) => ({ status: "empty", flower: i % 3 }));
}

function getPlotImage(plot: Plot) {
  if (plot.status === "watering") return "plot-watered.png";
  if (plot.status === "grown") return FIELD_FLOWERS[plot.flower];
  return "plot-empty.png";
}

export default function FarmValleyGame() {
  const router = useRouter();
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [plots, setPlots] = useState<Plot[]>(createInitialPlots);
  const [questions, setQuestions] = useState<Question[]>(() => shuffle(QUESTIONS));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activePlot, setActivePlot] = useState<number | null>(null);
  const [selected, setSelected] = useState<"Е" | "И">("Е");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [watering, setWatering] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [finished, setFinished] = useState(false);

  const current = questions[questionIndex % questions.length];
  const flowers = plots.filter((plot) => plot.status === "grown").length;

  useEffect(() => {
    const music = new Audio(assetPath("/assets/games/farm-valley/farm-music.mp3"));
    music.loop = true;
    music.volume = 0.12;
    musicRef.current = music;
    music.play().catch(() => undefined);

    const tryStartMusic = () => {
      if (soundOn) music.play().catch(() => undefined);
    };

    window.addEventListener("pointerdown", tryStartMusic, { once: true });
    window.addEventListener("keydown", tryStartMusic, { once: true });

    return () => {
      window.removeEventListener("pointerdown", tryStartMusic);
      window.removeEventListener("keydown", tryStartMusic);
      music.pause();
      music.currentTime = 0;
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;

    if (soundOn) {
      music.volume = 0.12;
      music.play().catch(() => undefined);
    } else {
      music.pause();
    }
  }, [soundOn]);

  const playClick = useCallback(() => {
    if (!soundOn) return;
    const audio = new Audio(assetPath("/assets/sounds/button-click.wav"));
    audio.volume = 0.22;
    audio.play().catch(() => undefined);
  }, [soundOn]);

  const choosePlot = (index: number) => {
    if (paused || finished || watering !== null || plots[index].status !== "empty") return;
    playClick();
    setActivePlot(index);
    setSelected("Е");
    setResult(null);
  };

  const answer = useCallback((choice?: "Е" | "И") => {
    if (activePlot === null || result) return;
    playClick();
    const actualChoice = choice ?? selected;
    const ok = actualChoice === current.answer;
    setResult(ok ? "correct" : "wrong");
    if (ok) setCorrectCount((value) => value + 1);
  }, [activePlot, result, selected, current, playClick]);

  const understand = useCallback(() => {
    if (activePlot === null || !result) return;
    const plotIndex = activePlot;
    playClick();
    setActivePlot(null);
    setResult(null);
    setWatering(plotIndex);
    setPlots((value) => value.map((plot, index) => (index === plotIndex ? { ...plot, status: "watering" } : plot)));

    window.setTimeout(() => {
      setPlots((value) => value.map((plot, index) => (index === plotIndex ? { ...plot, status: "grown" } : plot)));
      addPlayerDiamonds(1);
      setDiamonds((value) => value + 1);
      setQuestionIndex((value) => value + 1);
      setWatering(null);
      if (flowers + 1 >= PLOT_TARGET) {
        window.setTimeout(() => setFinished(true), 220);
      }
    }, 850);
  }, [activePlot, result, playClick, flowers]);

  const restart = useCallback(() => {
    playClick();
    setPlots(createInitialPlots());
    setQuestions(shuffle(QUESTIONS));
    setQuestionIndex(0);
    setActivePlot(null);
    setSelected("Е");
    setResult(null);
    setCorrectCount(0);
    setDiamonds(0);
    setWatering(null);
    setPaused(false);
    setFinished(false);
  }, [playClick]);

  const goHome = useCallback(() => {
    playClick();
    router.push("/");
  }, [playClick, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activePlot !== null && !result) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setSelected("Е");
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setSelected("И");
        }
        if (event.key === "Enter") {
          event.preventDefault();
          answer();
        }
        return;
      }

      if (activePlot !== null && result && event.key === "Enter") {
        event.preventDefault();
        understand();
        return;
      }

      if (event.key === "Escape" && !finished) {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePlot, result, answer, understand, finished]);

  return (
    <main className="farm-game" style={{ backgroundImage: `url("${assetPath("/assets/games/farm-valley/background.jpg")}")` }}>
      <div className="farm-game__hud">
        <div className="farm-game__score">
          <img src={assetPath("/assets/games/farm-valley/flower-icon.png")} alt="" />
          <strong>{flowers}/10</strong>
          <img src={assetPath("/assets/common-ui/diamond.png")} alt="" />
          <strong>{diamonds}</strong>
        </div>

        <div className="farm-game__controls">
          <button onClick={() => setSoundOn((v) => !v)} title={soundOn ? "Выключить звук" : "Включить звук"}>
            <img src={assetPath(`/assets/common-ui/${soundOn ? "ui-sound-on.png" : "ui-sound-off.png"}`)} alt="" />
          </button>
          <button onClick={() => setPaused((v) => !v)} title={paused ? "Продолжить" : "Пауза"}>
            <img src={assetPath(`/assets/common-ui/${paused ? "ui-play.png" : "ui-pause.png"}`)} alt="" />
          </button>
          <button onClick={goHome} title="На главную">
            <img src={assetPath("/assets/common-ui/ui-home.png")} alt="" />
          </button>
        </div>
      </div>

      <section className="farm-game__field" aria-label="Грядки">
        {plots.map((plot, index) => (
          <button
            key={index}
            className={`farm-plot ${plot.status !== "empty" ? "farm-plot--busy" : ""}`}
            onClick={() => choosePlot(index)}
            disabled={plot.status !== "empty" || watering !== null}
            aria-label={plot.status === "grown" ? `Грядка ${index + 1}, цветок выращен` : `Грядка ${index + 1}`}
          >
            <img src={assetPath(`/assets/games/farm-valley/${getPlotImage(plot)}`)} alt="" />
          </button>
        ))}
      </section>

      <img
        className={`farm-game__farmer ${watering !== null ? "is-hidden" : ""}`}
        src={assetPath("/assets/games/farm-valley/farmer.png")}
        alt="Фермер"
      />

      {watering !== null && (
        <img
          className="farm-game__farmerWatering"
          src={assetPath("/assets/games/farm-valley/farmer-watering.png")}
          alt="Фермер поливает грядку"
        />
      )}

      {activePlot !== null && (
        <div className="farm-modal-backdrop">
          {!result ? (
            <section className="farm-panel farm-panel--task" style={{ backgroundImage: `url("${assetPath("/assets/games/farm-valley/task-panel.png")}")` }}>
              <div className="farm-panel__taskWord">{current.prompt}</div>
              <div className="farm-panel__answers">
                {(["Е", "И"] as const).map((letter) => (
                  <button
                    key={letter}
                    className={`farm-letterButton farm-letterButton--${letter === "Е" ? "green" : "gold"} ${selected === letter ? "is-selected" : ""}`}
                    onMouseEnter={() => setSelected(letter)}
                    onClick={() => {
                      setSelected(letter);
                      answer(letter);
                    }}
                  >
                    -{letter}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section
              className={`farm-panel farm-panel--feedback ${result === "correct" ? "is-correct" : "is-wrong"}`}
              style={{
                backgroundImage: `url("${assetPath(`/assets/games/farm-valley/${result === "correct" ? "result-correct.png" : "result-wrong.png"}`)}")`,
              }}
            >
              {result === "wrong" && <p className="farm-panel__feedbackText">Правильный ответ:</p>}
              <div className="farm-panel__full">{current.full}</div>
              <button className="farm-panel__understand is-selected" onClick={understand}>Понятно</button>
            </section>
          )}
        </div>
      )}

      {paused && activePlot === null && !finished && (
        <div className="farm-modal-backdrop">
          <section className="farm-panel farm-panel--pause">
            <h2>Пауза</h2>
            <button onClick={() => setPaused(false)}>Продолжить</button>
            <button onClick={goHome}>К списку игр</button>
          </section>
        </div>
      )}

      {finished && (
        <div className="farm-modal-backdrop">
          <section
            className="farm-panel farm-panel--final"
            style={{ backgroundImage: `url("${assetPath("/assets/games/farm-valley/farm-bloomed-panel.png")}")` }}
          >
            <div className="farm-panel__victoryCheck">
              <img src={assetPath("/assets/games/farm-valley/result-check.png")} alt="Готово" />
            </div>
            <div className="farm-panel__stats">
              <p>Цветов выращено: <strong>10 / 10</strong></p>
              <p>Правильных ответов: <strong>{correctCount} / 10</strong></p>
              <p>Получено алмазов: <strong>{diamonds}</strong></p>
            </div>
            <div className="farm-panel__finalButtons">
              <button onClick={restart}>Сыграть ещё раз</button>
              <button onClick={goHome}>К списку игр</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
