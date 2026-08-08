"use client";

type HeaderProps = {
  name: string;
  diamonds: number;
};

export default function Header({ name, diamonds }: HeaderProps) {
  return (
    <header className="home-header">
      <img
        className="home-header__logo"
        src="/assets/home/header-logo.png"
        alt="Pixel Quest"
      />

      <div className="player-strip" aria-label="Профиль игрока">
        <img
          className="player-strip__avatar"
          src="/assets/home/avatar-default.png"
          alt=""
          aria-hidden="true"
        />
        <strong className="player-strip__name">{name}</strong>
        <span className="player-strip__divider" aria-hidden="true" />
        <img
          className="player-strip__diamond"
          src="/assets/home/diamond.png"
          alt="Алмазы"
        />
        <strong className="player-strip__count">{diamonds}</strong>
      </div>
    </header>
  );
}
