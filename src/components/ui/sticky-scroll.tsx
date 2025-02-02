"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationNext,
  PaginationPrevious
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

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[100vh] py-0 overflow-y-auto bg-black"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 h-full max-w-7xl mx-auto px-4">
        <div className="flex flex-col space-y-4">
          <div className="relative h-[300px]">
            <div className="space-y-8 pt-0">
              {getVisibleContent().map((item, idx) => (
                <motion.div
                  key={idx + currentPage * itemsPerPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
              ))}
            </div>
          </div>
          
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={handlePrevious} />
              </PaginationItem>
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
              <PaginationItem>
                <PaginationNext onClick={handleNext} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <div className="hidden md:block relative h-[600px] pt-0">
          <motion.div
            style={{
              position: "sticky",
              top: "-180px",
            }}
            className="rounded-lg overflow-hidden h-[600px] pt-0 mt-0"
          >
            <motion.img
              src={imageUrl}
              alt="Process Analysis"
              className="w-full h-full object-contain rounded-lg"
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