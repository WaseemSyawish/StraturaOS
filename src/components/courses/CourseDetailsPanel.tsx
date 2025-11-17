import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Video, 
  ExternalLink, 
  Plus, 
  Edit2, 
  Trash2,
  FileText,
  Link as LinkIcon,
  Save,
  Calendar,
  BookOpen,
  Presentation,
  FileCheck,
  MoreHorizontal
} from 'lucide-react';

interface CourseContact {
  email?: string;
  phone?: string;
  officeLocation?: string;
  officeHours?: string;
  zoomLink?: string;
}

interface CourseResource {
  id: string;
  title: string;
  url?: string;
  content?: string;
  type: string; // 'link', 'file', 'note'
  category: string; // 'syllabus', 'slides', 'readings', 'assignments', 'other'
  order?: number;
}

interface CourseDetailsData {
  contact?: CourseContact;
  resources?: CourseResource[];
}

interface CourseDetailsPanelProps {
  course: any;
  onClose: () => void;
  onUpdate: () => void;
}

const CourseDetailsPanel: React.FC<CourseDetailsPanelProps> = ({ course, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'resources'>('contact');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Contact info state
  const [contactInfo, setContactInfo] = useState<CourseContact>({
    email: '',
    phone: '',
    officeLocation: '',
    officeHours: '',
    zoomLink: ''
  });
  
  // Resources state
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [newResource, setNewResource] = useState({ title: '', url: '', content: '', type: 'link', category: 'other' });
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [loadingResources, setLoadingResources] = useState(false);

  // Category configuration
  const categories = [
    { value: 'syllabus', label: 'Syllabus', icon: FileCheck, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'slides', label: 'Lecture Slides', icon: Presentation, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'readings', label: 'Readings', icon: BookOpen, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'assignments', label: 'Assignments', icon: FileText, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  ];

  // Load course details on mount
  useEffect(() => {
    if (course.description) {
      try {
        const parsed = JSON.parse(course.description);
        if (parsed.contact) setContactInfo(parsed.contact);
      } catch (e) {
        // If description is not JSON, it's just text - ignore
      }
    }
    // Load resources from dedicated API
    fetchResources();
  }, [course]);

  const fetchResources = async () => {
    if (!course.id) return;
    try {
      setLoadingResources(true);
      const response = await fetch(`/api/course-resources?courseId=${course.id}`);
      const data = await response.json();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      const existingData = course.description ? JSON.parse(course.description) : {};
      const updatedData = {
        ...existingData,
        contact: contactInfo
      };

      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: JSON.stringify(updatedData)
        })
      });

      if (!response.ok) throw new Error('Failed to save contact info');
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Failed to save contact information');
    } finally {
      setSaving(false);
    }
  };

  const handleAddResource = async () => {
    if (!newResource.title.trim()) {
      alert('Please provide a title');
      return;
    }

    if (newResource.type === 'link' && !newResource.url.trim()) {
      alert('Please provide a URL for links');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/course-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          title: newResource.title,
          type: newResource.type,
          url: newResource.url || null,
          content: newResource.content || null,
          category: newResource.category
        })
      });

      if (!response.ok) throw new Error('Failed to add resource');
      
      await fetchResources();
      setNewResource({ title: '', url: '', content: '', type: 'link', category: 'other' });
      setShowAddResource(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Delete this resource?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/course-resources?id=${resourceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete resource');
      
      await fetchResources();
      onUpdate();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    } finally {
      setSaving(false);
    }
  };

  const getResourceIcon = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo?.icon || LinkIcon;
  };

  const getResourceColor = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo?.color || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{course.name}</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {course.code} {course.instructor && `• ${course.instructor}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'contact'
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Contact & Hours
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'resources'
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Resources
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Professor Information</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>

                  {/* Display Contact Info */}
                  <div className="space-y-3">
                    {contactInfo.email && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Email</p>
                          <a href={`mailto:${contactInfo.email}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                            {contactInfo.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {contactInfo.phone && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Phone</p>
                          <a href={`tel:${contactInfo.phone}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                            {contactInfo.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {contactInfo.officeLocation && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Office Location</p>
                          <p className="text-sm text-slate-900 dark:text-slate-100">{contactInfo.officeLocation}</p>
                        </div>
                      </div>
                    )}

                    {contactInfo.officeHours && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Office Hours</p>
                          <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line">{contactInfo.officeHours}</p>
                        </div>
                      </div>
                    )}

                    {contactInfo.zoomLink && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <Video className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-slate-400 mb-1">Online Meeting</p>
                          <a 
                            href={contactInfo.zoomLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            Join Meeting <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {!contactInfo.email && !contactInfo.phone && !contactInfo.officeLocation && !contactInfo.officeHours && !contactInfo.zoomLink && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">No contact information added yet</p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="mt-3 text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium"
                        >
                          Add contact details
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" /> Email
                      </label>
                      <input
                        type="email"
                        value={contactInfo.email || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        placeholder="professor@university.edu"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" /> Phone
                      </label>
                      <input
                        type="tel"
                        value={contactInfo.phone || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" /> Office Location
                      </label>
                      <input
                        type="text"
                        value={contactInfo.officeLocation || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, officeLocation: e.target.value })}
                        placeholder="Building A, Room 305"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" /> Office Hours
                      </label>
                      <textarea
                        value={contactInfo.officeHours || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, officeHours: e.target.value })}
                        placeholder="Monday & Wednesday: 2:00 PM - 4:00 PM&#10;Friday: 10:00 AM - 12:00 PM"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        <Video className="w-4 h-4 inline mr-1" /> Zoom/Meeting Link
                      </label>
                      <input
                        type="url"
                        value={contactInfo.zoomLink || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, zoomLink: e.target.value })}
                        placeholder="https://zoom.us/j/123456789"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveContact}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium"
                      >
                        {saving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Course Resources</h3>
                <button
                  onClick={() => setShowAddResource(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
              </div>

              {/* Add Resource Form */}
              {showAddResource && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    placeholder="Resource title (e.g., Course Syllabus)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newResource.type}
                      onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="link">Link</option>
                      <option value="note">Note</option>
                      <option value="file">File</option>
                    </select>

                    <select
                      value={newResource.category}
                      onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="syllabus">Syllabus</option>
                      <option value="slides">Lecture Slides</option>
                      <option value="readings">Readings</option>
                      <option value="assignments">Assignments</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {newResource.type === 'link' && (
                    <input
                      type="url"
                      value={newResource.url}
                      onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                      placeholder="URL (https://...)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                    />
                  )}

                  {newResource.type === 'note' && (
                    <textarea
                      value={newResource.content}
                      onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                      placeholder="Enter your notes here..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 resize-none"
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddResource}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddResource(false);
                        setNewResource({ title: '', url: '', content: '', type: 'link', category: 'other' });
                      }}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Resources List */}
              <div className="space-y-2">
                {loadingResources && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                )}

                {!loadingResources && resources.length === 0 && !showAddResource && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">No resources added yet</p>
                  </div>
                )}

                {!loadingResources && resources.map((resource) => {
                  const categoryInfo = categories.find(c => c.value === resource.category);
                  const Icon = categoryInfo?.icon || LinkIcon;
                  const colorClass = categoryInfo?.color || 'bg-gray-100 text-gray-600';
                  
                  return (
                    <div
                      key={resource.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{resource.title}</p>
                        {resource.type === 'link' && resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 truncate mt-1"
                          >
                            {resource.url.length > 50 ? resource.url.substring(0, 50) + '...' : resource.url}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        )}
                        {resource.type === 'note' && resource.content && (
                          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                            {resource.content}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPanel;
