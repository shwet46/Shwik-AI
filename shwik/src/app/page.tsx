import Image from "next/image";
import Hero from "@/components/Hero";
import Producthome from "@/components/Producthome";


export default function Home() {
  return (
    <>
    <main className="min-h-screen antialiased">
      <Hero/>
      <Producthome />
    </main>
    </>
  );
}
