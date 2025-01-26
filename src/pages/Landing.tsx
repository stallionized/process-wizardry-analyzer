import { Link } from 'react-router-dom';
import { SplineSceneBasic } from "@/components/demo/code.demo";
import { Button } from "@/components/ui/button";
import { Brain, Rocket, Settings } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] text-transparent bg-clip-text">
            AI Process Engineer
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your business processes with intelligent automation powered by advanced AI
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button className="bg-[#7E69AB] hover:bg-[#6E59A5] text-white px-8 py-6 text-lg rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* 3D Scene */}
        <div className="mb-20">
          <SplineSceneBasic />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-[#221F26] p-8 rounded-xl">
            <Brain className="w-12 h-12 text-[#9b87f5] mb-4" />
            <h3 className="text-xl font-semibold mb-3">Intelligent Analysis</h3>
            <p className="text-gray-300">
              Advanced AI algorithms analyze your processes to identify optimization opportunities
            </p>
          </div>
          <div className="bg-[#221F26] p-8 rounded-xl">
            <Rocket className="w-12 h-12 text-[#33C3F0] mb-4" />
            <h3 className="text-xl font-semibold mb-3">Rapid Implementation</h3>
            <p className="text-gray-300">
              Quick deployment of optimized processes with minimal disruption
            </p>
          </div>
          <div className="bg-[#221F26] p-8 rounded-xl">
            <Settings className="w-12 h-12 text-[#1EAEDB] mb-4" />
            <h3 className="text-xl font-semibold mb-3">Customizable Solutions</h3>
            <p className="text-gray-300">
              Tailored solutions that adapt to your unique business needs
            </p>
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