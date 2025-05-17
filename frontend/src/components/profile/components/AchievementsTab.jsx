import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/apiConfig';
import { useToast } from '../../common/Toast';
import FitnessUpdateModal from './LearningUpdateModal';
import ConfirmDialog from '../../common/ConfirmDialog';

const AchievementsTab = ({ user, currentUser, onUserUpdated }) => {
  const { addToast } = useToast();
  const [workoutUpdates, setWorkoutUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [updateToEdit, setUpdateToEdit] = useState(null);

  const isCurrentUserProfile = user && currentUser && user.id === currentUser.id;

  useEffect(() => {
    if (user) {
      fetchWorkoutUpdates();
      fetchTemplates();
    }
  }, [user]);

  // Helper to map backend learning fields to fitness fields for UI
  const mapLearningToFitness = (data) => {
    return {
      id: data.id,
      workoutName: data.title || data.resourceName || '',
      description: data.description || '',
      muscleGroups: data.skillsLearned || [],
      duration: data.hoursSpent || '',
      caloriesBurned: data.caloriesBurned || '', // not present in backend, will be blank
      intensity: data.difficulty || '',
      category: data.category || '',
      completedAt: data.completedAt || null,
    };
  };

  const fetchWorkoutUpdates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning/updates/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workout updates');
      }

      const data = await response.json();
      // Map backend fields to fitness fields for UI
      setWorkoutUpdates(data.map(mapLearningToFitness));
    } catch (error) {
      console.error('Error fetching workout updates:', error);
      addToast('Failed to load workout updates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      // Convert learning templates to fitness templates
      const fitnessTemplates = [
        {
          title: "Cardio Workout",
          category: "CARDIO",          fields: [
            { name: "workoutName", label: "Workout Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", required: false },
            { name: "muscleGroups", label: "Muscle Groups Worked", type: "tags", required: true },
            { name: "duration", label: "Duration (minutes)", type: "number", required: true },
            { name: "intensity", label: "Intensity Level", type: "select", options: ["LOW", "MEDIUM", "HIGH"], required: true }
          ]
        },
        {
          title: "Strength Training",
          category: "STRENGTH",
          fields: [
            { name: "workoutName", label: "Workout Name", type: "text", required: true },
            { name: "description", label: "Exercises Performed", type: "textarea", required: true },
            { name: "muscleGroups", label: "Muscle Groups Worked", type: "tags", required: true },
            { name: "duration", label: "Duration (minutes)", type: "number", required: true },
            { name: "weightLifted", label: "Total Weight Lifted (kg)", type: "number", required: false },
            { name: "intensity", label: "Intensity Level", type: "select", options: ["LOW", "MEDIUM", "HIGH"], required: true }
          ]
        },
        {
          title: "Other Activity",
          category: "OTHER",          fields: [
            { name: "workoutName", label: "Activity Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", required: false },
            { name: "muscleGroups", label: "Muscle Groups Worked", type: "tags", required: true },
            { name: "duration", label: "Duration (minutes)", type: "number", required: true },
            { name: "intensity", label: "Intensity Level", type: "select", options: ["LOW", "MEDIUM", "HIGH"], required: true }
          ]
        }
      ];

      setTemplates(fitnessTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Helper to map fitness fields to backend learning fields
  const mapFitnessToLearning = (data) => {
    return {
      title: data.workoutName || data.title || '',
      description: data.description || '',
      category: data.category || '',
      resourceName: data.workoutName || data.title || '',
      difficulty: data.intensity || '',
      hoursSpent: data.duration || 0,
      completedAt: data.completedAt || null,
      skillsLearned: data.muscleGroups || [],
      caloriesBurned: data.caloriesBurned !== undefined && data.caloriesBurned !== '' ? Number(data.caloriesBurned) : null,
      id: data.id // for edit mode
    };
  };

  const handleAddWorkoutUpdate = async (workoutData) => {
    try {
      const token = localStorage.getItem('token');
      const mappedData = mapFitnessToLearning(workoutData);

      if (isEditMode && updateToEdit) {
        const response = await fetch(`${API_BASE_URL}/learning/updates/${updateToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mappedData)
        });

        if (!response.ok) {
          throw new Error('Failed to update workout progress');
        }

        const data = await response.json();
        console.log('Edit response data:', data); // Debug: log the response

        if (!data.learningUpdate) {
          addToast('Edit response missing learningUpdate. Check backend response.', 'error');
          return;
        }

        setWorkoutUpdates(prev =>
          prev.map(item => item.id === updateToEdit.id ? mapLearningToFitness(data.learningUpdate) : item)
        );

        if (onUserUpdated && data.user) {
          onUserUpdated(data.user);
        }

        addToast('Workout update edited successfully!', 'success');
      } else {
        const response = await fetch(`${API_BASE_URL}/learning/updates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mappedData)
        });

        if (!response.ok) {
          throw new Error('Failed to add workout update');
        }

        const data = await response.json();
        setWorkoutUpdates(prev => [mapLearningToFitness(data.learningUpdate), ...prev]);

        if (onUserUpdated && data.user) {
          onUserUpdated(data.user);
        }

        addToast('Workout update added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error updating workout progress:', error);
      addToast(`Failed to ${isEditMode ? 'update' : 'add'} workout update`, 'error');
    } finally {
      setShowWorkoutModal(false);
      setIsEditMode(false);
      setUpdateToEdit(null);
    }
  };

  const handleDeleteClick = (updateId) => {
    setUpdateToDelete(updateId);
    setShowDeleteConfirm(true);
  };

  const handleEditClick = (update) => {
    console.log('Edit clicked:', update); // Debug: log the update being edited
    setUpdateToEdit(update);
    setIsEditMode(true);
    setShowWorkoutModal(true);
  };

  const handleCloseModal = () => {
    setShowWorkoutModal(false);
    setIsEditMode(false);
    setUpdateToEdit(null);
  };

  const confirmDeleteWorkoutUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning/updates/${updateToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout update');
      }

      setWorkoutUpdates(prev => prev.filter(update => update.id !== updateToDelete));
      addToast('Workout update deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting workout update:', error);
      addToast('Failed to delete workout update', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setUpdateToDelete(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'CARDIO': return 'bx-run';
      case 'STRENGTH': return 'bx-dumbbell';
      default: return 'bx-cycling';
    }
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'HIGH': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const generateAchievements = () => {
    const achievements = [];

    if (workoutUpdates.length > 0) {
      achievements.push({
        title: 'First Workout',
        icon: 'bx-trophy',
        color: 'text-yellow-500',
        achieved: true
      });
    }

    const uniqueMuscleGroups = new Set();
    workoutUpdates.forEach(update =>
      update.muscleGroups?.forEach(muscle => uniqueMuscleGroups.add(muscle))
    );

    achievements.push({
      title: 'Balanced Trainer',
      icon: 'bx-body',
      color: 'text-purple-500',
      achieved: uniqueMuscleGroups.size >= 5
    });

    achievements.push({
      title: 'Fitness Addict',
      icon: 'bx-heart',
      color: 'text-blue-500',
      achieved: workoutUpdates.length >= 10
    });

    if (workoutUpdates.length >= 2) {
      const dates = workoutUpdates.map(update => new Date(update.completedAt));
      const earliestDate = new Date(Math.min(...dates));
      const latestDate = new Date(Math.max(...dates));
      const daysDifference = Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24));

      achievements.push({
        title: 'Consistent Athlete',
        icon: 'bx-calendar-check',
        color: 'text-green-500',
        achieved: daysDifference >= 30
      });
    } else {
      achievements.push({
        title: 'Consistent Athlete',
        icon: 'bx-calendar-check',
        color: 'text-green-500',
        achieved: false
      });
    }

    const totalMinutes = workoutUpdates.reduce((sum, update) => sum + (update.duration || 0), 0);
    achievements.push({
      title: 'Endurance Master',
      icon: 'bx-time',
      color: 'text-pink-500',
      achieved: totalMinutes >= 500
    });

    const hasHighIntensity = workoutUpdates.some(update => update.intensity === 'HIGH');
    achievements.push({
      title: 'Intensity Champion',
      icon: 'bx-flame',
      color: 'text-red-500',
      achieved: hasHighIntensity
    });

    return achievements;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-DarkColor"></div>
      </div>
    );
  }

  const achievements = generateAchievements();

  return (
    <div className="space-y-6">
      {/* Achievements Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Fitness Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-sm border text-center ${achievement.achieved ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'}`}
            >
              <i className={`bx ${achievement.icon} text-3xl ${achievement.achieved ? achievement.color : 'text-gray-400'} mb-2`}></i>
              <p className="text-sm font-medium">{achievement.title}</p>
              {!achievement.achieved && <p className="text-xs text-gray-500 mt-1">Not achieved yet</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Workout Progress Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Workout Progress</h2>
          {isCurrentUserProfile && (
            <button
              onClick={() => {
                setIsEditMode(false);
                setUpdateToEdit(null);
                setShowWorkoutModal(true);
              }}
              className="px-4 py-2 bg-DarkColor text-white rounded-md hover:bg-ExtraDarkColor transition-colors"
            >
              <i className='bx bx-plus mr-2'></i> Add Workout
            </button>
          )}
        </div>

        {workoutUpdates.length > 0 ? (
          <div className="space-y-4">
            {workoutUpdates.map(update => (
              <div key={update.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-DarkColor rounded-full flex items-center justify-center text-white">
                      <i className={`bx ${getCategoryIcon(update.category)} text-xl`}></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{update.workoutName || update.title}</h3>
                      <p className="text-sm text-gray-500">
                        Completed on {formatDate(update.completedAt)}
                      </p>
                    </div>
                  </div>
                  {isCurrentUserProfile && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(update)}
                        className="text-gray-400 hover:text-blue-500"
                        title="Edit this workout"
                      >
                        <i className='bx bx-edit-alt'></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(update.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete this workout"
                      >
                        <i className='bx bx-trash'></i>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  {update.description && (
                    <p className="text-gray-700 mb-3">{update.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {update.muscleGroups && update.muscleGroups.map((muscle, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {muscle}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className={`flex items-center ${getIntensityColor(update.intensity)}`}>
                      <i className='bx bx-signal-4 mr-1'></i> {update.intensity}
                    </span>
                    {update.duration && (
                      <span className="flex items-center">
                        <i className='bx bx-time mr-1'></i> {update.duration} min
                      </span>
                    )}
                    {update.caloriesBurned && (
                      <span className="flex items-center">
                        <i className='bx bx-flame mr-1'></i> {update.caloriesBurned} cal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <div className="inline-block mx-auto">
              <i className='bx bx-dumbbell text-5xl text-gray-400'></i>
            </div>
            <p className="mt-2 text-gray-600">
              {isCurrentUserProfile
                ? "You haven't tracked any workouts yet."
                : "This user hasn't shared any workouts yet."}
            </p>
            {isCurrentUserProfile && (
              <button
                onClick={() => setShowWorkoutModal(true)}
                className="mt-4 px-4 py-2 bg-DarkColor text-white rounded-md hover:bg-ExtraDarkColor"
              >
                Track Your First Workout
              </button>
            )}
          </div>
        )}

        {workoutUpdates.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-md font-semibold mb-4">Workout Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-DarkColor">{workoutUpdates.length}</div>
                <div className="text-sm text-gray-500">Total Workouts</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-DarkColor">
                  {workoutUpdates.reduce((sum, update) => sum + (update.duration || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Minutes</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-DarkColor">
                  {new Set(workoutUpdates.flatMap(update => update.muscleGroups || [])).size}
                </div>
                <div className="text-sm text-gray-500">Muscle Groups</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-DarkColor">
                  {workoutUpdates.filter(update => update.intensity === 'HIGH').length}
                </div>
                <div className="text-sm text-gray-500">High Intensity</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FitnessUpdateModal
        isOpen={showWorkoutModal}
        onClose={handleCloseModal}
        onSubmit={handleAddWorkoutUpdate}
        templates={templates}
        isEditMode={isEditMode}
        updateToEdit={updateToEdit}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteWorkoutUpdate}
        title="Delete Workout Update"
        message="Are you sure you want to delete this workout update? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AchievementsTab;
