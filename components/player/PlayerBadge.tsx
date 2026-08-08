"use client";

import DiamondCounter from "./DiamondCounter";

type Props = { name: string; diamonds: number };

export default function PlayerBadge({ name, diamonds }: Props) {
  return <div><strong>{name}</strong><DiamondCounter diamonds={diamonds} /></div>;
}
