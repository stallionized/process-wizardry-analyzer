import { SplineSceneBasic } from "@/components/demo/code.demo";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { NavigationBar } from "@/components/landing/NavigationBar";
import { Benefits } from "@/components/landing/Benefits";

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <NavigationBar isScrolled={isScrolled} />

      <div className="container mx-auto px-4 pt-24">
        <div>
          <SplineSceneBasic />
        </div>

        <div className="mt-8">
          <Benefits />
        </div>

        <div className="mt-12 mb-20 bg-black">
          <LampContainer className="h-[40vh] min-h-[400px]">
            <motion.h1
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-2xl font-medium tracking-tight text-transparent md:text-5xl"
            >
              Designed & Developed by Process Engineers
            </motion.h1>
          </LampContainer>
        </div>
      </div>

      <footer className="bg-[#221F26] py-8">
        <div className="container mx-auto px-4 text-center text-gray-300">
          <p>© 2024 AI Process Engineer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}