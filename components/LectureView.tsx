import React, { useState } from 'react';
import { LectureData } from '../types';
import { ArrowLeft, Download, BookOpen, Layers, FileText, CheckCircle, HelpCircle, Lightbulb, RotateCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { jsPDF } from 'jspdf';

interface Props {
  lecture: LectureData;
  onBack: () => void;
}

export const LectureView: React.FC<Props> = ({ lecture, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'flashcards'>('summary');
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let cursorY = 20;

    const addNewPageIfNeeded = (heightNeeded: number) => {
      if (cursorY + heightNeeded > pageHeight - margin) {
        doc.addPage();
        cursorY = 20;
      }
    };

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    const titleLines = doc.splitTextToSize(lecture.title, maxLineWidth);
    doc.text(titleLines, margin, cursorY);
    cursorY += titleLines.length * 8 + 10;

    // --- Metadata ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date(lecture.date).toLocaleDateString()}`, margin, cursorY);
    cursorY += 6;
    doc.text(
      `Duration: ${lecture.durationSeconds > 0 ? Math.floor(lecture.durationSeconds / 60) + ' mins' : 'N/A'}`,
      margin,
      cursorY
    );
    cursorY += 15;

    // --- Summary ---
    addNewPageIfNeeded(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Executive Summary", margin, cursorY);
    cursorY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60);
    const summaryLines = doc.splitTextToSize(lecture.summary, maxLineWidth);
    doc.text(summaryLines, margin, cursorY);
    cursorY += summaryLines.length * 6 + 15;

    // --- Key Takeaways ---
    addNewPageIfNeeded(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Key Takeaways", margin, cursorY);
    cursorY += 10;

    lecture.takeaways.forEach((takeaway, idx) => {
      const header = `${idx + 1}. ${takeaway.point} (${takeaway.priority})`;
      
      addNewPageIfNeeded(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      const headerLines = doc.splitTextToSize(header, maxLineWidth);
      doc.text(headerLines, margin, cursorY);
      cursorY += headerLines.length * 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80);
      const explLines = doc.splitTextToSize(takeaway.explanation, maxLineWidth);
      addNewPageIfNeeded(explLines.length * 5 + 5);
      doc.text(explLines, margin, cursorY);
      cursorY += explLines.length * 5 + 8;
    });
    cursorY += 10;

    // --- Flashcards ---
    addNewPageIfNeeded(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Flashcards", margin, cursorY);
    cursorY += 10;

    lecture.flashcards.forEach((card, idx) => {
      const qText = `Q: ${card.front}`;
      const aText = `A: ${card.back}`;
      
      const qLines = doc.splitTextToSize(qText, maxLineWidth);
      const aLines = doc.splitTextToSize(aText, maxLineWidth);
      
      const heightNeeded = (qLines.length + aLines.length) * 6 + 15;
      addNewPageIfNeeded(heightNeeded);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(qLines, margin, cursorY);
      cursorY += qLines.length * 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(aLines, margin, cursorY);
      cursorY += aLines.length * 6 + 5;

      // Divider
      doc.setDrawColor(220);
      doc.line(margin, cursorY, margin + maxLineWidth, cursorY);
      cursorY += 10;
    });

    const filename = lecture.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30) + '_StudyPack.pdf';
    doc.save(filename);
  };

  const confidenceData = [
    { name: 'Confidence', value: lecture.confidenceScore },
    { name: 'Uncertainty', value: 100 - lecture.confidenceScore },
  ];
  const COLORS = ['#10b981', '#e2e8f0'];

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-none z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex gap-2">
             <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
             >
               <Download size={16} /> Export PDF
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto w-full">
        
        {/* Sidebar / Metadata (Desktop) or Top Section (Mobile) */}
        <div className="w-full md:w-80 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 bg-white md:h-full shrink-0">
          <h1 className="text-xl font-bold text-slate-900 mb-2">{lecture.title}</h1>
          <p className="text-sm text-slate-500 mb-6">{new Date(lecture.date).toLocaleString()}</p>
          
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confidence Score</h3>
            <div className="h-32 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-emerald-600">{lecture.confidenceScore}%</span>
              </div>
            </div>
            <p className="text-xs text-center text-slate-400 mt-1">Based on audio clarity</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'summary' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BookOpen size={18} /> Summary & Key Points
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transcript' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <FileText size={18} /> Full Transcript
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'flashcards' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Layers size={18} /> Flashcards ({lecture.flashcards.length})
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-slate-50 h-full overflow-hidden relative">
          
          {/* Summary View */}
          {activeTab === 'summary' && (
            <div className="h-full overflow-y-auto p-6 md:p-8 scrollbar-thin">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Lecture Summary</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{lecture.summary}</p>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Key Takeaways</h3>
                <div className="space-y-4">
                  {lecture.takeaways.map((takeaway, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                      <div className="shrink-0 mt-1">
                        <CheckCircle 
                          size={20} 
                          className={takeaway.priority === 'High' ? 'text-red-500' : takeaway.priority === 'Medium' ? 'text-orange-400' : 'text-blue-400'} 
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{takeaway.point}</h4>
                        <p className="text-sm text-slate-600 mt-1">{takeaway.explanation}</p>
                        <span className={`inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          takeaway.priority === 'High' ? 'bg-red-50 text-red-600' : takeaway.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {takeaway.priority} Priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transcript View */}
          {activeTab === 'transcript' && (
            <div className="h-full overflow-y-auto p-6 md:p-8 scrollbar-thin">
              <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-full">
                <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Verbatim Transcript</h2>
                <div className="prose prose-slate max-w-none font-mono text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                  {lecture.transcript}
                </div>
              </div>
            </div>
          )}

          {/* Flashcards View */}
          {activeTab === 'flashcards' && (
            <div className="h-full overflow-y-auto p-6 md:p-8 flex items-center justify-center bg-slate-100">
              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {lecture.flashcards.map((card, idx) => (
                  <div 
                    key={idx} 
                    className="h-72 perspective-1000 cursor-pointer group"
                    onClick={() => setFlippedCardIndex(flippedCardIndex === idx ? null : idx)}
                  >
                    <div className={`relative w-full h-full transition-all duration-700 transform-style-3d shadow-lg hover:shadow-2xl rounded-2xl ${flippedCardIndex === idx ? 'rotate-y-180' : 'group-hover:-translate-y-2'}`}>
                      
                      {/* Front: Question */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-2xl p-8 flex flex-col justify-between border border-slate-200">
                         <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Question {idx + 1}</span>
                            <HelpCircle className="text-blue-200" size={24} />
                         </div>
                         <div className="flex-1 flex items-center justify-center">
                            <p className="text-xl font-medium text-slate-800 text-center leading-snug">{card.front}</p>
                         </div>
                         <div className="flex items-center justify-center gap-2 text-xs text-blue-500 font-semibold opacity-60">
                            <RotateCw size={12} /> Click to flip
                         </div>
                      </div>

                      {/* Back: Answer */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 flex flex-col justify-between text-white shadow-inner border border-indigo-500/20">
                         <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest bg-indigo-800/30 px-2 py-1 rounded">Answer</span>
                            <Lightbulb className="text-yellow-300" size={24} />
                         </div>
                         <div className="flex-1 flex items-center justify-center">
                            <p className="text-lg text-center leading-relaxed font-medium text-indigo-50">{card.back}</p>
                         </div>
                         <div className="flex items-center justify-center gap-2 text-xs text-indigo-200 font-semibold opacity-60">
                            <RotateCw size={12} /> Click to flip back
                         </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};