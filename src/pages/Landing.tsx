import { SplineSceneBasic } from "@/components/demo/code.demo";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        {/* 3D Scene */}
        <div>
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