import React, { useState, useEffect, useRef } from 'react';
import CustomSelect from '../src/components/CustomSelect';
import { GraduationCap, TrendingUp, Award, BookOpen, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, Tag, Scale, Check, BarChart3, Target, HelpCircle, MessageCircle, Microscope, MapPin, Download, AlertCircle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Head from 'next/head';
import GradeCalculator from '../src/components/grades/GradeCalculator';
import HygraphSidebar from '@/components/HygraphSidebar';

const GradesPage = () => {
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  // filter by course id in the UI (stringified id or 'all')
  const [filterCourseId, setFilterCourseId] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorCourse, setCalculatorCourse] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState([]);

  const [newCategory, setNewCategory] = useState({
    name: '',
    weight: '',
    type: 'assignment'
  });

  const [newItem, setNewItem] = useState({
    name: '',
    score: '',
    maxScore: 100
  });
  const [isDark, setIsDark] = useState(false);
  const catNameRef = useRef(null);
  const itemNameRef = useRef(null);
  const typeRef = useRef(null);
  const weightRef = useRef(null);
  const scoreRef = useRef(null);
  const maxScoreRef = useRef(null);

  const calculateCategoryAverage = (items) => {
    if (items.length === 0) return 0;
    const totalScore = items.reduce((sum, item) => sum + (item.score / item.maxScore * 100), 0);
    return totalScore / items.length;
  };

  const calculateCourseGrade = (categories) => {
    if (!categories || categories.length === 0) return { grade: 'N/A', percentage: 0 };
    
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    let weightedScore = 0;

    categories.forEach(cat => {
      const categoryAvg = calculateCategoryAverage(cat.items);
      weightedScore += (categoryAvg * cat.weight) / 100;
    });

    const percentage = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    
    let grade = 'F';
    if (percentage >= 93) grade = 'A';
    else if (percentage >= 90) grade = 'A-';
    else if (percentage >= 87) grade = 'B+';
    else if (percentage >= 83) grade = 'B';
    else if (percentage >= 80) grade = 'B-';
    else if (percentage >= 77) grade = 'C+';
    else if (percentage >= 73) grade = 'C';
    else if (percentage >= 70) grade = 'C-';
    else if (percentage >= 67) grade = 'D+';
    else if (percentage >= 60) grade = 'D';
    
    return { grade, percentage: percentage.toFixed(1) };
  };

  // semesters will be populated from the server-side course records
  const [semesters, setSemesters] = useState([{ value: 'all', label: 'All Semesters' }]);
  const [showDebug] = useState(typeof window !== 'undefined' ? new URL(window.location.href).searchParams.has('debug') : false);

  const filteredCourses = courses.filter(c => {
    // semester filter - handle both UUID (new system) and string (old system)
    if (selectedSemester !== 'all') {
      // Check if course.semester matches selectedSemester directly (UUID or string)
      if (c.semester !== selectedSemester) {
        // Also check if selectedSemester is a semester name and course.semester might be old format
        // This handles edge cases during transition
        const matchingSemester = semesters.find(s => s.value === selectedSemester);
        if (!matchingSemester || c.semester !== matchingSemester.label) {
          return false;
        }
      }
    }
    // course filter
    if (filterCourseId !== 'all' && String(c.id) !== String(filterCourseId)) return false;
    return true;
  });

  const getGradeBgColor = (grade) => {
    // Light mode: colorful. Dark mode: muted with subtle accents
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/20';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/20';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400 dark:border dark:border-orange-500/20';
    return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20';
  };

  const getCategoryIcon = (type) => {
    // Return Lucide icon components with per-type color accents
    const size = 'w-6 h-6';
    const colorMap = {
      exam: 'text-rose-600 dark:text-rose-400',
      quiz: 'text-amber-500 dark:text-amber-300',
      assignment: 'text-sky-600 dark:text-sky-300',
      project: 'text-purple-600 dark:text-purple-300',
      lab: 'text-green-600 dark:text-green-300',
      participation: 'text-indigo-600 dark:text-indigo-300',
      default: 'text-slate-800 dark:text-slate-100'
    };
    const cls = `${size} ${colorMap[type] || colorMap.default}`;
    switch(type) {
      case 'exam': return <FileText className={cls} />;
      case 'quiz': return <HelpCircle className={cls} />;
      case 'assignment': return <FileText className={cls} />;
      case 'project': return <Target className={cls} />;
      case 'lab': return <Microscope className={cls} />;
      case 'participation': return <MessageCircle className={cls} />;
      default: return <MapPin className={cls} />;
    }
  };

  // Options for the category type selector (used in the Add Category modal)
  const categoryTypeOptions = [
    { value: 'assignment', label: (<span className="flex items-center gap-2"><FileText className="w-4 h-4 text-sky-600 dark:text-sky-300" />Assignment</span>) },
    { value: 'quiz', label: (<span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-amber-500 dark:text-amber-300" />Quiz</span>) },
    { value: 'exam', label: (<span className="flex items-center gap-2"><FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />Exam</span>) },
    { value: 'project', label: (<span className="flex items-center gap-2"><Target className="w-4 h-4 text-purple-600 dark:text-purple-300" />Project</span>) },
    { value: 'lab', label: (<span className="flex items-center gap-2"><Microscope className="w-4 h-4 text-green-600 dark:text-green-300" />Lab</span>) },
    { value: 'participation', label: (<span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />Participation</span>) },
    { value: 'other', label: (<span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-700 dark:text-slate-300" />Other</span>) }
  ];

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.weight) return;
    
    // Calculate current total weight including the new category
    const currentTotal = (selectedCourse.categories || []).reduce((sum, cat) => sum + (parseFloat(cat.weight) || 0), 0);
    const newWeight = parseFloat(newCategory.weight);
    const futureTotal = currentTotal + newWeight;
    
    // Prevent exceeding 100%
    if (futureTotal > 100) {
      alert(`Cannot add category: Total weight would be ${futureTotal.toFixed(1)}%, which exceeds 100%.\n\nCurrent total: ${currentTotal.toFixed(1)}%\nNew category weight: ${newWeight.toFixed(1)}%\nAvailable weight: ${(100 - currentTotal).toFixed(1)}%`);
      return;
    }
    
    // Prepare local category payload
    const categoryPayload = {
      name: newCategory.name,
      weight: parseFloat(newCategory.weight),
      type: newCategory.type || 'assignment',
      items: []
    };

    setNewCategory({ name: '', weight: '', type: 'assignment' });
    setShowCategoryModal(false);

    // Persist to server: call PUT /api/grades with action add_assessment
    (async () => {
      try {
        const body = { courseId: selectedCourse.id, action: 'add_assessment', assessment: categoryPayload };
        console.log('[grades] Adding category:', categoryPayload, 'for course:', selectedCourse.id);
        const res = await fetch('/api/grades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) {
          console.error('[grades] API returned error:', res.status, res.statusText);
          throw new Error('Failed to persist category');
        }
        const js = await res.json().catch(() => null);
        console.log('[grades] API response:', js);
        if (js && js.success && js.data) {
          // server returned canonical course object with assessments array
          const updatedCategories = Array.isArray(js.data.assessments) ? js.data.assessments : (Array.isArray(js.data.categories) ? js.data.categories : []);
          console.log('[grades] Updating categories to:', updatedCategories);
          setCourses(prev => prev.map(course => course.id === selectedCourse.id ? ({ ...course, categories: updatedCategories }) : course));
          // Also update selectedCourse if it's open
          if (selectedCourse && selectedCourse.id === js.data.id) {
            setSelectedCourse({ ...selectedCourse, categories: updatedCategories });
          }
          return;
        }
        // fallback: refresh full grades list
        const listRes = await fetch('/api/grades');
        if (listRes.ok) {
          const listJs = await listRes.json().catch(() => null);
          const arr = listJs && Array.isArray(listJs.data) ? listJs.data : [];
          const found = arr.find(c => String(c.id) === String(selectedCourse.id));
          if (found) {
            const foundCategories = Array.isArray(found.assessments) ? found.assessments : (Array.isArray(found.categories) ? found.categories : []);
            setCourses(prev => prev.map(course => course.id === selectedCourse.id ? ({ ...course, categories: foundCategories }) : course));
            if (selectedCourse && selectedCourse.id === found.id) {
              setSelectedCourse({ ...selectedCourse, categories: foundCategories });
            }
          }
        }
      } catch (e) {
        console.warn('persist category failed', e);
        // On error, refresh to get actual server state
        try {
          const listRes = await fetch('/api/grades');
          if (listRes.ok) {
            const listJs = await listRes.json().catch(() => null);
            const arr = listJs && Array.isArray(listJs.data) ? listJs.data : [];
            const found = arr.find(c => String(c.id) === String(selectedCourse.id));
            if (found) {
              const foundCategories = Array.isArray(found.assessments) ? found.assessments : (Array.isArray(found.categories) ? found.categories : []);
              setCourses(prev => prev.map(course => course.id === selectedCourse.id ? ({ ...course, categories: foundCategories }) : course));
              if (selectedCourse && selectedCourse.id === found.id) {
                setSelectedCourse({ ...selectedCourse, categories: foundCategories });
              }
            }
          }
        } catch (e2) {
          console.error('Failed to refresh after error:', e2);
        }
      }
    })();
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.score || !newItem.maxScore) return;
    const item = {
      id: Date.now(),
      name: newItem.name,
      score: parseFloat(newItem.score),
      maxScore: parseFloat(newItem.maxScore)
    };

    // Optimistic UI update
    setCourses(prev => prev.map(course => course.id === selectedCourse.id ? ({ ...course, categories: course.categories.map(cat => cat.id === selectedCategory.id ? ({ ...cat, items: [...(cat.items || []), item] }) : cat) }) : course));
    setNewItem({ name: '', score: '', maxScore: 100 });
    setShowItemModal(false);

    // Persist updated assessment items to server. If the category has an id (server), update via update_assessment.
    (async () => {
      try {
        const targetCourse = courses.find(c => c.id === selectedCourse.id) || selectedCourse;
        const targetCategory = (targetCourse.categories || []).find(c => c.id === selectedCategory.id) || selectedCategory;
        // If category has an id that looks server-generated (string/uuid), use update_assessment
        if (targetCategory && targetCategory.id && typeof targetCategory.id === 'string') {
          const assessmentPayload = { id: targetCategory.id, items: [...(targetCategory.items || []), item] };
          const body = { courseId: selectedCourse.id, action: 'update_assessment', assessment: assessmentPayload };
          const res = await fetch('/api/grades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (res.ok) {
            const js = await res.json().catch(() => null);
            if (js && js.data) {
              setCourses(prev => prev.map(course => course.id === selectedCourse.id ? ({ ...course, categories: Array.isArray(js.data.assessments) ? js.data.assessments : (js.data.categories || []) }) : course));
            }
          }
        } else {
          // If category is still optimistic (numeric id), we may need to create it first via add_assessment then update items.
          const createBody = { courseId: selectedCourse.id, action: 'add_assessment', assessment: { name: targetCategory.name, weight: targetCategory.weight || 0, items: targetCategory.items || [] } };
          const createRes = await fetch('/api/grades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createBody) });
          if (createRes.ok) {
            const createJs = await createRes.json().catch(() => null);
            if (createJs && createJs.data) {
              setCourses(prev => prev.map(course => course.id === selectedCourse.id ? ({ ...course, categories: Array.isArray(createJs.data.assessments) ? createJs.data.assessments : (createJs.data.categories || []) }) : course));
            }
          }
        }
      } catch (e) {
        console.warn('persist item failed', e);
      }
    })();
  };

  const handleDeleteCategory = (courseId, categoryId) => {
    // Optimistically remove
    setCourses(prev => prev.map(course => course.id === courseId ? ({ ...course, categories: (course.categories || []).filter(c => c.id !== categoryId) }) : course));
    // If categoryId looks like a server id (string), ask server to delete
    (async () => {
      try {
        if (categoryId && typeof categoryId === 'string') {
          const body = { courseId, action: 'delete_assessment', assessment: { id: categoryId } };
          const res = await fetch('/api/grades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (res.ok) {
            const js = await res.json().catch(() => null);
            if (js && js.data) {
              setCourses(prev => prev.map(course => course.id === courseId ? ({ ...course, categories: Array.isArray(js.data.assessments) ? js.data.assessments : (js.data.categories || []) }) : course));
            }
          }
        }
      } catch (e) { console.warn('delete category failed', e); }
    })();
  };

  const handleDeleteItem = (courseId, categoryId, itemId) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? {
            ...course,
            categories: course.categories.map(cat =>
              cat.id === categoryId
                ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
                : cat
            )
          }
        : course
    ));
  };

  const toggleCategory = (courseId, categoryId) => {
    const key = `${courseId}-${categoryId}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const openCategoryModal = (course) => {
    setSelectedCourse(course);
    setShowCategoryModal(true);
  };

  const openItemModal = (course, category) => {
    setSelectedCourse(course);
    setSelectedCategory(category);
    setShowItemModal(true);
  };

  // dynamic stats (will be populated from /api/grades)
  const [stats, setStats] = useState({
    gpa: 0,
    credits: 0,
    courses: 0,
    avgGrade: 'N/A'
  });

  // Fetch courses (modules) and grades (assessments) from server, merge them where possible
  // Updated to mirror `pages/modules.js` auth check and to be resilient when grades data is absent
  useEffect(() => {
    let mounted = true;
    // Ensure certain modal inputs render white text in dark mode even when other CSS overrides exist
    const applyInputColors = () => {
      try {
        const darkNow = typeof document !== 'undefined' && (document.documentElement.classList.contains('dark') || window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        // update state so render can apply inline styles
        setIsDark(!!darkNow);

        // We'll dynamically read the computed styles from the Type CustomSelect's inner button
        // so other inputs copy the exact visual (including focus-specific outlines).
        const csElem = (typeof document !== 'undefined') ? document.getElementById('grades-cat-type') : null;

        const setColor = (el) => {
          if (!el) return;
          if (darkNow) {
            try {
              // Normal inline styles for text color
              el.style.color = '#ffffff';
              el.style.caretColor = '#ffffff';
              el.style.textShadow = '0 0 1px rgba(255,255,255,0.02)';
              el.style.WebkitTextFillColor = '#ffffff';

              // Recompute the Type control's visible outline/box-shadow now (handles focus changes)
              let csBoxShadow = '0 0 0 2px rgba(255,255,255,0.04)';
              let csBorderColor = 'rgba(255,255,255,0.12)';
              let csOutline = '1px solid rgba(255,255,255,0.45)';
              try {
                const csButton = csElem ? (csElem.querySelector('button[aria-haspopup]') || csElem.querySelector('button')) : null;
                const source = csButton || csElem;
                if (source) {
                  const comp = window.getComputedStyle(source);
                  if (comp) {
                    if (comp.boxShadow) csBoxShadow = comp.boxShadow || csBoxShadow;
                    if (comp.borderColor) csBorderColor = comp.borderColor || csBorderColor;
                    if (comp.outline) csOutline = comp.outline || csOutline;
                  }
                }
              } catch (e) {}

              // Apply the computed values to match Type control exactly
              el.style.boxShadow = csBoxShadow;
              el.style.borderColor = csBorderColor;
              el.style.outline = csOutline;

              // Also set with priority to override UA/autofill styles
              el.style.setProperty('color', '#ffffff', 'important');
              el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
              el.style.setProperty('caret-color', '#ffffff', 'important');
              el.style.setProperty('text-shadow', '0 0 1px rgba(255,255,255,0.02)', 'important');
              el.style.setProperty('box-shadow', csBoxShadow, 'important');
              el.style.setProperty('border-color', csBorderColor, 'important');
              el.style.setProperty('outline', csOutline, 'important');
            } catch (e) {}
          } else {
            try {
              el.style.color = '';
              el.style.caretColor = '';
              el.style.textShadow = '';
              el.style.WebkitTextFillColor = '';
              el.style.boxShadow = '';
              el.style.borderColor = '';
              el.style.outline = '';
              el.style.removeProperty('color');
              el.style.removeProperty('-webkit-text-fill-color');
              el.style.removeProperty('caret-color');
              el.style.removeProperty('text-shadow');
              el.style.removeProperty('box-shadow');
              el.style.removeProperty('border-color');
              el.style.removeProperty('outline');
            } catch (e) {}
          }
        };

        // Apply immediately (including the CustomSelect wrapper by id)
        setColor(catNameRef.current);
        setColor(itemNameRef.current);
        setColor(typeRef.current);
        setColor(weightRef.current);
        setColor(scoreRef.current);
        setColor(maxScoreRef.current);
        // CustomSelect wrapper has id 'grades-cat-type'
        try { setColor(document.getElementById('grades-cat-type')); } catch (e) {}

        // Re-apply shortly after (handles autofill and late UA style application)
        setTimeout(() => {
          setColor(catNameRef.current);
          setColor(itemNameRef.current);
          setColor(typeRef.current);
          setColor(weightRef.current);
          setColor(scoreRef.current);
          setColor(maxScoreRef.current);
          try { setColor(document.getElementById('grades-cat-type')); } catch (e) {}
        }, 120);

        // Ensure color is reapplied on focus (some browsers style focused input differently)
        [catNameRef.current, itemNameRef.current, typeRef.current, weightRef.current, scoreRef.current, maxScoreRef.current].forEach(el => {
          if (!el) return;
          el.addEventListener('focus', () => setColor(el));
          el.addEventListener('input', () => setColor(el));
        });
        // Also attach focus listeners to the CustomSelect wrapper/button
        try {
          const cs = document.getElementById('grades-cat-type');
          if (cs) {
            cs.addEventListener('focusin', () => setColor(cs));
            cs.addEventListener('click', () => setColor(cs));
            try {
              const csBtn = cs.querySelector('button[aria-haspopup]') || cs.querySelector('button');
              if (csBtn) {
                csBtn.addEventListener('focus', () => setColor(csBtn));
                csBtn.addEventListener('click', () => setColor(csBtn));
              }
            } catch (e) {}
          }
        } catch (e) {}
      } catch (e) {}
    };
    // Apply once now
    applyInputColors();
    // Watch for html dark class changes
    let mo;
    try {
      mo = new MutationObserver(applyInputColors);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    async function loadAll() {
      setLoading(true);
      try {
        const me = await fetch('/api/auth/me');
        // Don't redirect on auth failure, just continue loading data
        
        // Fetch courses and grades; tolerate missing grades endpoint
        const [coursesResP, gradesResP] = await Promise.allSettled([
          fetch('/api/courses'),
          fetch('/api/grades')
        ]);

        let coursesBody = { success: false, courses: [] };
        let gradesBody = { success: false, data: [] };

        if (coursesResP.status === 'fulfilled' && coursesResP.value.ok) {
          try { coursesBody = await coursesResP.value.json(); } catch(e) { coursesBody = { success: false, courses: [] }; }
        }

        if (gradesResP.status === 'fulfilled' && gradesResP.value.ok) {
          try { gradesBody = await gradesResP.value.json(); } catch(e) { gradesBody = { success: false, data: [] }; }
        } else {
          // In dev environments where auth tokens may not be present, try a smoke-user fallback
          try {
            if (typeof window !== 'undefined') {
              const host = window.location.hostname;
              if (host === 'localhost' || host === '127.0.0.1' || host === '') {
                const fallback = await fetch('/api/grades?userId=smoke_user');
                if (fallback && fallback.ok) {
                  try { gradesBody = await fallback.json(); } catch (e) { /* ignore */ }
                }
              }
            }
          } catch (e) { /* ignore */ }
        }

        const serverCourses = Array.isArray(coursesBody.courses) ? coursesBody.courses : [];
        const serverGrades = Array.isArray(gradesBody.data) ? gradesBody.data : [];

        // Merge by id when possible; fallback to matching by code or name
        const merged = serverCourses.map(sc => {
          const match = serverGrades.find(gc => (gc.id && sc.id && gc.id === sc.id) || (gc.code && sc.code && gc.code === sc.code) || (gc.name && sc.name && gc.name === sc.name));
          return {
            // prefer canonical module fields from /api/courses
            ...sc,
            // IMPORTANT: Always use assessments/categories from grades API (match), not from courses API
            // The courses API doesn't have grade/assessment data - only the grades API does
            categories: match && (match.assessments || match.categories) ? (match.assessments || match.categories) : [],
            // keep credits/semester from module record if present
            credits: sc.credits ?? (match && match.credits) ?? 0,
            semester: sc.semester ?? (match && match.semester) ?? null
          };
        });

        // also include any grade-only entries that don't have a module record yet
        const gradeOnly = serverGrades.filter(gc => !merged.some(m => (m.id && gc.id && m.id === gc.id) || (m.code && gc.code && m.code === gc.code)) ).map(gc => ({
          ...gc,
          categories: Array.isArray(gc.assessments) ? gc.assessments : (Array.isArray(gc.categories) ? gc.categories : [])
        }));

        const allCourses = [...merged, ...gradeOnly];

        if (!mounted) return;
        setCourses(allCourses);

        // Fetch semester settings from the new dynamic system
        let semesterSettings = [];
        try {
          const semRes = await fetch('/api/semester-settings');
          if (semRes.ok) {
            const semData = await semRes.json();
            if (semData.success && Array.isArray(semData.semesters)) {
              semesterSettings = semData.semesters;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch semester settings:', e);
        }

        // Build semester dropdown from semester_settings table
        if (semesterSettings.length > 0) {
          // Use the new dynamic semester system
          const built = [
            { value: 'all', label: 'All Semesters' },
            ...semesterSettings.map(sem => ({
              value: sem.id, // Use semester ID for filtering
              label: sem.name // Display semester name
            }))
          ];
          setSemesters(built);
        } else {
          // Fallback: derive from course semester fields (backward compatibility)
          const semesterTokens = Array.from(new Set(allCourses.map(c => c.semester).filter(Boolean)));

          const humanize = (s) => {
            // If it looks like a UUID (8-4-4-4-12 format), don't humanize it - it's an ID that shouldn't be shown
            if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s)) {
              return s; // Return UUID as-is (though this shouldn't be shown to users)
            }
            const m = String(s).match(/^(\d{4})-(\d)$/);
            if (m) return `${m[1]}/${Number(m[1]) + 1} - Semester ${m[2]}`;
            return String(s).replace(/[-_]/g, ' ');
          };

          const built = [
            { value: 'all', label: 'All Semesters' }, 
            ...semesterTokens.map(s => ({ value: s, label: humanize(s) }))
          ];
          setSemesters(built);
        }

        // compute credits and courses count
        const creditsSum = allCourses.reduce((s, c) => s + (c.credits ? Number(c.credits) : 0), 0);
        const coursesCount = allCourses.length;

        // compute average grade percentage if possible (reuse existing logic)
        const percentages = allCourses.map(c => {
          const cats = c.categories || [];
          if (!cats || cats.length === 0) return null;
          let totalWeight = 0;
          let weighted = 0;
          for (const cat of cats) {
            const weight = Number(cat.weight || 0);
            totalWeight += weight;
            const items = cat.items || [];
            if (!items.length) continue;
            const avg = items.reduce((ss, it) => ss + ((it.score || it.grade || 0) / (it.maxScore || it.maxGrade || 100) * 100), 0) / items.length;
            weighted += (avg * weight) / 100;
          }
          if (totalWeight === 0) return null;
          return (weighted / totalWeight) * 100;
        }).filter(p => p !== null && !isNaN(p));

        const avgPercentage = percentages.length ? (percentages.reduce((s, v) => s + v, 0) / percentages.length) : null;
        const avgGrade = avgPercentage !== null ? (function(p) {
          if (p >= 93) return 'A';
          if (p >= 90) return 'A-';
          if (p >= 87) return 'B+';
          if (p >= 83) return 'B';
          if (p >= 80) return 'B-';
          if (p >= 77) return 'C+';
          if (p >= 73) return 'C';
          if (p >= 70) return 'C-';
          if (p >= 67) return 'D+';
          if (p >= 60) return 'D';
          return 'F';
        })(avgPercentage) : 'N/A';

        setStats(prev => ({ ...prev, credits: creditsSum, courses: coursesCount, avgGrade }));
      } catch (err) {
        console.warn('Failed to load modules/grades from API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; if (mo) mo.disconnect(); };
  }, []);

  return (
    <HygraphSidebar>
    <div className="min-h-screen relative z-10 text-slate-900 dark:text-slate-100 dark:bg-slate-900">
      <Head>
        <title>Grade Calculator & Predictor — University Planner</title>
      </Head>
      <style dangerouslySetInnerHTML={{__html: `
        /* Modal form text coloring: keep white in dark mode, black in light mode */
        html.dark #grades-cat-name,
        html.dark #grades-cat-type,
        html.dark #grades-item-name,
        html.dark .dark-mode-input {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          text-shadow: 0 0 1px rgba(255,255,255,0.03) !important;
        }

        /* Ensure explicit black text in light mode so overlays/components with stronger CSS don't force another color */
        html:not(.dark) #grades-cat-name,
        html:not(.dark) #grades-cat-type,
        html:not(.dark) #grades-item-name,
        html:not(.dark) .dark-mode-input {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          caret-color: #000000 !important;
          text-shadow: none !important;
        }

        /* Make placeholder text darker grey for modal forms (all inputs/selects/textareas inside modal overlays) */
        html.dark .fixed.inset-0 input::placeholder,
        html.dark .fixed.inset-0 textarea::placeholder,
        html.dark .fixed.inset-0 select::placeholder {
          color: rgba(203, 213, 225, 0.9) !important;
          opacity: 1 !important;
        }
      `}} />
      {/* Navbar: consistent with Calendar/Overview styling */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full">
              <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Animated icon container */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                      <GraduationCap className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    {/* Spinning ring around icon */}
                    <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-2xl animate-spin"></div>
                  </div>
                  
                  {/* Loading text */}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Loading your grades
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Calculating your academic progress...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Calculator-Style Stats Dashboard */}
            {courses && courses.length > 0 && (
              <div className="mb-8">
                {/* Main Calculator Display */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-8 mb-6 border border-purple-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-300">Your Academic Calculator</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Real-time grade analysis & prediction</p>
                    </div>
                  </div>
                  
                  {/* Digital Display */}
                  <div className="bg-white/60 dark:bg-slate-950/50 rounded-xl p-6 mb-6 border border-purple-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-sm font-mono text-slate-600 dark:text-slate-400 mb-2">CURRENT GPA</div>
                        <div className="text-5xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                          {stats.gpa}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>Live calculation</span>
                        </div>
                      </div>
                      
                      <div className="text-center border-l border-r border-purple-200 dark:border-slate-800">
                        <div className="text-sm font-mono text-slate-600 dark:text-slate-400 mb-2">TOTAL CREDITS</div>
                        <div className="text-5xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-tight">
                          {stats.credits}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                          <BookOpen className="w-3 h-3" />
                          <span>Accumulated</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-mono text-slate-600 dark:text-slate-400 mb-2">AVG GRADE</div>
                        <div className="text-5xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                          {stats.avgGrade}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                          <Award className="w-3 h-3" />
                          <span>Performance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions - Calculator Style Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => {
                        if (filteredCourses.length > 0) {
                          setCalculatorCourse(filteredCourses[0]);
                          setShowCalculator(true);
                        }
                      }}
                      className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl p-4 transition-all font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 active:scale-95"
                    >
                      <Target className="w-5 h-5" />
                      Grade Predictor
                    </button>
                    <button 
                      onClick={() => window.location.href = '/modules'}
                      className="bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white rounded-xl p-4 transition-all font-semibold flex items-center justify-center gap-2 border border-purple-500 active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                      Add Course
                    </button>
                    <button 
                      onClick={() => { /* Export grades functionality */ }}
                      className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl p-4 transition-all font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 active:scale-95"
                    >
                      <Download className="w-5 h-5" />
                      Export Data
                    </button>
                  </div>
                </div>
                
                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Active Courses</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredCourses.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Categories Tracked</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {filteredCourses.reduce((sum, c) => sum + c.categories.length, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Total Assessments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {filteredCourses.reduce((sum, c) => sum + c.categories.reduce((s, cat) => s + cat.items.length, 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Section: only show when there are courses available */}
            {courses && courses.length > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-64">
                  <CustomSelect
                    options={semesters}
                    value={selectedSemester}
                    onChange={(v) => setSelectedSemester(v)}
                    placeholder="Select semester"
                    className="w-full"
                    id="grades-semester-select"
                  />
                </div>

                {/* Course filter - lets user restrict view to a single module */}
                <div className="w-96">
                  <CustomSelect
                    options={[{ value: 'all', label: 'All courses' }, ...courses.map(c => ({ value: String(c.id), label: `${c.name}${c.code ? ` (${c.code})` : ''}` }))]}
                    value={String(filterCourseId)}
                    onChange={(v) => setFilterCourseId(v)}
                    placeholder="All courses"
                    className="w-full"
                    id="grades-course-select"
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-300">
                  Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Debug panel (visible when ?debug=1 in URL) */}
            {showDebug && (
              <div className="mt-6 p-4 bg-white border rounded-lg text-xs dark:bg-[#071423] dark:border-transparent">
                <h4 className="font-semibold mb-2 dark:text-slate-100">Debug: courses / semesters / stats</h4>
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  <pre className="whitespace-pre-wrap dark:text-slate-200">{JSON.stringify({ courses, semesters, stats, filteredCoursesLength: filteredCourses.length }, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <div className="max-w-2xl w-full mx-auto text-center px-6">
                  {/* Hero Card */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-8 mb-8">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-10 h-10 text-white" strokeWidth={2} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">No Courses Yet</h2>
                    <p className="text-purple-100 text-lg">Let's get you set up</p>
                  </div>

                  {/* Instructions */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 text-left border border-gray-200 dark:border-slate-700">
                    <p className="text-gray-700 dark:text-slate-300 mb-4">
                      You haven't added any courses yet. Head to the Modules Manager to create your first course.
                    </p>
                    <p className="text-gray-600 dark:text-slate-400 text-sm">
                      Once you add courses, you'll be able to track grades, manage categories, and monitor your academic progress.
                    </p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => window.location.href = '/modules'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Course
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Feature Cards */}
                  <div className="mt-12">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-6">
                      WHAT YOU CAN DO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Track Grades</h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400">Monitor your performance across all courses</p>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">View Analytics</h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400">Get insights into your academic progress</p>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Set Goals</h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400">Plan and achieve your academic targets</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCourses.map(course => {
                  const { grade, percentage } = calculateCourseGrade(course.categories);
                  const totalWeight = course.categories.reduce((sum, cat) => sum + cat.weight, 0);

                  return (
                    <div key={course.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow">
                      {/* Course Header - Calculator Display Style */}
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-white/20 text-white px-2 py-1 rounded">
                                {course.code}
                              </span>
                              <span className="text-xs font-mono bg-white/20 text-white px-2 py-1 rounded">
                                {course.credits} CR
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{course.name}</h3>
                            <p className="text-purple-100 text-sm">{course.categories.length} categories • {course.categories.reduce((s, c) => s + c.items.length, 0)} assessments</p>
                          </div>
                          
                          {/* Grade Display - Digital Calculator Style */}
                          <div className="bg-slate-900 rounded-xl p-4 min-w-[140px] text-center border-2 border-slate-700 shadow-xl">
                            <div className="text-xs font-mono text-slate-400 mb-1">GRADE</div>
                            <div className="text-4xl font-bold font-mono text-emerald-400 mb-1">
                              {grade}
                            </div>
                            <div className="text-lg font-mono text-slate-300">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        {/* Weight Progress - Calculator Style */}
                        <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Scale className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Weight Allocation</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-mono font-bold ${totalWeight === 100 ? 'text-green-600 dark:text-green-400' : totalWeight > 100 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {totalWeight}%
                              </span>
                              <span className="text-slate-400 font-mono">/</span>
                              <span className="text-slate-600 dark:text-slate-400 font-mono">100%</span>
                            </div>
                          </div>
                          <div className="relative w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                totalWeight === 100 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                  : totalWeight > 100 
                                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
                              }`}
                              style={{ width: `${Math.min(totalWeight, 100)}%` }}
                            ></div>
                            {totalWeight !== 100 && (
                              <div className="absolute top-0 right-0 h-3 w-0.5 bg-slate-400"></div>
                            )}
                          </div>
                          {totalWeight !== 100 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {totalWeight < 100 
                                ? `${(100 - totalWeight).toFixed(1)}% available for new categories`
                                : `Exceeds 100% by ${(totalWeight - 100).toFixed(1)}%`
                              }
                            </p>
                          )}
                        </div>

                        {/* Action Buttons - Calculator Style */}
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Grading Categories
                          </h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setCalculatorCourse(course);
                                setShowCalculator(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all text-sm font-semibold shadow-md active:scale-95"
                            >
                              <Calculator className="w-4 h-4" />
                              Calculate
                            </button>
                            <button 
                              onClick={() => openCategoryModal(course)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all text-sm font-semibold shadow-md active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Categories List */}
                        <div className="space-y-3">{course.categories.map(category => {
                          const categoryAvg = calculateCategoryAverage(category.items);
                          const isExpanded = expandedCategories[`${course.id}-${category.id}`];

                          return (
                            <div key={category.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">
                                      {getCategoryIcon(category.type || 'assignment')}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-bold text-slate-900 dark:text-slate-100">{category.name}</h5>
                                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded text-xs font-mono font-semibold">
                                          {category.weight}%
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                          <FileText className="w-3 h-3" />
                                          {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                          Avg: {categoryAvg.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openItemModal(course, category)}
                                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all text-sm font-semibold shadow-sm active:scale-95 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add
                                    </button>
                                    <button
                                      onClick={() => toggleCategory(course.id, category.id)}
                                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                                    >
                                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(course.id, category.id)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                                  {category.items.map(item => {
                                    const itemPercentage = (item.score / item.maxScore * 100).toFixed(1);
                                    const numPercentage = parseFloat(itemPercentage);
                                    const gradeColor = numPercentage >= 90 ? 'text-green-600 dark:text-green-400' : 
                                                      numPercentage >= 80 ? 'text-blue-600 dark:text-blue-400' : 
                                                      numPercentage >= 70 ? 'text-amber-600 dark:text-amber-400' : 
                                                      'text-red-600 dark:text-red-400';
                                    
                                    return (
                                      <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                                        <div className="flex-1">
                                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                                          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                                            {item.score} / {item.maxScore} pts
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="text-right bg-slate-900 dark:bg-slate-950 px-3 py-2 rounded-lg border-2 border-slate-700 dark:border-slate-800">
                                            <p className={`font-bold text-xl font-mono ${gradeColor}`}>{itemPercentage}%</p>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteItem(course.id, category.id, item.id)}
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {category.items.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                                      <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                                      <p className="text-sm font-medium">No assessments yet</p>
                                      <p className="text-xs mt-1">Click "Add" to create your first item</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {course.categories.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-slate-300">
                            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No categories yet. Add a grading category to get started!</p>
                          </div>
                        )}
                      </div>

                      {/* Close space-y-3 div */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-h-[85vh] bg-white dark:bg-gray-950 overflow-y-auto rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Grading Category</h3>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add a new category to track your grades</p>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Category Name
                </label>
                <input
                  type="text"
                  id="grades-cat-name"
                  placeholder="e.g., Team Meeting, Study Session"
                  ref={catNameRef}
                  className="dark-mode-input w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Type
                </label>
                <div id="grades-cat-type">
                  <CustomSelect
                    options={categoryTypeOptions}
                    value={newCategory.type}
                    onChange={(v) => setNewCategory({...newCategory, type: v})}
                    placeholder="Select type"
                    className="w-full"
                    id="grades-cat-type"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Scale className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Weight (%)
                </label>
                <input
                  type="number"
                  placeholder="20"
                  min="0"
                  max="100"
                  ref={weightRef}
                  className="dark-mode-input w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                  value={newCategory.weight}
                  onChange={(e) => setNewCategory({...newCategory, weight: e.target.value})}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">How much this category counts toward the final grade</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500 dark:bg-opacity-10 border border-blue-200 dark:border-blue-500 dark:border-opacity-30 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Course:</span> {selectedCourse.code} - {selectedCourse.name}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-[#2a2f3e] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#363b4d] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

    {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-h-[85vh] bg-white dark:bg-gray-950 overflow-y-auto rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Grading Category</h3>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add a new category to track your grades</p>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Category Name
                </label>
                <input
                  type="text"
                  id="grades-cat-name"
                  placeholder="e.g., Team Meeting, Study Session"
                  ref={catNameRef}
                  className="dark-mode-input w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Type
                </label>
                <div id="grades-cat-type">
                  <CustomSelect
                    options={categoryTypeOptions}
                    value={newCategory.type}
                    onChange={(v) => setNewCategory({...newCategory, type: v})}
                    placeholder="Select type"
                    className="w-full"
                    id="grades-cat-type"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Scale className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Weight (%)
                </label>
                <input
                  type="number"
                  placeholder="20"
                  min="0"
                  max="100"
                  ref={weightRef}
                  className="dark-mode-input w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                  value={newCategory.weight}
                  onChange={(e) => setNewCategory({...newCategory, weight: e.target.value})}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">How much this category counts toward the final grade</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500 dark:bg-opacity-10 border border-blue-200 dark:border-blue-500 dark:border-opacity-30 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Course:</span> {selectedCourse.code} - {selectedCourse.name}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-[#2a2f3e] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#363b4d] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-h-[85vh] bg-white dark:bg-gray-950 overflow-y-auto rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Item</h3>
              <button 
                onClick={() => setShowItemModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add a new grade item to this category</p>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Item Name
                </label>
                <input
                  type="text"
                  id="grades-item-name"
                  placeholder="e.g., Quiz 1, Assignment 3, Midterm"
                  ref={itemNameRef}
                  className="dark-mode-input w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Score Earned
                  </label>
                  <input
                    type="number"
                    placeholder="85"
                    min="0"
                    ref={scoreRef}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white dark:!text-white font-semibold caret-white placeholder-gray-400 dark:placeholder-gray-400"
                    value={newItem.score}
                    onChange={(e) => setNewItem({...newItem, score: e.target.value})}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Max Score
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    min="0"
                    ref={maxScoreRef}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0f1419] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white dark:!text-white font-semibold caret-white placeholder-gray-400 dark:placeholder-gray-400"
                    value={newItem.maxScore}
                    onChange={(e) => setNewItem({...newItem, maxScore: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500 dark:bg-opacity-10 border border-blue-200 dark:border-blue-500 dark:border-opacity-30 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Adding to:</span> {selectedCategory.name} ({selectedCategory.weight}%)
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium text-gray-900 dark:text-white">Course:</span> {selectedCourse.code}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowItemModal(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-[#2a2f3e] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#363b4d] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Calculator Modal */}
      {showCalculator && calculatorCourse && (
        <GradeCalculator
          categories={calculatorCourse.categories}
          onClose={() => {
            setShowCalculator(false);
            setCalculatorCourse(null);
          }}
        />
      )}
    </div>
    </HygraphSidebar>
  );
};

export default GradesPage;
