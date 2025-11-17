// src/components/grades/GradeCalculator.tsx
// "What grade do I need?" calculator for final exams/assignments

import React, { useState, useEffect } from 'react';
import { Calculator, Target, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

interface GradeItem {
  name: string;
  score: number;
  maxScore: number;
}

interface Category {
  id: string | number;
  name: string;
  weight: number;
  items: GradeItem[];
}

interface GradeCalculatorProps {
  categories: Category[];
  onClose: () => void;
}

export default function GradeCalculator({ categories, onClose }: GradeCalculatorProps) {
  const [targetGrade, setTargetGrade] = useState<number>(90); // Target percentage
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [remainingAssignment, setRemainingAssignment] = useState<string>('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [requiredScore, setRequiredScore] = useState<number | null>(null);
  const [currentGrade, setCurrentGrade] = useState<number>(0);

  // Calculate current course grade
  useEffect(() => {
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    let weightedScore = 0;

    categories.forEach(cat => {
      const categoryAvg = calculateCategoryAverage(cat.items);
      weightedScore += (categoryAvg * cat.weight) / 100;
    });

    const percentage = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    setCurrentGrade(Math.round(percentage * 10) / 10);
  }, [categories]);

  const calculateCategoryAverage = (items: GradeItem[]): number => {
    if (items.length === 0) return 0;
    const totalScore = items.reduce((sum, item) => sum + (item.score / item.maxScore * 100), 0);
    return totalScore / items.length;
  };

  const calculateRequiredScore = () => {
    if (!selectedCategory || !remainingAssignment) {
      setRequiredScore(null);
      return;
    }

    const category = categories.find(c => c.id.toString() === selectedCategory);
    if (!category) return;

    // Calculate current category average
    const currentCatAvg = calculateCategoryAverage(category.items);
    
    // Calculate what score is needed on the new item to achieve target grade
    const numExistingItems = category.items.length;
    const totalItems = numExistingItems + 1;
    
    // Current contribution from this category to overall grade
    const currentContribution = (currentCatAvg * category.weight) / 100;
    
    // Calculate contributions from other categories
    let otherCategoriesContribution = 0;
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    
    categories.forEach(cat => {
      if (cat.id !== category.id) {
        const catAvg = calculateCategoryAverage(cat.items);
        otherCategoriesContribution += (catAvg * cat.weight) / 100;
      }
    });

    // Required weighted score to achieve target
    const requiredWeightedScore = (targetGrade * totalWeight) / 100;
    
    // Required contribution from selected category
    const requiredCatContribution = requiredWeightedScore - otherCategoriesContribution;
    
    // Convert back to category percentage
    const requiredCatPercentage = (requiredCatContribution * 100) / category.weight;
    
    // Calculate required score on new item
    const sumExistingScores = category.items.reduce((sum, item) => sum + (item.score / item.maxScore * 100), 0);
    const requiredNewScore = (requiredCatPercentage * totalItems) - sumExistingScores;
    
    // Convert to actual score based on maxScore
    const requiredScore = (requiredNewScore / 100) * maxScore;
    
    setRequiredScore(Math.round(requiredScore * 10) / 10);
  };

  useEffect(() => {
    calculateRequiredScore();
  }, [targetGrade, selectedCategory, remainingAssignment, maxScore, categories]);

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const isImpossible = requiredScore !== null && (requiredScore > maxScore || requiredScore < 0);
  const isEasy = requiredScore !== null && requiredScore <= maxScore * 0.5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grade Calculator</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">What score do I need?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current Grade Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Current Grade</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{getLetterGrade(currentGrade)}</p>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{currentGrade}%</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Calculator Form */}
          <div className="space-y-5">
            {/* Target Grade */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Target className="w-4 h-4" />
                Target Grade (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={targetGrade}
                onChange={(e) => setTargetGrade(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Select Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Choose a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.weight}% of grade)
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upcoming Assignment/Exam
              </label>
              <input
                type="text"
                value={remainingAssignment}
                onChange={(e) => setRemainingAssignment(e.target.value)}
                placeholder="e.g., Final Exam"
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Max Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Possible Score
              </label>
              <input
                type="number"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Results */}
          {requiredScore !== null && selectedCategory && remainingAssignment && (
            <div className={`mt-6 rounded-xl p-6 border-2 ${
              isImpossible 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : isEasy
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-start gap-3">
                {isImpossible ? (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                ) : (
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {isImpossible ? 'Target Unreachable' : 'Required Score'}
                  </h3>
                  {isImpossible ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Unfortunately, reaching {targetGrade}% ({getLetterGrade(targetGrade)}) is not mathematically possible,
                        even with a perfect score on this assignment.
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Consider adjusting your target grade or focusing on other categories.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          To achieve <span className="font-bold">{targetGrade}%</span> ({getLetterGrade(targetGrade)}) overall, you need to score:
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {requiredScore}
                          </span>
                          <span className="text-xl text-gray-600 dark:text-gray-400">
                            / {maxScore}
                          </span>
                          <span className="text-lg text-gray-600 dark:text-gray-400 ml-2">
                            ({((requiredScore / maxScore) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      {isEasy && (
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          ✓ This is very achievable! You're in great shape.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!selectedCategory && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                Select a category and enter the upcoming assignment details to calculate what score you need.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
