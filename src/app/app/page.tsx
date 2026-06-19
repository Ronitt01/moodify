import type { Metadata } from "next";
import { Background } from "@/components/ui/Background";
import { Studio } from "@/components/app/Studio";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Tell Moodify the moment — get a queue built for it, from music you already love.",
};

export default function AppStudioPage() {
  return (
    <>
      <Background />
      <Studio />
    </>
  );
}
