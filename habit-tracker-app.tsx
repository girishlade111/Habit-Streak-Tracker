import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Award, BarChart2, Download, Plus, Settings } from 'lucide-react';

// Sample data structure for habits
const initialHabits = [
  { id: '1', name: 'Exercise', entries: {}, streak: 0, bestStreak: 0, color: '#FF5733' },
  { id: '2', name: 'Meditation', entries: {}, streak: 0, bestStreak: 0, color: '#33A1FD' },
  { id: '3', name: 'Reading', entries: {}, streak: 0, bestStreak: 0, color: '#33FD92' }
];

// Format date to YYYY-MM-DD string
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Get a human-readable date string
const getDateString = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default function HabitStreakTracker() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddHabitModalVisible, setAddHabitModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingHabit, setEditingHabit] = useState(null);
  
  // Load habits from localStorage on component mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      // Default habits for first-time users
      setHabits(initialHabits);
    }
  }, []);
  
  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
  }, [habits]);

  // Toggle habit completion for a specific date
  const toggleHabitCompletion = (habitId, date) => {
    const dateStr = formatDate(date);
    setHabits(prevHabits => {
      return prevHabits.map(habit => {
        if (habit.id === habitId) {
          const newEntries = { ...habit.entries };
          
          // Toggle between states: incomplete (undefined) -> completed (true) -> partial (0.5) -> incomplete
          if (!newEntries[dateStr]) {
            newEntries[dateStr] = true;
          } else if (newEntries[dateStr] === true) {
            newEntries[dateStr] = 0.5;
          } else {
            delete newEntries[dateStr];
          }
          
          // Calculate new streak
          const updatedHabit = calculateStreak({ ...habit, entries: newEntries });
          return updatedHabit;
        }
        return habit;
      });
    });
  };

  // Calculate streak for a habit
  const calculateStreak = (habit) => {
    let currentStreak = 0;
    let bestStreak = habit.bestStreak || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for streak
    let checkDate = new Date(today);
    
    // First check yesterday to see if streak is broken
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDate(checkDate);
    
    // If yesterday wasn't completed (and it's not marked as skipped), streak is reset
    if (!habit.entries[yesterdayStr] && checkDate < today) {
      currentStreak = habit.entries[formatDate(today)] ? 1 : 0;
    } else {
      // Count backwards until we find a day that wasn't completed
      checkDate = new Date(today);
      let streakBroken = false;
      
      while (!streakBroken) {
        const dateStr = formatDate(checkDate);
        // Consider true (completed) or 0.5 (partial) as maintaining the streak
        if (habit.entries[dateStr] === true || habit.entries[dateStr] === 0.5) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          streakBroken = true;
        }
      }
    }
    
    // Update best streak if current streak is better
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    
    return { ...habit, streak: currentStreak, bestStreak };
  };

  // Add a new habit
  const addHabit = () => {
    if (newHabitName.trim() === '') return;
    
    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName,
      entries: {},
      streak: 0,
      bestStreak: 0,
      color: getRandomColor()
    };
    
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setAddHabitModalVisible(false);
  };

  // Update an existing habit
  const updateHabit = () => {
    if (!editingHabit || newHabitName.trim() === '') return;
    
    setHabits(prevHabits => 
      prevHabits.map(habit => 
        habit.id === editingHabit.id 
          ? { ...habit, name: newHabitName } 
          : habit
      )
    );
    
    setNewHabitName('');
    setEditingHabit(null);
    setAddHabitModalVisible(false);
  };

  // Delete a habit
  const deleteHabit = (habitId) => {
    if (confirm("Are you sure you want to delete this habit? All tracking data will be lost.")) {
      setHabits(prevHabits => prevHabits.filter(habit => habit.id !== habitId));
    }
  };

  // Generate a random color for new habits
  const getRandomColor = () => {
    const colors = ['#FF5733', '#33A1FD', '#33FD92', '#A64DFF', '#FF4D94', '#FFD700', '#4CAF50'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Export habits data as CSV
  const exportHabitsAsCSV = () => {
    // Create CSV content
    let csv = 'Habit Name,Date,Status\n';
    
    habits.forEach(habit => {
      // Add entry for each date in the habit
      Object.entries(habit.entries).forEach(([date, status]) => {
        const statusText = status === true ? 'Completed' : status === 0.5 ? 'Partial' : 'Missed';
        csv += `${habit.name},${date},${statusText}\n`;
      });
    });
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'habit_tracker_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Prepare chart data for a habit
  const getChartData = (habit) => {
    // Get last 7 days
    const dates = [];
    const values = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      dates.push(dateStr.slice(5)); // MM-DD format
      
      const value = habit.entries[dateStr];
      values.push(value === true ? 1 : value === 0.5 ? 0.5 : 0);
    }
    
    return { dates, values };
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Don't allow selecting future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Helper function to get status display
  const getStatusDisplay = (status) => {
    if (status === true) return "✓";
    if (status === 0.5) return "½";
    return "";
  };

  // Calculate weekly completion rate
  const getWeeklyCompletionRate = (habit) => {
    let completed = 0;
    let partial = 0;
    let total = 0;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      
      if (date <= new Date()) {
        total++;
        const status = habit.entries[dateStr];
        if (status === true) completed++;
        else if (status === 0.5) partial += 0.5;
      }
    }
    
    return total > 0 ? ((completed + partial) / total * 100).toFixed(0) + '%' : '0%';
  };

  // Simple chart component
  const SimpleChart = ({ data, color }) => {
    const maxValue = 1; // Max value is 1 (completed)
    
    return (
      <div className="flex h-24 items-end space-x-1">
        {data.values.map((value, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-8 rounded-t-sm" 
              style={{ 
                height: `${(value / maxValue) * 80}%`, 
                backgroundColor: value > 0 ? color : '#e5e5e5',
                minHeight: value > 0 ? '4px' : '0'
              }}
            />
            <div className="text-xs mt-1 text-gray-500">{data.dates[index]}</div>
          </div>
        ))}
      </div>
    );
  };

  // Render Dashboard tab
  const renderDashboard = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Habit Streak Tracker</h1>
        <button 
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          onClick={exportHabitsAsCSV}
        >
          <Download size={18} />
        </button>
      </div>
      
      <div className="bg-blue-500 rounded-xl p-4 mb-6 text-center text-white">
        <p className="text-white text-opacity-80 text-sm">Active Habits</p>
        <p className="text-3xl font-bold">{habits.length}</p>
      </div>
      
      <div className="space-y-4 mb-20">
        {habits.map(habit => (
          <div key={habit.id} className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-800">{habit.name}</h3>
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                <Award size={16} className="text-yellow-500" />
                <span className="ml-1 text-yellow-700 font-bold">{habit.streak}</span>
              </div>
            </div>
            
            <div className="py-2">
              <SimpleChart data={getChartData(habit)} color={habit.color} />
            </div>
            
            <div className="flex justify-between mt-3 text-gray-600 text-sm">
              <p>Week: {getWeeklyCompletionRate(habit)}</p>
              <p>Best: {habit.bestStreak} days</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Calendar tab
  const renderCalendar = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={goToPreviousDay} className="p-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-medium text-gray-800">{getDateString(selectedDate)}</h2>
        <button onClick={goToNextDay} className="p-2">
          <ChevronRight size={24} className="text-gray-600" />
        </button>
      </div>
      
      <div className="space-y-3 mb-20">
        {habits.map(habit => {
          const dateStr = formatDate(selectedDate);
          const status = habit.entries[dateStr];
          
          return (
            <div 
              key={habit.id} 
              className={`flex justify-between items-center p-4 rounded-lg border-l-4 bg-white ${
                status === true ? 'border-l-4 bg-opacity-20' : 
                status === 0.5 ? 'border-l-4 bg-opacity-10' : 'border-l-4 border-gray-300'
              }`}
              style={{ 
                borderLeftColor: habit.color,
                backgroundColor: status ? `${habit.color}20` : 'white'
              }}
              onClick={() => toggleHabitCompletion(habit.id, selectedDate)}
            >
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3" 
                  style={{ backgroundColor: habit.color }}
                />
                <span className="text-gray-800 font-medium">{habit.name}</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-xl text-green-600 w-8 text-center">
                  {getStatusDisplay(status)}
                </span>
                <button 
                  className="ml-2 text-red-500 text-2xl font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit(habit.id);
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render Statistics tab
  const renderStatistics = () => (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Habit Statistics</h1>
      
      <div className="space-y-4">
        {habits.map(habit => {
          // Count total completions
          let totalCompletions = 0;
          let partialCompletions = 0;
          
          Object.values(habit.entries).forEach(status => {
            if (status === true) totalCompletions++;
            else if (status === 0.5) partialCompletions++;
          });
          
          return (
            <div key={habit.id} className="bg-white rounded-xl p-4 shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-3">{habit.name}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2">
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-lg font-bold text-gray-800">{habit.streak} days</p>
                </div>
                <div className="p-2">
                  <p className="text-sm text-gray-600">Best Streak</p>
                  <p className="text-lg font-bold text-gray-800">{habit.bestStreak} days</p>
                </div>
                <div className="p-2">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-gray-800">{totalCompletions}</p>
                </div>
                <div className="p-2">
                  <p className="text-sm text-gray-600">Partial</p>
                  <p className="text-lg font-bold text-gray-800">{partialCompletions}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Content Area */}
      <div className="pb-16">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'statistics' && renderStatistics()}
      </div>
      
      {/* Add Button */}
      <button 
        className="fixed right-6 bottom-20 w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"
        onClick={() => {
          setNewHabitName('');
          setEditingHabit(null);
          setAddHabitModalVisible(true);
        }}
      >
        <Plus size={24} />
      </button>
      
      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around">
        <button 
          className={`flex flex-col items-center py-3 px-6 ${activeTab === 'dashboard' ? 'text-blue-500 border-t-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Award size={24} />
          <span className="text-xs mt-1">Dashboard</span>
        </button>
        
        <button 
          className={`flex flex-col items-center py-3 px-6 ${activeTab === 'calendar' ? 'text-blue-500 border-t-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('calendar')}
        >
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border border-current rounded-sm flex items-center justify-center">
              <div className="text-xs font-bold">{new Date().getDate()}</div>
            </div>
          </div>
          <span className="text-xs mt-1">Calendar</span>
        </button>
        
        <button 
          className={`flex flex-col items-center py-3 px-6 ${activeTab === 'statistics' ? 'text-blue-500 border-t-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('statistics')}
        >
          <BarChart2 size={24} />
          <span className="text-xs mt-1">Stats</span>
        </button>
      </div>
      
      {/* Add/Edit Habit Modal */}
      {isAddHabitModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingHabit ? 'Edit Habit' : 'Add New Habit'}
            </h2>
            
            <input
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Habit name"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              autoFocus
            />
            
            <div className="flex space-x-3">
              <button 
                className="flex-1 bg-gray-100 py-3 rounded-lg font-medium"
                onClick={() => {
                  setAddHabitModalVisible(false);
                  setEditingHabit(null);
                }}
              >
                Cancel
              </button>
              
              <button 
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium"
                onClick={editingHabit ? updateHabit : addHabit}
              >
                {editingHabit ? 'Update' : 'Add'}
              </button>
            </div>
            
            {editingHabit && (
              <button 
                className="w-full mt-4 py-3 bg-red-50 text-red-500 rounded-lg font-medium"
                onClick={() => {
                  setAddHabitModalVisible(false);
                  deleteHabit(editingHabit.id);
                }}
              >
                Delete Habit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
