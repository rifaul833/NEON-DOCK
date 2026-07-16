import type { Metadata } from "next";
import ArcheryGame from "./ArcheryGame";

export const metadata: Metadata = {
  title: "Arrowfall — 3D Archery",
  description: "A cinematic multiplayer archery challenge built for the browser.",
};

export default function Home() {
  return <ArcheryGame />;
}
