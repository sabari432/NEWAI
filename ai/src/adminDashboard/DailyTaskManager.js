import React, { useState, useEffect, useCallback } from 'react';
import './DailyTaskManager.css';

import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Target, 
  Users, 
  BookOpen,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Save,
  X
} from 'lucide-react';

const DailyTaskManager = ({ 
  dailyTasks, 
  batches, 
  students, 
  onTasksUpdate, 
  apiRequest, 
  setError, 
  setSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    task: null
  });

  const levelOptions = [
    { value: 'beginner', label: 'Beginner', color: '#4CAF50' },
    { value: 'intermediate', label: 'Intermediate', color: '#FF9800' },
    { value: 'advanced', label: 'Advanced', color: '#F44336' }
  ];

  const getDefaultTask = useCallback(() => ({
    title: '',
    description: '',
    level: 'beginner',
    sentences: [''],
    target_accuracy: 80,
    time_limit: 300,
    stars_reward: 10,
    due_date: new Date().toISOString().split('T')[0],
    assigned_classes: []
  }), []);

  const openModal = (mode, task = null) => {
    setModalState({
      isOpen: true,
      mode,
      task: task || getDefaultTask()
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      task: null
    });
  };

  const handleSubmit = async (taskData) => {
    try {
      setLoading(true);
      
      // Validate task data
      const validSentences = taskData.sentences.filter(s => s.trim() !== '');
      
      if (validSentences.length === 0) {
        setError('Please add at least one sentence');
        return;
      }

      if (!taskData.title.trim()) {
        setError('Please enter a task title');
        return;
      }

      const payload = {
        ...taskData,
        sentences: validSentences
      };

      if (modalState.mode === 'edit') {
        await apiRequest('update_daily_task.php', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess('Daily task updated successfully!');
      } else {
        await apiRequest('create_daily_task.php', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess('Daily task created successfully!');
      }

      closeModal();
      onTasksUpdate();
    } catch (error) {
      setError(error.message || `Failed to ${modalState.mode} task`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await apiRequest('delete_daily_task.php', {
        method: 'POST',
        body: JSON.stringify({ id: taskId })
      });
      
      setSuccess('Task deleted successfully!');
      onTasksUpdate();
    } catch (error) {
      setError(error.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="daily-tasks-container">
      <div className="tab-header">
        <h2>Daily Tasks Management</h2>
        <button
          className="add-btn"
          onClick={() => openModal('create')}
          disabled={loading}
        >
          <Plus className="small-icon" />
          Create Task
        </button>
      </div>

      <div className="tasks-grid">
        {dailyTasks && dailyTasks.length > 0 ? (
          dailyTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span 
                  className="task-level"
                  style={{ 
                    backgroundColor: levelOptions.find(l => l.value === task.level)?.color || '#4CAF50',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                >
                  {task.level}
                </span>
              </div>
              
              <p className="task-description">{task.description}</p>
              
              <div className="task-stats">
                <div className="task-stat">
                  <Target className="small-icon" />
                  <span>{task.target_accuracy}% accuracy</span>
                </div>
                <div className="task-stat">
                  <Clock className="small-icon" />
                  <span>{formatTime(task.time_limit)}</span>
                </div>
                <div className="task-stat">
                  <Star className="small-icon" />
                  <span>{task.stars_reward} stars</span>
                </div>
              </div>

              <div className="task-meta">
                <div className="task-due">
                  <Calendar className="small-icon" />
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
                <div className="task-sentences">
                  <BookOpen className="small-icon" />
                  <span>{task.sentences?.length || 0} sentences</span>
                </div>
              </div>

              <div className="task-actions">
                <button
                  className="edit-btn"
                  onClick={() => openModal('edit', task)}
                  disabled={loading}
                >
                  <Edit className="small-icon" />
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                  disabled={loading}
                >
                  <Trash2 className="small-icon" />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-tasks">
            <p>No daily tasks created yet. Click "Create Task" to add your first task.</p>
          </div>
        )}
      </div>

      {modalState.isOpen && (
        <TaskModal
          mode={modalState.mode}
          initialTask={modalState.task}
          batches={batches}
          levelOptions={levelOptions}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

// Separate TaskModal component to prevent flickering
const TaskModal = ({ 
  mode, 
  initialTask, 
  batches, 
  levelOptions, 
  loading, 
  onSubmit, 
  onClose 
}) => {
  const [formData, setFormData] = useState(initialTask);

  // Initialize form data when modal opens
  useEffect(() => {
    setFormData(initialTask);
  }, [initialTask]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSentenceChange = (index, value) => {
    const newSentences = [...formData.sentences];
    newSentences[index] = value;
    setFormData(prev => ({
      ...prev,
      sentences: newSentences
    }));
  };

  const handleClassToggle = (classId) => {
    const isAssigned = formData.assigned_classes.includes(classId);
    setFormData(prev => ({
      ...prev,
      assigned_classes: isAssigned 
        ? prev.assigned_classes.filter(id => id !== classId)
        : [...prev.assigned_classes, classId]
    }));
  };

  const handleAddSentence = () => {
    setFormData(prev => ({
      ...prev,
      sentences: [...prev.sentences, '']
    }));
  };

  const handleRemoveSentence = (index) => {
    const newSentences = formData.sentences.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      sentences: newSentences.length > 0 ? newSentences : ['']
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const isFormValid = formData.title.trim() && 
                     formData.sentences.filter(s => s.trim()).length > 0;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{mode === 'edit' ? 'Edit Task' : 'Create New Daily Task'}</h3>
          <button 
            type="button" 
            className="close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-level">Level</label>
              <select
                id="task-level"
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
              >
                {levelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-accuracy">Target Accuracy (%)</label>
              <input
                id="task-accuracy"
                type="number"
                min="50"
                max="100"
                value={formData.target_accuracy}
                onChange={(e) => handleInputChange('target_accuracy', parseInt(e.target.value) || 80)}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-time-limit">Time Limit (seconds)</label>
              <input
                id="task-time-limit"
                type="number"
                min="60"
                max="1800"
                value={formData.time_limit}
                onChange={(e) => handleInputChange('time_limit', parseInt(e.target.value) || 300)}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="task-stars">Stars Reward</label>
              <input
                id="task-stars"
                type="number"
                min="1"
                max="50"
                value={formData.stars_reward}
                onChange={(e) => handleInputChange('stars_reward', parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Sentences *</label>
            <div className="sentences-container">
              {formData.sentences.map((sentence, index) => (
                <div key={index} className="sentence-input-group">
                  <input
                    type="text"
                    value={sentence}
                    onChange={(e) => handleSentenceChange(index, e.target.value)}
                    placeholder={`Sentence ${index + 1}`}
                    className="sentence-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSentence(index)}
                    className="remove-sentence-btn"
                    disabled={formData.sentences.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSentence}
                className="add-sentence-btn"
              >
                <Plus size={16} />
                Add Sentence
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Assign to Classes</label>
            <div className="class-assignment-container">
              {batches && batches.length > 0 ? (
                batches.map(batch => (
                  <label key={batch.id} className="class-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.assigned_classes.includes(batch.id)}
                      onChange={() => handleClassToggle(batch.id)}
                    />
                    <span>{batch.name} - {batch.section}</span>
                  </label>
                ))
              ) : (
                <p>No classes available</p>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !isFormValid}
            >
              {loading ? 
                (mode === 'edit' ? 'Updating...' : 'Creating...') : 
                (mode === 'edit' ? 'Update Task' : 'Create Task')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyTaskManager;