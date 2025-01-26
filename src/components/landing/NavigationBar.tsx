import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NavigationBarProps {
  isScrolled: boolean;
}

export const NavigationBar = ({ isScrolled }: NavigationBarProps) => {
  const navigate = useNavigate();
  
  return (
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
  );
};