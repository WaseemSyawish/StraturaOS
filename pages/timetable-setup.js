import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import HygraphSidebar from '@/components/HygraphSidebar';
import { Calendar, Clock, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { showCustomAlert } from '@/utils/dialogs';

export default function TimetableSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [schedulePatterns, setSchedulePatterns] = useState({});
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const [semester, setSemester] = useState('custom');
  const [semesterSettings, setSemesterSettings] = useState([]);
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [creating, setCreating] = useState(false);

  // Semester date ranges
  const semesterDates = {
    'custom': { start: customDates.start, end: customDates.end, label: 'Custom Date Range' },
  };

  // Add configured semesters to semesterDates
  semesterSettings.forEach(setting => {
    semesterDates[setting.id] = {
      start: setting.start_date.split('T')[0],
      end: setting.end_date.split('T')[0],
      label: setting.name
    };
  });

  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SESSION_TYPES = ['Lecture', 'Lab', 'Tutorial', 'Seminar'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      const coursesData = await coursesRes.json();
      if (coursesData.success && coursesData.courses) {
        setCourses(coursesData.courses);
        if (coursesData.courses.length === 0) {
          console.warn('No courses found for user - user should create courses in Modules page first');
        }
      } else {
        console.error('Failed to fetch courses:', coursesData.error);
      }

      // Fetch semester settings
      const semesterRes = await fetch('/api/semester-settings');
      const semesterData = await semesterRes.json();
      if (semesterData.success) {
        setSemesterSettings(semesterData.settings);
        
        // Auto-select the most appropriate semester
        if (semesterData.settings.length > 0) {
          const today = new Date();
          
          // 1. Try to find active semester
          const activeSemester = semesterData.settings.find(s => s.is_active);
          if (activeSemester) {
            setSemester(activeSemester.id);
          } else {
            // 2. Find semester containing today's date
            const currentSemester = semesterData.settings.find(s => {
              const start = new Date(s.start_date);
              const end = new Date(s.end_date);
              return today >= start && today <= end;
            });
            
            if (currentSemester) {
              setSemester(currentSemester.id);
            } else {
              // 3. Find the next upcoming semester
              const upcomingSemester = semesterData.settings
                .filter(s => new Date(s.start_date) > today)
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0];
              
              if (upcomingSemester) {
                setSemester(upcomingSemester.id);
              } else {
                // 4. Fallback to first semester
                setSemester(semesterData.settings[0].id);
              }
            }
          }
        }
      } else {
        console.warn('No semester settings found - using custom date range');
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Filter courses to show only those in the selected semester
  const getCoursesForSemester = () => {
    // Always show courses if semester is not yet selected or custom is selected
    if (!semester || semester === 'custom') {
      return courses; // Show all if custom date range selected or no semester selected yet
    }

    // If we have no courses, return empty array
    if (!courses || courses.length === 0) {
      return [];
    }

    // Find the selected semester
    const selectedSemesterData = semesterSettings.find(s => s.id === semester);
    if (!selectedSemesterData) {
      // If semester not found, show all courses as fallback
      return courses;
    }

    // Filter courses that match this semester
    // Courses might have a semester name stored, so we filter by exact match or date overlap
    return courses.filter(course => {
      // If course has a semester field matching our semester name, include it
      if (course.semester) {
        return course.semester.toLowerCase().includes(selectedSemesterData.name.toLowerCase()) ||
               selectedSemesterData.name.toLowerCase().includes(course.semester.toLowerCase());
      }
      // If no specific semester, include it (backward compatibility)
      return true;
    });
  };

  const filteredCourses = getCoursesForSemester();

  const handleNextFromStep1 = async () => {
    if (selectedCourses.length === 0) {
      await showCustomAlert('No Modules Selected', 'Please select at least one module', 'warning');
      return;
    }
    
    // Validate custom dates if selected
    if (semester === 'custom' && (!customDates.start || !customDates.end)) {
      await showCustomAlert('Missing Dates', 'Please enter custom start and end dates', 'warning');
      return;
    }
    
    if (semester === 'custom' && new Date(customDates.start) >= new Date(customDates.end)) {
      await showCustomAlert('Invalid Date Range', 'End date must be after start date', 'warning');
      return;
    }
    
    setStep(2);
  };

  const addSession = (courseId) => {
    setSchedulePatterns(prev => ({
      ...prev,
      [courseId]: [
        ...(prev[courseId] || []),
        {
          dayOfWeek: 1, // Monday default
          startTime: '09:00',
          endTime: '11:00',
          location: '',
          sessionType: 'Lecture'
        }
      ]
    }));
  };

  const updateSession = (courseId, index, field, value) => {
    setSchedulePatterns(prev => ({
      ...prev,
      [courseId]: prev[courseId].map((session, i) => 
        i === index ? { ...session, [field]: value } : session
      )
    }));
  };

  const removeSession = (courseId, index) => {
    setSchedulePatterns(prev => ({
      ...prev,
      [courseId]: prev[courseId].filter((_, i) => i !== index)
    }));
  };

  const handleNextCourse = async () => {
    const currentCourse = selectedCourses[currentCourseIndex];
    if (!schedulePatterns[currentCourse] || schedulePatterns[currentCourse].length === 0) {
      await showCustomAlert('No Sessions Added', 'Please add at least one session for this module', 'warning');
      return;
    }

    if (currentCourseIndex < selectedCourses.length - 1) {
      setCurrentCourseIndex(prev => prev + 1);
    } else {
      setStep(3);
    }
  };

  const handlePreviousCourse = () => {
    if (currentCourseIndex > 0) {
      setCurrentCourseIndex(prev => prev - 1);
    } else {
      setStep(1);
    }
  };

  const calculateTotalEvents = () => {
    let total = 0;
    const dates = semesterDates[semester];
    if (!dates) return 0;

    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const weeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000));

    selectedCourses.forEach(courseId => {
      const sessions = schedulePatterns[courseId] || [];
      total += sessions.length * weeks;
    });

    return total;
  };

  const handleCreateTimetable = async () => {
    setCreating(true);
    try {
      const dates = semesterDates[semester];
      
      // Build patterns array
      const patterns = [];
      selectedCourses.forEach(courseId => {
        const sessions = schedulePatterns[courseId] || [];
        sessions.forEach(session => {
          patterns.push({
            courseId,
            ...session,
            dayOfWeek: Number(session.dayOfWeek)
          });
        });
      });

      const response = await fetch('/api/timetable/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          semester,
          startDate: dates.start,
          endDate: dates.end,
          patterns
        })
      });

      const data = await response.json();

      if (data.success) {
        await showCustomAlert('Success!', `Created ${data.eventsCreated} timetable events`, 'success');
        router.push('/schedule');
      } else {
        await showCustomAlert('Creation Failed', data.error, 'danger');
      }
    } catch (err) {
      console.error('Create error:', err);
      await showCustomAlert('Error', 'Failed to create timetable', 'danger');
    } finally {
      setCreating(false);
    }
  };

  const currentCourse = selectedCourses[currentCourseIndex] 
    ? courses.find(c => c.id === selectedCourses[currentCourseIndex])
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Smart Timetable Creator - StraturaOS</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Smart Timetable Creator
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Create Your Schedule</h1>
            <p className="text-gray-600">Set up your entire semester in minutes</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className="font-semibold hidden sm:inline">Select Modules</span>
              </div>
              <ArrowRight className={`w-5 h-5 mx-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-300'}`} />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className="font-semibold hidden sm:inline">Define Times</span>
              </div>
              <ArrowRight className={`w-5 h-5 mx-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-300'}`} />
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="font-semibold hidden sm:inline">Review</span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* STEP 1: Select Modules */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {semesterSettings.length === 0 ? (
                      <option value="custom">Custom Date Range</option>
                    ) : (
                      <>
                        {semesterSettings.map(setting => (
                          <option key={setting.id} value={setting.id}>
                            {setting.name} {setting.is_active ? '(Active)' : ''}
                          </option>
                        ))}
                        <option value="custom">Custom Date Range</option>
                      </>
                    )}
                  </select>
                </div>

                {semester === 'custom' && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-800 mb-3">Custom Date Range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customDates.start}
                          onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customDates.end}
                          onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {semesterSettings.length === 0 && semester !== 'custom' && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      💡 <strong>Tip:</strong> Configure your semester dates in the{' '}
                      <button
                        onClick={() => router.push('/modules')}
                        className="underline font-semibold hover:text-blue-900"
                      >
                        Modules page
                      </button>
                      {' '}for easier scheduling!
                    </p>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Modules</h2>
                <p className="text-gray-600 mb-6">Choose the courses you want to add to your timetable</p>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No modules found for this semester. Add some modules first!</p>
                    <button
                      onClick={() => router.push('/modules')}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Go to Modules
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-8">
                    {filteredCourses.map(course => (
                      <label
                        key={course.id}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedCourses.includes(course.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => handleCourseToggle(course.id)}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-bold text-gray-900">{course.name}</div>
                          <div className="text-sm text-gray-600">{course.code}</div>
                        </div>
                        {selectedCourses.includes(course.id) && (
                          <CheckCircle className="w-6 h-6 text-indigo-600" />
                        )}
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t">
                  <button
                    onClick={() => router.push('/schedule')}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextFromStep1}
                    disabled={selectedCourses.length === 0}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next: Define Times
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Define Schedule */}
            {step === 2 && currentCourse && (
              <div>
                <div className="mb-6">
                  <div className="text-sm text-indigo-600 font-semibold mb-1">
                    Module {currentCourseIndex + 1} of {selectedCourses.length}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentCourse.name}</h2>
                  <p className="text-gray-600">{currentCourse.code}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {(schedulePatterns[currentCourse.id] || []).map((session, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-gray-700">Session {index + 1}</span>
                        <button
                          onClick={() => removeSession(currentCourse.id, index)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                          <select
                            value={session.sessionType}
                            onChange={(e) => updateSession(currentCourse.id, index, 'sessionType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            {SESSION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                          <select
                            value={session.dayOfWeek}
                            onChange={(e) => updateSession(currentCourse.id, index, 'dayOfWeek', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            {WEEKDAYS.map((day, idx) => (
                              <option key={idx} value={idx}>{day}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={session.startTime}
                            onChange={(e) => updateSession(currentCourse.id, index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                          <input
                            type="time"
                            value={session.endTime}
                            onChange={(e) => updateSession(currentCourse.id, index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                          <input
                            type="text"
                            value={session.location}
                            onChange={(e) => updateSession(currentCourse.id, index, 'location', e.target.value)}
                            placeholder="e.g., Room A101, Lab 3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addSession(currentCourse.id)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-semibold transition-colors"
                  >
                    + Add Another Session
                  </button>
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <button
                    onClick={handlePreviousCourse}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleNextCourse}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2"
                  >
                    {currentCourseIndex < selectedCourses.length - 1 ? 'Next Module' : 'Review'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Confirm */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Timetable</h2>
                <p className="text-gray-600 mb-6">Check everything before generating your schedule</p>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-black text-indigo-600">{selectedCourses.length}</div>
                      <div className="text-sm text-gray-600">Modules</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-indigo-600">{calculateTotalEvents()}</div>
                      <div className="text-sm text-gray-600">Events to Create</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {selectedCourses.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    const sessions = schedulePatterns[courseId] || [];
                    return (
                      <div key={courseId} className="border border-gray-200 rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 mb-3">{course.name}</h3>
                        <div className="space-y-2">
                          {sessions.map((session, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{WEEKDAYS[session.dayOfWeek]}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{session.startTime} - {session.endTime}</span>
                              <span className="ml-2 text-indigo-600">• {session.sessionType}</span>
                              {session.location && <span className="text-gray-500">@ {session.location}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <button
                    onClick={() => {
                      setCurrentCourseIndex(selectedCourses.length - 1);
                      setStep(2);
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleCreateTimetable}
                    disabled={creating}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Create Timetable
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
