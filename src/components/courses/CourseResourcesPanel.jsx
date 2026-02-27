import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, FileText, Link as LinkIcon, Trash2, Edit, Save, X, BookOpen, Presentation, FileCheck, MoreHorizontal } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

/**
 * Component for managing course resources (links, files, notes)
 * Displays organized by category: syllabus, slides, readings, assignments, other
 */
export default function CourseResourcesPanel({ courseId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'link',
    url: '',
    content: '',
    category: 'other'
  });

  // Category configuration
  const categories = [
    { value: 'syllabus', label: 'Syllabus', icon: FileCheck, color: 'text-blue-600' },
    { value: 'slides', label: 'Lecture Slides', icon: Presentation, color: 'text-green-600' },
    { value: 'readings', label: 'Readings', icon: BookOpen, color: 'text-purple-600' },
    { value: 'assignments', label: 'Assignments', icon: FileText, color: 'text-orange-600' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-600' }
  ];

  // Fetch resources when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      fetchResources();
    }
  }, [courseId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/course-resources?courseId=${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setResources(data.resources || []);
      } else {
        setError(data.error || 'Failed to load resources');
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.type === 'link' && !formData.url.trim()) {
      setError('URL is required for links');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, ...formData }
        : { courseId, ...formData };

      const response = await fetch('/api/course-resources', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        await fetchResources();
        resetForm();
      } else {
        setError(data.error || 'Failed to save resource');
      }
    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resource) => {
    setFormData({
      title: resource.title,
      type: resource.type,
      url: resource.url || '',
      content: resource.content || '',
      category: resource.category || 'other'
    });
    setEditingId(resource.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    // if (!confirm('Delete this resource?')) return;

    try {
      const response = await fetch(`/api/course-resources?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchResources();
      } else {
        setError(data.error || 'Failed to delete resource');
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError('Failed to delete resource');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'link',
      url: '',
      content: '',
      category: 'other'
    });
    setEditingId(null);
    setShowAddForm(false);
    setError(null);
  };

  // Group resources by category
  const resourcesByCategory = categories.map(cat => ({
    ...cat,
    items: resources.filter(r => r.category === cat.value)
  })).filter(cat => cat.items.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Course Resources</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add Resource'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              placeholder="e.g., Course Syllabus Fall 2025"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <CustomSelect
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
                options={[
                  { value: 'link', label: 'Link' },
                  { value: 'note', label: 'Note' },
                  { value: 'file', label: 'File' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={categories.map(cat => ({ value: cat.value, label: cat.label }))}
              />
            </div>
          </div>

          {formData.type === 'link' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="input w-full"
                placeholder="https://..."
                required={formData.type === 'link'}
              />
            </div>
          )}

          {formData.type === 'note' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input w-full"
                rows={4}
                placeholder="Enter your notes here..."
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="btn"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Resource'}
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {resourcesByCategory.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No resources added yet</p>
          <p className="text-sm">Add links, files, or notes to organize your course materials</p>
        </div>
      )}

      {resourcesByCategory.map(category => (
        <div key={category.value} className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <category.icon className={`w-4 h-4 ${category.color}`} />
            {category.label}
          </h4>
          <div className="space-y-2">
            {category.items.map(resource => (
              <div
                key={resource.id}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {resource.type === 'link' && <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      {resource.type === 'note' && <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      <h5 className="font-medium text-gray-900 truncate">{resource.title}</h5>
                    </div>
                    
                    {resource.type === 'link' && resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        {resource.url.length > 50 ? resource.url.substring(0, 50) + '...' : resource.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {resource.type === 'note' && resource.content && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {resource.content}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(resource)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
