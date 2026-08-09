
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assetPath } from "@/lib/asset-path";

function KeyChip({ children }: { children: ReactNode }) {
  return <span className="brave-intro__key">{children}</span>;
}

export default function BraveKnightIntro() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/games/brave-knight/play");
  }, [router]);

  function goHome() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => router.push("/"), 170);
  }

  return (
    <main
      className="brave-intro"
      style={{
        backgroundImage: `linear-gradient(rgba(4, 18, 42, .20), rgba(4, 18, 42, .28)), url("${assetPath("/assets/games/brave-knight/background.png")}")`,
      }}
    >
      <section className="brave-intro__card">
        <div className="brave-intro__copy">
          <button className="brave-intro__back" type="button" onClick={goHome}>
            <img src={assetPath("/assets/common-ui/ui-home.png")} alt="" />
            <span>На главную</span>
          </button>

          <h1>Храбрый рыцарь</h1>
          <p className="brave-intro__lead">
            Доберись до замка, преодолей препятствия и собери 10 алмазов.
          </p>

          <div className="brave-intro__topic">
            <span>Тема</span>
            <strong>Буквы З и С на конце приставок</strong>
          </div>

          <Link
            className="brave-intro__play"
            href="/games/brave-knight/play"
            aria-label="Играть в Храброго рыцаря"
          >
            <img src={assetPath("/assets/home/play-button.png")} alt="Играть" />
          </Link>
        </div>

        <div className="brave-intro__rulesShell">
          <div
            className="brave-intro__rules"
            style={{
              backgroundImage: `linear-gradient(rgba(5, 32, 56, .72), rgba(5, 32, 56, .72)), url("${assetPath("/assets/games/brave-knight/background.png")}")`,
            }}
          >
            <div className="brave-intro__rulesHeader">
              <h2>Как играть</h2>
            </div>

            <div className="brave-intro__rulesBody">
              <img
                className="brave-intro__rulesHero"
                src={assetPath("/assets/games/brave-knight/hero.png")}
                alt="Рыцарь"
              />

              <div className="brave-intro__rulesList">
                <div className="brave-intro__rule">
                  <div className="brave-intro__keys">
                    <KeyChip>←</KeyChip>
                    <KeyChip>→</KeyChip>
                  </div>
                  <strong>Движение</strong>
                </div>

                <div className="brave-intro__rule">
                  <div className="brave-intro__keys">
                    <KeyChip>Пробел</KeyChip>
                  </div>
                  <strong>Прыжок</strong>
                </div>

                <div className="brave-intro__rule">
                  <div className="brave-intro__keys">
                    <KeyChip>Пробел + →</KeyChip>
                  </div>
                  <strong>Перепрыгнуть</strong>
                </div>

                <div className="brave-intro__rule brave-intro__rule--icon">
                  <img
                    src={assetPath("/assets/games/brave-knight/heart-full.png")}
                    alt=""
                    aria-hidden="true"
                  />
                  <strong>Восстанавливай жизни</strong>
                </div>

                <div className="brave-intro__rule brave-intro__rule--icon">
                  <img
                    src={assetPath("/assets/games/brave-knight/diamond.png")}
                    alt=""
                    aria-hidden="true"
                  />
                  <strong>Собирай алмазы</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
