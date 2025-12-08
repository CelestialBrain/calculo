import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Sparkles, BrainCircuit, Sigma, Layers } from 'lucide-react';
import { FileData, AppStatus } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface InputFormProps {
  onGenerate: (topic: string, files: FileData[]) => void;
  status: AppStatus;
}

const InputForm: React.FC<InputFormProps> = ({ onGenerate, status }) => {
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 10;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const remainingSlots = MAX_FILES - files.length;
      const filesToProcess = selectedFiles.slice(0, remainingSlots);

      if (selectedFiles.length > remainingSlots) {
          alert(`You can only upload a maximum of ${MAX_FILES} files.`);
      }

      const newFiles: FileData[] = [];

      for (const file of filesToProcess) {
          const fileObj = file as File;
          const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(fileObj);
          });
          
          newFiles.push({
              name: fileObj.name,
              base64: base64,
              mimeType: fileObj.type
          });
      }

      setFiles(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === AppStatus.GENERATING_PROBLEM) return;
    onGenerate(topic, files);
  };

  const isGenerating = status === AppStatus.GENERATING_PROBLEM;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-8">
      
      {/* Topic Input with LaTeX Support */}
      <div className="group relative">
        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1 flex items-center justify-between">
          <span>Topic / Concept (Optional)</span>
          <span className="text-xs text-[#007AFF] bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
             <Sigma size={12} /> LaTeX Supported
          </span>
        </label>
        <div className="relative">
             <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Optimization using $f(x) = x^2$"
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#007AFF] transition-all placeholder:text-slate-400 font-mono text-sm shadow-sm"
                disabled={isGenerating}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Sparkles size={18} />
            </div>
        </div>

        {/* Live Preview for LaTeX */}
        {topic.trim() && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide font-bold">Preview</p>
                <div className="text-sm text-slate-800">
                    <MarkdownRenderer content={topic} />
                </div>
            </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
          files.length > 0
            ? 'border-emerald-500/30 bg-emerald-50/50' 
            : 'border-slate-300 hover:border-[#007AFF] hover:bg-slate-50'
        }`}>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          disabled={isGenerating || files.length >= MAX_FILES}
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4 pointer-events-none">
           <div className={`p-4 rounded-full transition-transform shadow-sm ${files.length > 0 ? 'bg-white text-emerald-500' : 'bg-white text-slate-400'}`}>
                {files.length > 0 ? <Layers size={32} /> : <Upload size={32} />}
           </div>
           <div>
                <p className="text-slate-900 font-semibold text-lg">
                    {files.length > 0 ? 'Add more materials' : 'Upload Context Materials'}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Drag & drop tests, homework, or notes (Max {MAX_FILES})
                </p>
           </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-slate-100 rounded text-slate-500">
                              <FileText size={16} />
                          </div>
                          <span className="text-sm text-slate-700 truncate font-medium">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isGenerating}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                      >
                          <X size={14} />
                      </button>
                  </div>
              ))}
          </div>
      )}

      {/* Generate Button */}
      <button
        type="submit"
        disabled={isGenerating}
        className={`
          w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-md transition-all
          flex items-center justify-center gap-3
          ${isGenerating 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
            : 'bg-[#007AFF] hover:bg-[#0062cc] text-white hover:-translate-y-0.5 shadow-blue-500/20'
          }
        `}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Constructing Problem...</span>
          </>
        ) : (
          <>
            <BrainCircuit size={24} />
            <span>Generate Challenge</span>
          </>
        )}
      </button>
    </form>
  );
};

export default InputForm;