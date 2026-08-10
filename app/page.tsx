import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Disclosures from "@/components/landing/Disclosures";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <Hero />
      <HowItWorks />
      <Disclosures />
    </main>
  );
}
