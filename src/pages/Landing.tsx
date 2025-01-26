import { Link } from 'react-router-dom';
import { SplineSceneBasic } from "@/components/demo/code.demo";
import { Button } from "@/components/ui/button";

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