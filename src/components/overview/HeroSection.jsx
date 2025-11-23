import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fadeIn } from '@/utils/animations';

/**
 * Hero Section Component
 * Blue gradient card with personalized greeting and task progress button
 * Inspired by Doozy.co dashboard design
 */
export default function HeroSection({ userName, tasksInProgress, onViewTasks }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    if (tasksInProgress === 0) return "You're all caught up! Time to relax";
    if (tasksInProgress === 1) return "You have one task to complete";
    if (tasksInProgress <= 3) return "You're making great progress";
    return "Stay focused on your goals";
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="relative overflow-hidden rounded-2xl bg-purple-600 dark:bg-purple-700 p-8 shadow-sm mb-6"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        {/* Left: Greeting */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1.5">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-white/80 text-base">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Right: Quick Stats */}
        {tasksInProgress > 0 && (
          <button
            onClick={onViewTasks}
            className="group flex items-center gap-4 px-6 py-3.5 bg-white/95 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wide">
                Tasks in Progress
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {tasksInProgress}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
