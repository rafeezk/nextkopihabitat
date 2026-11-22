import Navbar2 from "../components/Navbar2";
import BeanPage from "./BeanPage";
import LocationPage from "./LocationPage";
import CoffeePage from "./CoffeePage";
import Footer from "../components/Footer";
import { TextGenerateEffect } from "../components/text-generate-effect";

export default function HomePage() {
  const words = "when life gives u coffee beans, \nmake an americano and latte to the good times.";
  return (
    <>
      <Navbar2 />
      <section className="home h-screen" id="home">
        <div className="flex flex-col justify-center items-center h-full backdrop-brightness-75">
          <h2 className="text-effect text-center text-white mb-4 uppercase font-semibold leading-[50px]">
            <TextGenerateEffect words={words} />
          </h2>
          <button className="uppercase py-3 px-4 mt-8 text-white font-bold bg-black"
            onClick={() => document.getElementById("location")?.scrollIntoView({ behavior: "smooth" })}>Visit us</button>
        </div>
      </section>
      <BeanPage />
      <LocationPage />
      <CoffeePage />
      <Footer />
    </>
  );
}
