"use client";

import Link from "next/link";
import { assetPath } from "@/lib/asset-path";

const RULES = [
  "Выбери свободную клетку",
  "Ответь на вопрос по русскому языку",
  "Клетка станет твоей даже при ошибке",
  "За верный ответ получи 1 алмаз",
  "Собери три знака в ряд и победи монстра",
];

export default function CaveAdventureIntro() {
  return (
    <main
      className="cave-intro"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 18, 42, 0.28), rgba(5, 18, 42, 0.46)), url("${assetPath("/assets/games/cave-adventure/cave-background.png")}")`,
      }}
    >
      <section className="cave-intro__card">
        <div className="cave-intro__copy">
          <Link className="cave-intro__back" href="/">
            <img src={assetPath("/assets/common-ui/ui-home.png")} alt="" />
            <span>На главную</span>
          </Link>

          <h1>
            Победи
            <br />
            монстра
          </h1>
          <p className="cave-intro__lead">
            Сразись в пещерные крестики-нолики! Решай задания, получай алмазы и победи монстра.
          </p>

          <div className="cave-intro__topic">
            <span>Тема</span>
            <strong>Задания по русскому языку</strong>
          </div>

          <Link className="cave-intro__play" href="/games/cave-adventure/play" aria-label="Играть">
            <img src={assetPath("/assets/home/play-button.png")} alt="Играть" />
          </Link>
        </div>

        <div className="cave-intro__rules">
          <h2>Как играть</h2>
          <img className="cave-intro__hero" src={assetPath("/assets/games/cave-adventure/hero.png")} alt="Герой" />
          <div className="cave-intro__rulesList">
            {RULES.map((rule, index) => (
              <div key={rule} className="cave-intro__ruleItem">
                <span className="cave-intro__ruleNumber">{index + 1}.</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
