"use client";

type Props = { diamonds: number };

export default function DiamondCounter({ diamonds }: Props) {
  return <div>💎 {diamonds}</div>;
}
