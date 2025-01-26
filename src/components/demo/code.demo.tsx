'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { GradientButton } from "@/components/ui/gradient-button"
 
export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden">      
      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 pb-12 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-blue-400 to-blue-600 mb-2">
            AI Process Engineer
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg">
            Unlock efficiency with an AI Process Engineer that analyzes every detail of your process. Automate, optimize, 
            and enhance with precision-driven recommendations.
          </p>
          <div className="mt-8">
            <GradientButton className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700">
              Watch Intro
            </GradientButton>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}