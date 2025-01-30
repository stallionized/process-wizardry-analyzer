import { SplineSceneBasic } from "@/components/demo/code.demo";
import { ChartBarIcon, Cog, RocketIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { FeaturedBlogs } from "@/components/blogs/FeaturedBlogs";
import { Link } from "react-router-dom";
import { format } from "date-fns";

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
      <div className="container mx-auto px-4 pt-24">
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

        <div className="mt-20 mb-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left mb-12"
            >
              <h2 className="text-5xl font-bold mb-6">Topics that get you thinking</h2>
              <p className="text-xl text-neutral-400 max-w-2xl">
                Explore thought-provoking insights on process engineering, data analysis, 
                and continuous improvement methodologies. Join us in building more 
                efficient and scalable workflows.
              </p>
              <Link to="/blogs">
                <Button 
                  variant="outline" 
                  className="mt-8 text-white border-white/20 hover:bg-white/10"
                >
                  VIEW ALL POSTS
                </Button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 gap-12">
              <BlogPreview
                date="12.1.2024"
                title="The Importance of Process Engineering: Building the Backbone of Business Success"
                description="Explore the transformative power of process engineering, from ideation to implementation, for efficient and scalable workflows."
              />
              <BlogPreview
                date="12.1.2024"
                title="Motivated and Loyal Team Members"
                description="Motivate and inspire loyalty by leading through team members' values, aligning their strengths with personal purpose."
              />
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

      <footer className="bg-[#000000] py-8">
        <div className="container mx-auto px-4 text-center text-gray-300">
          <p>© 2024 AI Process Engineer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const BlogPreview = ({ date, title, description }: { 
  date: string; 
  title: string; 
  description: string; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="group"
  >
    <div className="flex flex-col md:flex-row justify-between items-start gap-8 p-6 rounded-lg hover:bg-white/5 transition-colors">
      <div className="md:w-32 text-sm text-neutral-400">
        {date}
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-semibold mb-4 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);