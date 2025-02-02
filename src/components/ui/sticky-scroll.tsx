"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(content.length / itemsPerPage);

  const getVisibleContent = () => {
    const startIdx = currentPage * itemsPerPage;
    return content.slice(startIdx, startIdx + itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const { top, height } = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollPosition = -top;
      const sectionProgress = scrollPosition / (height - viewportHeight);
      
      // Calculate which page we should be on based on scroll position
      const targetPage = Math.min(
        Math.max(
          Math.floor(sectionProgress * totalPages),
          0
        ),
        totalPages - 1
      );

      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage, totalPages]);

  return (
    <div className="relative">
      <motion.div
        ref={containerRef}
        className="relative h-[80vh] bg-black"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 h-full max-w-7xl mx-auto px-4">
          {/* Content Column */}
          <div className="flex flex-col">
            <div className="pt-24 sticky top-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {getVisibleContent().map((item, idx) => (
                    <div
                      key={idx + currentPage * itemsPerPage}
                      className={`mb-8 ${contentClassName}`}
                    >
                      <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-[#33C3F0] to-[#0EA5E9] bg-clip-text text-transparent">
                        {item.title}
                      </h3>
                      <p className="text-neutral-300 leading-relaxed text-sm">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Image Column */}
          <div className="hidden md:block">
            <motion.div
              style={{
                position: "sticky",
                top: "96px",
              }}
              className="rounded-lg overflow-hidden"
            >
              <motion.img
                src={imageUrl}
                alt="Process Analysis"
                className="w-full h-[600px] object-contain rounded-lg"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Pagination */}
      <div className="sticky bottom-8 bg-black py-4">
        <Pagination>
          <PaginationContent>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  onClick={() => handlePageChange(idx)}
                  isActive={currentPage === idx}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};