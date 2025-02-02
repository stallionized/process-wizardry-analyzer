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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(content.length / itemsPerPage);
  const [isInView, setIsInView] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const getVisibleContent = () => {
    const startIdx = currentPage * itemsPerPage;
    return content.slice(startIdx, startIdx + itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          if (entry.isIntersecting) {
            setIsScrollLocked(true);
            document.body.style.overflow = 'hidden';
            containerRef.current?.style.setProperty('scroll-snap-align', 'start');
          } else {
            setIsScrollLocked(false);
            document.body.style.overflow = '';
            containerRef.current?.style.setProperty('scroll-snap-align', 'none');
          }
        });
      },
      {
        threshold: 0.7
      }
    );

    const handleScroll = (e: WheelEvent) => {
      if (!isInView || isTransitioning) return;

      e.preventDefault();
      const delta = Math.sign(e.deltaY);

      if (currentPage < totalPages - 1 && delta > 0) {
        setIsTransitioning(true);
        setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
        setTimeout(() => {
          setIsTransitioning(false);
          if (currentPage === totalPages - 2) {
            setIsScrollLocked(false);
            document.body.style.overflow = '';
          }
        }, 800);
      } else if (currentPage > 0 && delta < 0) {
        setIsTransitioning(true);
        setCurrentPage(prev => Math.max(prev - 1, 0));
        setTimeout(() => setIsTransitioning(false), 800);
      } else if (currentPage === totalPages - 1 && delta > 0) {
        setIsScrollLocked(false);
        document.body.style.overflow = '';
      }
    };

    if (containerRef.current) {
      observer.observe(containerRef.current);
      containerRef.current.addEventListener('wheel', handleScroll, { passive: false });
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleScroll);
      }
      observer.disconnect();
      document.body.style.overflow = '';
      clearTimeout(scrollTimeout);
    };
  }, [currentPage, totalPages, isTransitioning, isInView]);

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[60vh] bg-black pt-4 mt-8"
      style={{ 
        position: isScrollLocked ? 'sticky' : 'relative',
        top: isScrollLocked ? '0' : 'auto'
      }}
    >
      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 h-[85%] max-w-7xl mx-auto px-4">
        {/* Content Column */}
        <div className="flex flex-col justify-start h-full">
          <div className="h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 w-full"
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
        <div className="hidden md:flex flex-col items-center justify-center h-full">
          <motion.img
            src={imageUrl}
            alt="Process Analysis"
            className="w-full h-[400px] object-contain rounded-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Pagination row */}
      <div className="w-full flex justify-center mt-8">
        <Pagination>
          <PaginationContent className="flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  onClick={() => handlePageChange(idx)}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-full
                    transition-colors text-white cursor-pointer
                    ${currentPage === idx 
                      ? 'bg-[#33C3F0] hover:bg-[#0EA5E9]' 
                      : 'bg-black/50 hover:bg-[#33C3F0]'
                    }
                  `}
                  isActive={currentPage === idx}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>
    </motion.div>
  );
};