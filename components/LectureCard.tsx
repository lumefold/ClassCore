import React from 'react';
import { LectureData } from '../types';
import { Clock, Calendar, ChevronRight, BarChart } from 'lucide-react';

interface Props {
  lecture: LectureData;
  onClick: (id: string) => void;
}

export const LectureCard: React.FC<Props> = ({ lecture, onClick }) => {
  const date = new Date(lecture.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div 
      onClick={() => onClick(lecture.id)}
      className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
        <ChevronRight size={20} />
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
        <Calendar size={12} />
        <span>{date}</span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-3 leading-tight line-clamp-2">
        {lecture.title}
      </h3>

      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
        {lecture.summary}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
            <Clock size={12} />
            {lecture.durationSeconds > 0 ? `${Math.floor(lecture.durationSeconds / 60)}m` : 'Audio'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100">
            <BarChart size={12} />
            {lecture.confidenceScore}% Acc
          </span>
        </div>
        
        <div className="text-xs text-blue-600 font-medium group-hover:underline">
          View Study Pack
        </div>
      </div>
    </div>
  );
};
