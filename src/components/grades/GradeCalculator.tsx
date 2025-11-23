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
  const [mode, setMode] = useState<'overall' | 'category'>('overall');
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
    if (mode === 'category') {
      // CATEGORY MODE: Simple mental math "I have 2 9/10s, what if I get 7/10 next?"
      if (!selectedCategory) {
        setRequiredScore(null);
        return;
      }

      const category = categories.find(c => c.id.toString() === selectedCategory);
      if (!category) return;

      const existingItems = category.items || [];
      
      // Convert each item to percentage: score/maxScore * 100
      const existingPercentages = existingItems.map(item => (item.score / item.maxScore * 100));
      const existingSum = existingPercentages.reduce((sum, pct) => sum + pct, 0);
      
      // Solve: (existingSum + X) / (existingItems.length + 1) = targetGrade
      // X = targetGrade * (existingItems.length + 1) - existingSum
      const totalItems = existingItems.length + 1;
      const requiredPercent = (targetGrade * totalItems) - existingSum;
      
      // Convert percentage back to actual score out of maxScore
      const requiredActualScore = (requiredPercent / 100) * maxScore;
      setRequiredScore(Math.round(requiredActualScore * 10) / 10);
    } else {
      // OVERALL MODE: Calculate what's needed on a specific assignment to reach target overall grade
      if (!selectedCategory) {
        setRequiredScore(null);
        return;
      }

      const category = categories.find(c => c.id.toString() === selectedCategory);
      if (!category) return;

      const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
      const requiredWeightedScore = (targetGrade * totalWeight) / 100;

      // Calculate contribution from other categories
      let otherCategoriesContribution = 0;
      categories.forEach(cat => {
        if (cat.id !== category.id) {
          const catAvg = calculateCategoryAverage(cat.items);
          otherCategoriesContribution += (catAvg * cat.weight) / 100;
        }
      });

      // What this category needs to contribute
      const requiredCategoryContribution = requiredWeightedScore - otherCategoriesContribution;
      const requiredCategoryPercentage = (requiredCategoryContribution * 100) / category.weight;

      // Simple averaging within this category: (existing + new) / total = required
      const existingItems = category.items || [];
      const existingPercentages = existingItems.map(item => (item.score / item.maxScore * 100));
      const existingSum = existingPercentages.reduce((sum, pct) => sum + pct, 0);
      
      const totalItems = existingItems.length + 1;
      const requiredPercent = (requiredCategoryPercentage * totalItems) - existingSum;
      
      const requiredActualScore = (requiredPercent / 100) * maxScore;
      setRequiredScore(Math.round(requiredActualScore * 10) / 10);
    }
  };

  useEffect(() => {
    calculateRequiredScore();
  }, [mode, targetGrade, selectedCategory, maxScore, categories]);

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
  
  const getImpossibleMessage = () => {
    if (!selectedCategory || requiredScore === null) return '';
    
    const category = categories.find(c => c.id.toString() === selectedCategory);
    if (!category) return '';
    
    if (requiredScore > maxScore) {
      // Calculate what average you'd need on all remaining items
      const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
      const requiredWeightedScore = (targetGrade * totalWeight) / 100;
      
      let otherCategoriesContribution = 0;
      categories.forEach(cat => {
        if (cat.id !== category.id) {
          const catAvg = cat.items.length > 0 ? calculateCategoryAverage(cat.items) : 0;
          otherCategoriesContribution += (catAvg * cat.weight) / 100;
        }
      });
      
      const requiredCatContribution = requiredWeightedScore - otherCategoriesContribution;
      const requiredCatPercentage = (requiredCatContribution * 100) / category.weight;
      
      return `To reach ${targetGrade}%, you'd need an average of ${Math.round(requiredCatPercentage)}% across all remaining ${category.name} items. Consider adjusting your target or improving scores in other categories.`;
    } else if (requiredScore < 0) {
      return `You've already exceeded your target! Your current performance ensures you'll achieve ${targetGrade}% even with a 0 on this item.`;
    }
    
    return '';
  };

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

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('overall')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                mode === 'overall'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Overall Grade
            </button>
            <button
              onClick={() => setMode('category')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                mode === 'category'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Single Category
            </button>
          </div>

          {/* Calculator Form */}
          <div className="space-y-5">
            {/* Explanation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              {mode === 'overall' ? (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Overall mode:</strong> Calculate what you need on a specific assignment to reach your target overall course grade.
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Takes into account category weights and all existing grades.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Simple averaging:</strong> "I have two 9/10s, what if I get a 7/10 next? = (9+9+7)/3 = 8.33"
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Pick a category, enter your target average, and see what score you need on the next item.
                  </p>
                </>
              )}
            </div>

            {/* Target Grade */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Target className="w-4 h-4" />
                {mode === 'overall' ? 'Target Overall Grade (%)' : 'Target Category Average (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={targetGrade}
                onChange={(e) => setTargetGrade(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {mode === 'overall' 
                  ? 'The overall course grade you want to achieve (e.g., 90%)' 
                  : 'The average you want in this category (e.g., 80% average in Quizzes)'}
              </p>
            </div>

            {/* Category Selection */}
            {
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pick the specific category you want to calculate for.</p>
              </div>
            }

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upcoming Item Name
              </label>
              <input
                type="text"
                value={remainingAssignment}
                onChange={(e) => setRemainingAssignment(e.target.value)}
                placeholder="e.g., Final Exam, Quiz 3"
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Name of the assignment/exam you're calculating for.</p>
            </div>

            {/* Max Score */}
            {
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total points possible for this item (e.g., 100 for a test).</p>
              </div>
            }
          </div>

          {/* Results */}
          {requiredScore !== null && selectedCategory && (
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
                        {getImpossibleMessage()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          {mode === 'overall' 
                            ? <>To achieve <span className="font-bold">{targetGrade}%</span> overall in the course, you need:</>
                            : <>To achieve <span className="font-bold">{targetGrade}%</span> average in this category, you need:</>
                          }
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
                Select a category to see what score you need on your next item.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
