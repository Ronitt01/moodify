import { Background } from "@/components/ui/Background";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { MomentsStrip } from "@/components/MomentsStrip";
import { Manifesto } from "@/components/Manifesto";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { Demo } from "@/components/Demo";
import { Features } from "@/components/Features";
import { Proof } from "@/components/Proof";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Background />
      <Nav />
      <main id="main">
        <Hero />
        <MomentsStrip />
        <Manifesto />
        <HowItWorks />
        <Benefits />
        <Demo />
        <Features />
        <Proof />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
