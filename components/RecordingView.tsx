import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, X, StopCircle, Play, FileAudio, Loader2 } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface Props {
  onCancel: () => void;
  onProcess: (file: Blob) => void;
  status: ProcessingStatus;
}

export const RecordingView: React.FC<Props> = ({ onCancel, onProcess, status }) => {
  const [mode, setMode] = useState<'initial' | 'recording' | 'review'>('initial');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setMode('review');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setMode('recording');
      
      // Timer
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setMode('review');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (status === ProcessingStatus.PROCESSING) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin relative z-10" />
        </div>
        <h3 className="mt-8 text-xl font-bold text-slate-800">Processing Lecture</h3>
        <p className="mt-2 text-slate-500 max-w-md">
          Gemini is analyzing the audio, generating a transcript, summarizing key points, and building your flashcards. This may take a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Add New Lecture</h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <X size={24} />
        </button>
      </div>

      {mode === 'initial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={startRecording}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <Mic size={32} />
            </div>
            <span className="font-semibold text-slate-700">Record Audio</span>
            <span className="text-sm text-slate-500 mt-1">Use your microphone</span>
          </button>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
          >
            <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <span className="font-semibold text-slate-700">Upload Audio</span>
            <span className="text-sm text-slate-500 mt-1">MP3, WAV, M4A up to 25MB</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="audio/*" 
              className="hidden" 
            />
          </div>
        </div>
      )}

      {mode === 'recording' && (
        <div className="flex flex-col items-center py-12">
          <div className="text-6xl font-mono text-slate-800 font-medium mb-8 tabular-nums">
            {formatTime(recordingDuration)}
          </div>
          <div className="relative mb-8">
             <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
             <div className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></div>
          </div>
          <button 
            onClick={stopRecording}
            className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold shadow-lg shadow-red-200 transition-all hover:scale-105"
          >
            <StopCircle size={20} /> Stop Recording
          </button>
        </div>
      )}

      {mode === 'review' && audioBlob && (
        <div className="flex flex-col items-center py-6">
          <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-blue-600">
              <FileAudio size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800">Recorded Audio</h4>
              <p className="text-sm text-slate-500">{(audioBlob.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <audio controls src={URL.createObjectURL(audioBlob)} className="h-10 w-40" />
          </div>
          
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => { setMode('initial'); setAudioBlob(null); }}
              className="flex-1 py-3 px-4 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={() => onProcess(audioBlob)}
              className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
            >
              Process Lecture
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
