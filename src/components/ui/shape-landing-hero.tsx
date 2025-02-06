import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { GradientButton } from "@/components/ui/gradient-button";

const title1 = "Experience";
const title2 = "Process Excellence";
const description =
  "Crafting exceptional process experiences through innovative design and cutting-edge technology.";

export const HeroGeometric = () => {
    return (
        <div className="h-[40vh] w-full bg-black/90 dark:bg-grid-white/[0.05] relative flex flex-col items-center justify-center overflow-hidden rounded-md antialiased">
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            <div className="relative flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="jumbo absolute -inset-[10px] opacity-50" />
                </div>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {
                            opacity: 0,
                            y: 30,
                        },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                duration: 0.5,
                            },
                        },
                    }}
                >
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 block">
                            {title1}
                        </span>
                        <span
                            className={cn(
                                "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 block"
                            )}
                        >
                            {title2}
                        </span>
                    </h1>
                    <p className="max-w-2xl text-base md:text-lg text-white/80 mb-6">
                        {description}
                    </p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <GradientButton variant="variant">
                            Book Demo
                        </GradientButton>
                    </motion.div>
                </motion.div>
            </div>
            <style jsx>{`
                .jumbo {
                    background: linear-gradient(to right, #24243e, #302b63, #0f0c29);
                    filter: blur(30px);
                    z-index: -1;
                }
            `}</style>
        </div>
    );
}

export { HeroGeometric }