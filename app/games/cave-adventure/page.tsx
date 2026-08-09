
"use client";

import Link from "next/link";
import { assetPath } from "@/lib/asset-path";
import "./intro.css";

const RULES = [
  "Выбери свободную клетку",
  "Выполни задание по теме «Окончания глаголов»",
  "После ответа клетка станет твоей",
  "За верный ответ получи алмаз",
  "Собери три знака в ряд раньше монстра",
];

export default function Page() {
  return (
    <main
      className="cave-intro"
      style={{
        backgroundImage: `linear-gradient(rgba(5,18,38,.28),rgba(5,18,38,.44)),url("${assetPath("/assets/games/cave-adventure/cave-background.png")}")`,
      }}
    >
      <section className="cave-intro__card">
        <div className="cave-intro__copy">
          <Link className="cave-intro__back" href="/">
            <img src={assetPath("/assets/common-ui/ui-home.png")} alt="" />
            <span>На главную</span>
          </Link>

          <h1>Победи<br />монстра</h1>

          <p className="cave-intro__lead">
            Сразись в пещерные крестики-нолики!
          </p>

          <p className="cave-intro__sublead">
            Решай задания, получай алмазы и собери три знака в ряд раньше монстра.
          </p>

          <div className="cave-intro__topic">
            <span>Тема</span>
            <strong>Окончания глаголов</strong>
          </div>

          <Link
            className="cave-intro__play"
            href="/games/cave-adventure/play"
            aria-label="Играть"
          >
            <img
              src={assetPath("/assets/games/cave-adventure/play-button.png")}
              alt="Играть"
            />
          </Link>
        </div>

        <div className="cave-intro__rules">
          <h2>Как играть</h2>

          <div className="cave-intro__characters">
            <img
              className="cave-intro__hero"
              src={assetPath("/assets/games/cave-adventure/hero.png")}
              alt="Герой"
            />
            <img
              className="cave-intro__monster"
              src={assetPath("/assets/games/cave-adventure/monster.png")}
              alt="Монстр"
            />
          </div>

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
