import React, { useRef } from 'react';
import { InsightData, SubQuestion } from '../types';

interface InsightModalProps {
  question: SubQuestion;
  insight: InsightData;
  onClose: () => void;
}

const InsightModal: React.FC<InsightModalProps> = ({ question, insight, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1A1122]/40 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-400 border border-purple-50 max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#5F259F] p-8 md:p-10 text-white flex justify-between items-center relative flex-shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none">🧠</div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl text-2xl">🔭</div>
            <div>
              <p className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-[0.2em] w-fit">Behavioral Observation</p>
              <h2 className="text-xl md:text-2xl font-black mt-1 leading-tight">{insight.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-all active:scale-90 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 overflow-y-auto scroll-smooth">
          <div className="mb-8 p-6 md:p-8 bg-purple-50 rounded-[2rem] border border-purple-100">
            <p className="text-lg md:text-xl text-[#5F259F] leading-relaxed font-medium">"{insight.text}"</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {insight.supportingData.map((data, idx) => (
              <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="text-2xl bg-white p-2.5 rounded-xl shadow-sm">{data.icon || '📊'}</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-normal">{data.label}</p>
                  <p className="text-base md:text-lg font-black text-gray-800">{data.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-purple-50">
            <div className="flex items-center gap-2">
              <span className="text-base font-normal text-gray-400">Confidence:</span>
              <span className={`px-3 py-1 rounded-lg text-base font-medium ${
                insight.confidence === 'High' ? 'bg-green-50 text-green-600' : 
                insight.confidence === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 
                'bg-red-50 text-red-600'
              }`}>{insight.confidence}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-base font-normal text-gray-400">Period:</span>
              <span className="text-base font-medium text-gray-600">{insight.dateRange}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-10 mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onClose} 
              className="w-full sm:flex-1 bg-[#5F259F] text-white py-5 rounded-2xl font-black shadow-lg hover:bg-[#4E1E83] transition-all uppercase tracking-[0.15em] text-[11px] text-center"
            >
              Continue Exploring
            </button>
            <button 
              className="w-full sm:flex-1 border-2 border-gray-200 text-gray-400 py-5 rounded-2xl font-black transition-all uppercase tracking-[0.15em] text-[10px] text-center cursor-pointer hover:bg-gray-50 active:scale-95"
            >
              Alerts & Notifications <br/><span className="text-[8px] opacity-60">(Phase 2)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;