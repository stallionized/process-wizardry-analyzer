import { ChartBarIcon, Cog, RocketIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { FeaturedBlogs } from "@/components/blogs/FeaturedBlogs";
import { StickyScroll } from "@/components/ui/sticky-scroll";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

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

const processContent = [
  {
    title: "Holistic Process Comparison",
    description: "Leverage AI-driven insights to compare existing workflows across departments or product lines, identifying best practices and standardizing them for seamless operations."
  },
  {
    title: "Data-Backed Statistical Analysis",
    description: "Detect patterns in large datasets through advanced statistical models, uncovering trends, inefficiencies, and performance bottlenecks that might otherwise remain hidden."
  },
  {
    title: "Predictive Process Mining",
    description: "Automatically map out and analyze the \"as-is\" processes in real time. This approach reveals inefficiencies, anticipates future deviations, and recommends corrective actions before issues escalate."
  },
  {
    title: "Automated Control Chart Generation",
    description: "Constantly monitor key performance metrics—such as production quality or customer satisfaction—via AI-enabled control charts that provide early warnings of process variances and drive proactive decision-making."
  },
  {
    title: "Continuous Improvement Feedback Loop",
    description: "Integrate machine learning algorithms that adapt to changing market conditions or internal process modifications, ensuring that operational improvements are consistently refined and updated over time."
  },
  {
    title: "Reduced Operating Costs and Downtime",
    description: "Implement data-informed process optimizations that minimize waste, reduce lead times, and enhance resource allocation—ultimately resulting in measurable cost savings."
  },
  {
    title: "Enhanced Compliance and Risk Management",
    description: "Harness predictive models to ensure compliance with industry regulations and corporate governance standards, while mitigating risks through early detection of potential policy or process breaches."
  },
  {
    title: "Multi-Level, Enterprise-Wide Insight",
    description: "Extend process reviews from micro-level workflows to macro-level operations, enabling scalability across global units and multiple lines of business. By analyzing both day-to-day tasks and overarching supply chain flows, the AI agent delivers unified strategic oversight that drives standardized process excellence across the entire organization."
  }
];

export default function Landing() {
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
      <HeroGeometric 
        badge="AI Process Engineer"
        title1="Experience"
        title2="Process Excellence"
      />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} index={index} />
          ))}
        </div>

        <div className="mt-12">
          <StickyScroll
            content={processContent}
            imageUrl="https://i.imgur.com/c0fBC9P.png"
          />
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
      </div>

      <footer className="bg-[#000000] py-8">
        <div className="container mx-auto px-4 text-center text-gray-300">
          <p>© 2024 AI Process Engineer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
