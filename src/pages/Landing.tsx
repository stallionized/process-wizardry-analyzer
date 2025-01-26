import { SplineSceneBasic } from "@/components/demo/code.demo";
import { ChartBarIcon, Cog, RocketIcon, ShieldCheck, LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const BenefitCard = ({ icon: Icon, title, description }: { 
  icon: React.ElementType, 
  title: string, 
  description: string 
}) => (
  <Card className="bg-black/[0.96] p-6 flex flex-col items-center text-center space-y-4">
    <Icon className="w-8 h-8 text-blue-400" />
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <p className="text-neutral-300 text-sm">{description}</p>
  </Card>
);

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const benefits = [
    {
      icon: ChartBarIcon,
      title: "Data-Driven Optimization",
      description: "Transform raw process data into actionable insights for continuous improvement"
    },
    {
      icon: Cog,
      title: "Precision Control",
      description: "Maintain exceptional accuracy and consistency across all process parameters"
    },
    {
      icon: RocketIcon,
      title: "Enhanced Efficiency",
      description: "Accelerate processes while reducing resource consumption and waste"
    },
    {
      icon: ShieldCheck,
      title: "Quality Assurance",
      description: "Proactively identify and prevent quality issues before they impact production"
    }
  ];

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Landing-specific Menu */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-black/60 backdrop-blur-sm" : "bg-black"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/2874dd12-8a6e-4615-a3a8-0007e6b68381.png" 
                alt="AI Process Engineer Logo" 
                className="h-10 w-auto"
              />
            </div>
            <Link to="/auth">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content with padding to account for fixed nav */}
      <div className="pt-16">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8">
          {/* 3D Scene */}
          <div>
            <SplineSceneBasic />
          </div>

          {/* Benefits Section */}
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <BenefitCard key={index} {...benefit} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#221F26] mt-20 py-8">
          <div className="container mx-auto px-4 text-center text-gray-300">
            <p>© 2024 AI Process Engineer. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}