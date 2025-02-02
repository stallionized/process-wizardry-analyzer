"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface StickyScrollProps {
  content: {
    title: string;
    description: string;
  }[];
  contentClassName?: string;
  imageUrl: string;
}

export const StickyScroll: React.FC<StickyScrollProps> = ({
  content,
  contentClassName,
  imageUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[100vh] py-10 overflow-y-auto bg-black"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 h-full max-w-7xl mx-auto px-4">
        <div className="relative max-w-xl">
          <div className="space-y-8 py-8">
            {content.map((item, idx) => (
              <div key={idx} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={contentClassName}
                >
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-[#33C3F0] to-[#0EA5E9] bg-clip-text text-transparent">
                    {item.title}
                  </h3>
                  <p className="text-neutral-300 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:block relative h-full">
          <motion.div
            style={{
              position: "sticky",
              top: "8%", // Changed from 15% to 8% to align with first bullet point
            }}
            className="rounded-lg overflow-hidden"
          >
            <motion.img
              src={imageUrl}
              alt="Process Analysis"
              className="w-full h-auto object-cover rounded-lg"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};