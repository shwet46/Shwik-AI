import Hero from "@/components/Hero";
import Producthome from "@/components/Producthome";
import Footer from "@/components/Footer";


export default function Home() {
  return (
    <>
    <main className="min-h-screen mt-20 antialiased">
      <Hero/>
      <Producthome />
      <Footer/>
    </main>
    </>
  );
}
