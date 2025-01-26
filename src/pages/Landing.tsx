import { SplineSceneBasic } from "@/components/demo/code.demo";
import { ChartBarIcon, Cog, LogIn, RocketIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSessionContext } from '@supabase/auth-helpers-react';

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
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const { session } = useSessionContext();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

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
      {/* Fixed Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 h-16 flex items-center justify-between transition-colors duration-300 ${
        isScrolled ? 'bg-black/70 backdrop-blur-sm' : 'bg-black'
      }`}>
        <div>
          <img 
            src="/lovable-uploads/2874dd12-8a6e-4615-a3a8-0007e6b68381.png" 
            alt="ProcessAI Logo" 
            className="h-8 w-auto"
          />
        </div>
        <Button
          variant="ghost"
          className="text-white hover:text-white/80"
          onClick={() => navigate('/auth')}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </nav>

      {/* Main Content with top padding to account for fixed nav */}
      <div className="container mx-auto px-4 pt-24">
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
  );
}