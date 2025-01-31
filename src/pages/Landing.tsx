import { SplineSceneBasic } from "@/components/demo/code.demo";
import { ChartBarIcon, Cog, RocketIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { FeaturedBlogs } from "@/components/blogs/FeaturedBlogs";
import { Link } from "react-router-dom";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { LogIn, LogOut, User } from "lucide-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const BenefitCard = ({ icon: Icon, title, description, index }: { 
  icon: React.ElementType, 
  title: string, 
  description: string,
  index: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8,
        delay: index * 0.2
      }
    }}
    viewport={{ once: true, margin: "-100px" }}
  >
    <Card className="bg-black/[0.96] p-6 flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform duration-300 border-white/10">
      <Icon className="w-8 h-8 text-blue-400" />
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-neutral-300 text-sm">{description}</p>
    </Card>
  </motion.div>
);

export default function Landing() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

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
    <div className="min-h-screen bg-black text-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        isScrolled ? 'bg-primary/80 backdrop-blur' : 'bg-primary'
      }`}>
        <div className="flex h-16 md:h-24 items-center px-4 md:px-8 max-w-[2000px] mx-auto">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/2874dd12-8a6e-4615-a3a8-0007e6b68381.png" 
                alt="AI Process Engineer Logo" 
                className="h-[40px] md:h-[60px] w-auto scale-125"
              />
            </Link>
          </div>
          <div className="flex-grow" />
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-primary/20 gap-2"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-white hover:text-white hover:bg-primary/20 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-primary/20 gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 bg-black">
        <div>
          <SplineSceneBasic />
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} {...benefit} index={index} />
            ))}
          </div>
        </div>

        <div className="mt-20 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="sticky top-24 h-fit">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Latest Insights
              </h2>
              <p className="text-neutral-300">
                Discover our latest thoughts and innovations in process engineering,
                data analysis, and continuous improvement methodologies.
              </p>
            </div>
            <div className="min-h-[600px]">
              <FeaturedBlogs />
            </div>
          </div>
        </div>

        <div className="mt-12 mb-20">
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
              <span className="block">Designed & Developed by</span>
              <span className="block mt-14">Six Sigma Master Black Belt Process Engineers</span>
            </motion.h1>
          </LampContainer>
        </div>
      </div>

      <footer className="bg-black py-8">
        <div className="container mx-auto px-4 text-center text-gray-300">
          <p>© 2024 AI Process Engineer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
