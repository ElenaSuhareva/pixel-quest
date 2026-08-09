"use client";

import Link from "next/link";
import { assetPath } from "@/lib/asset-path";

const RULES = [
  "Выбери любую грядку",
  "Выполни задание",
  "Фермер польёт грядку",
  "Вырастет цветок",
  "За каждый цветок получи алмаз",
];

export default function FarmValleyIntro() {
  return (
    <main
      className="farm-intro"
      style={{ backgroundImage: `linear-gradient(rgba(5,26,31,.3),rgba(5,26,31,.42)),url("${assetPath("/assets/games/farm-valley/background.jpg")}")` }}
    >
      <section className="farm-intro__card">
        <div className="farm-intro__copy">
          <Link className="farm-intro__back" href="/">
            <img src={assetPath("/assets/common-ui/ui-home.png")} alt="" />
            <span>На главную</span>
          </Link>

          <h1>Фермерская<br />долина</h1>
          <p className="farm-intro__lead">Помоги фермеру вырастить цветы на грядках и заработай алмазы!</p>

          <div className="farm-intro__topic">
            <span>Тема</span>
            <strong>Окончания существительных</strong>
          </div>

          <Link className="farm-intro__play" href="/games/farm-valley/play" aria-label="Играть">
            <img src={assetPath("/assets/games/farm-valley/play-button.png")} alt="Играть" />
          </Link>
        </div>

        <div className="farm-intro__rules">
          <h2>Как играть</h2>
          <img className="farm-intro__farmer" src={assetPath("/assets/games/farm-valley/farmer.png")} alt="Фермер" />
          <div className="farm-intro__rulesList">
            {RULES.map((rule, index) => (
              <div key={rule} className="farm-intro__ruleItem">
                <span className="farm-intro__ruleNumber">{index + 1}.</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
