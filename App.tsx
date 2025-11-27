import React, { useState, useEffect } from 'react';
import { LectureCard } from './components/LectureCard';
import { RecordingView } from './components/RecordingView';
import { LectureView } from './components/LectureView';
import { LectureData, ProcessingStatus } from './types';
import { processLecture } from './services/geminiService';
import { Plus, GraduationCap, Search } from 'lucide-react';

const App: React.FC = () => {
  const [lectures, setLectures] = useState<LectureData[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'lecture'>('dashboard');
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [searchQuery, setSearchQuery] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('classcore_lectures');
    if (saved) {
      try {
        setLectures(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load lectures", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('classcore_lectures', JSON.stringify(lectures));
  }, [lectures]);

  const handleProcess = async (audioBlob: Blob) => {
    setProcessingStatus(ProcessingStatus.PROCESSING);
    try {
      const newLecture = await processLecture(audioBlob);
      // Add duration approx based on file size if not available, or update later
      newLecture.durationSeconds = Math.round(audioBlob.size / 16000); // Rough estimate
      
      setLectures(prev => [newLecture, ...prev]);
      setProcessingStatus(ProcessingStatus.COMPLETED);
      setSelectedLectureId(newLecture.id);
      setCurrentView('lecture');
      setSearchQuery(''); // Clear search on new lecture
    } catch (error) {
      console.error(error);
      alert("Failed to process lecture. Please check your API Key and connection.");
      setProcessingStatus(ProcessingStatus.ERROR);
    } finally {
       // Reset status after a delay if we didn't switch views (error case)
       if (processingStatus === ProcessingStatus.ERROR) {
           setProcessingStatus(ProcessingStatus.IDLE);
       }
    }
  };

  const selectedLecture = lectures.find(l => l.id === selectedLectureId);

  const filteredLectures = lectures.filter(lecture =>
    lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecture.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Logic
  if (currentView === 'lecture' && selectedLecture) {
    return (
      <LectureView 
        lecture={selectedLecture} 
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedLectureId(null);
        }} 
      />
    );
  }

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
           <div className="max-w-6xl mx-auto flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white">
               <GraduationCap size={24} />
             </div>
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">ClassCore</h1>
           </div>
        </header>
        <div className="px-4 md:px-6">
          <RecordingView 
            onCancel={() => {
              if (processingStatus !== ProcessingStatus.PROCESSING) {
                  setCurrentView('dashboard');
              }
            }}
            onProcess={handleProcess}
            status={processingStatus}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg text-white shadow-lg shadow-blue-200 shrink-0">
               <GraduationCap size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight">ClassCore</h1>
              <p className="hidden md:block text-xs text-slate-500 font-medium">Student Success Platform</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentView('create')}
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} /> New Lecture
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Search Bar */}
        {lectures.length > 0 && (
          <div className="mb-6 md:mb-8">
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-all"
                placeholder="Search lectures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">
            {searchQuery ? 'Search Results' : 'Recent Lectures'}
          </h2>
          <span className="text-xs md:text-sm text-slate-500 bg-white px-2 md:px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {filteredLectures.length} {filteredLectures.length === 1 ? 'Lecture' : 'Lectures'}
          </span>
        </div>

        {lectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center px-4">
            <div className="bg-blue-50 p-4 rounded-full text-blue-500 mb-4">
              <GraduationCap size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No lectures yet</h3>
            <p className="text-slate-500 max-w-sm mb-8">
              Get started by recording your first lecture or uploading an audio file to generate study materials.
            </p>
            <button 
              onClick={() => setCurrentView('create')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} /> Create First Lecture
            </button>
          </div>
        ) : filteredLectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center px-4">
            <Search className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800">No matches found</h3>
            <p className="text-slate-500 mt-1">
              We couldn't find any lectures matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 font-medium hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredLectures.map(lecture => (
              <LectureCard 
                key={lecture.id} 
                lecture={lecture} 
                onClick={(id) => {
                  setSelectedLectureId(id);
                  setCurrentView('lecture');
                }} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button */}
      {currentView === 'dashboard' && (
        <button 
          onClick={() => setCurrentView('create')}
          className="md:hidden fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 z-50 transition-transform active:scale-90"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default App;