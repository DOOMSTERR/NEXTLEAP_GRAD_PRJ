import React, { useState, useEffect } from 'react';
import { Transaction, Pillar, MainQuestion, SubQuestion, InsightData } from './types';
import { PILLARS, SAMPLE_CSV, SAMPLE_BANK_TEXT } from './constants';
import { detectAndParse, processWithDeduplication } from './services/parser';
import { generateInsight } from './services/analyzer';
import InsightModal from './components/InsightModal';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [duplicates, setDuplicates] = useState<Transaction[]>([]);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [selectedMainQuestionId, setSelectedMainQuestionId] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<SubQuestion | null>(null);
  const [currentInsight, setCurrentInsight] = useState<InsightData | null>(null);
  const [uploadOverlay, setUploadOverlay] = useState<'idle' | 'options' | 'text'>('idle');
  const [pastedText, setPastedText] = useState('');
  const [repoTab, setRepoTab] = useState<'all' | 'duplicates'>('all');
  const [chatInput, setChatInput] = useState('');
  const [showPhase2Popup, setShowPhase2Popup] = useState(false);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isModalOpen = activeQuestion !== null || uploadOverlay !== 'idle' || showPhase2Popup;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeQuestion, uploadOverlay, showPhase2Popup]);

  // Load data on mount
  useEffect(() => {
    const savedTxs = localStorage.getItem('spend-sensei-txs');
    const savedDupes = localStorage.getItem('spend-sensei-dupes');
    if (savedTxs) {
      try {
        const parsed = JSON.parse(savedTxs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed);
        }
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }
    if (savedDupes) {
      try {
        const parsed = JSON.parse(savedDupes);
        if (Array.isArray(parsed)) setDuplicates(parsed);
      } catch (e) {}
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('spend-sensei-txs', JSON.stringify(transactions));
      localStorage.setItem('spend-sensei-dupes', JSON.stringify(duplicates));
    } else {
      localStorage.removeItem('spend-sensei-txs');
      localStorage.removeItem('spend-sensei-dupes');
    }
  }, [transactions, duplicates]);

  const handleIngestion = (newBatch: Transaction[]) => {
    const { unique, duplicates: foundDupes } = processWithDeduplication(transactions, newBatch);
    if (unique.length > 0) {
      setTransactions(prev => [...prev, ...unique]);
    }
    if (foundDupes.length > 0) {
      setDuplicates(prev => [...prev, ...foundDupes]);
    }
    setUploadOverlay('idle');
    setPastedText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = detectAndParse(content);
      handleIngestion(parsed);
    };
    reader.readAsText(file);
  };

  const useSampleData = () => {
    const parsed = detectAndParse(SAMPLE_CSV);
    const messy = detectAndParse(SAMPLE_BANK_TEXT);
    handleIngestion([...parsed, ...messy]);
  };

  const refreshData = () => {
    if (window.confirm("Refresh and start fresh? This will clear all data and take you back to the home page.")) {
      // Complete state wipe to force the "Your spending story" view
      setTransactions([]);
      setDuplicates([]);
      setSelectedPillarId(null);
      setSelectedMainQuestionId(null);
      setActiveQuestion(null);
      setCurrentInsight(null);
      setRepoTab('all');
      setPastedText('');
      setUploadOverlay('idle');
      setChatInput('');
      
      // Clear persistence
      localStorage.removeItem('spend-sensei-txs');
      localStorage.removeItem('spend-sensei-dupes');
      
      // Force scroll reset
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const openQuestion = (q: SubQuestion) => {
    setActiveQuestion(q);
    setCurrentInsight(generateInsight(q.id, transactions));
  };

  const selectedPillar = PILLARS.find(p => p.id === selectedPillarId);
  const selectedMainQuestion = selectedPillar?.mainQuestions.find(m => m.id === selectedMainQuestionId);

  return (
    <div className="min-h-screen bg-[#FBFAFD] text-[#1A1122] font-sans overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-40 border-b border-purple-100/50 px-4 md:px-8 py-4 shadow-sm flex-shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none group"
            onClick={() => { setSelectedPillarId(null); setSelectedMainQuestionId(null); }}
          >
            <div className="bg-[#5F259F] p-2 rounded-xl text-white shadow-lg group-active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h1 className="text-lg font-black tracking-tight text-[#5F259F]">SPEND SENSEI</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {transactions.length > 0 && (
              <button 
                onClick={refreshData}
                className="p-2.5 text-gray-400 hover:text-[#5F259F] hover:bg-purple-50 rounded-xl transition-all active:scale-90"
                title="Refresh and Start Fresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            )}
            <button 
              onClick={() => setUploadOverlay('options')}
              className="bg-[#5F259F] text-white px-4 md:px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#4E1E83] transition-all"
            >
              Add Entries
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-5xl mx-auto p-4 md:p-10 flex-grow w-full ${transactions.length > 0 ? 'mb-24' : ''}`}>
        {transactions.length === 0 ? (
          /* Empty State - Onboarding (HOME PAGE) */
          <div className="h-[calc(100dvh-120px)] md:h-auto flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 md:mb-16">
              <h2 className="text-3xl md:text-6xl font-black text-[#5F259F] leading-tight tracking-tight px-4">Your spending story.</h2>
              <p className="text-gray-400 max-w-md mx-auto mt-2 text-sm md:text-lg px-6">Decode your data with a non-judgmental financial mentor.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 w-full max-w-4xl px-4 mt-8 md:mt-12 overflow-hidden">
              {/* CSV CARD */}
              <div className="bg-white p-5 md:p-10 md:pb-12 rounded-[2rem] border border-purple-50 flex flex-row md:flex-col items-center gap-4 md:gap-0 group hover:border-[#5F259F]/30 transition-all shadow-sm h-full">
                <div className="text-3xl md:text-5xl md:mb-8 p-3 bg-purple-50 rounded-2xl">📄</div>
                <div className="text-left md:text-center flex-grow md:mb-14">
                  <h3 className="font-black text-sm md:text-lg">CSV Upload</h3>
                  <p className="text-[10px] md:text-sm text-gray-400">Net banking exports.</p>
                </div>
                <label className="bg-[#5F259F] text-white px-5 md:px-10 py-3 md:py-[9px] rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs cursor-pointer shadow-lg uppercase tracking-widest text-center transition-all hover:bg-[#4E1E83] active:scale-95">
                  FILE
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {/* TEXT CARD */}
              <div className="bg-white p-5 md:p-10 md:pb-12 rounded-[2rem] border border-purple-50 flex flex-row md:flex-col items-center gap-4 md:gap-0 group hover:border-[#5F259F]/30 transition-all shadow-sm h-full">
                <div className="text-3xl md:text-5xl md:mb-8 p-3 bg-purple-50 rounded-2xl">📝</div>
                <div className="text-left md:text-center flex-grow md:mb-14">
                  <h3 className="font-black text-sm md:text-lg">Text Scan</h3>
                  <p className="text-[10px] md:text-sm text-gray-400">Paste bank text.</p>
                </div>
                <button onClick={() => setUploadOverlay('text')} className="bg-[#5F259F] text-white px-5 md:px-10 py-3 md:py-[9px] rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs shadow-lg uppercase tracking-widest transition-all hover:bg-[#4E1E83] active:scale-95">
                  PASTE
                </button>
              </div>

              {/* DEMO CARD */}
              <div className="bg-white p-5 md:p-10 md:pb-12 rounded-[2rem] border border-purple-50 flex flex-row md:flex-col items-center gap-4 md:gap-0 group hover:border-[#5F259F]/30 transition-all shadow-sm h-full">
                <div className="text-3xl md:text-5xl md:mb-8 p-3 bg-purple-50 rounded-2xl">🪄</div>
                <div className="text-left md:text-center flex-grow md:mb-14">
                  <h3 className="font-black text-sm md:text-lg">Quick Demo</h3>
                  <p className="text-[10px] md:text-sm text-gray-400">Try sample data.</p>
                </div>
                <button onClick={useSampleData} className="border-2 border-[#5F259F] text-[#5F259F] px-5 md:px-10 py-3 md:py-[8px] rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all hover:bg-purple-50 active:scale-95">
                  DEMO
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Dashboard Pillars */}
            {!selectedPillarId && (
              <>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Financial Pillars</h2>
                    <p className="text-gray-400 mt-1 font-medium text-sm">Select a theme to reveal patterns.</p>
                  </div>
                  <div className="bg-purple-50 px-4 py-2 rounded-xl text-[10px] font-black text-[#5F259F] uppercase tracking-widest border border-purple-100 w-fit">
                    {transactions.length} Records
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 mb-8">
                  {PILLARS.map(pillar => (
                    <div 
                      key={pillar.id}
                      onClick={() => setSelectedPillarId(pillar.id)}
                      className="cursor-pointer group flex flex-col h-full bg-white p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-purple-50 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 min-h-[140px] md:min-h-0"
                    >
                      <div className="text-4xl md:text-6xl mb-3 md:mb-8 group-hover:scale-110 transition-transform origin-left">{pillar.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-base md:text-2xl font-black mb-1 md:mb-3 text-gray-800 leading-tight">{pillar.title}</h3>
                        <p className="text-gray-400 text-[11px] md:text-sm leading-relaxed mb-4 line-clamp-2 md:line-clamp-none">{pillar.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-[#5F259F] font-black text-[10px] md:text-xs uppercase tracking-widest pt-3 md:pt-6 border-t border-purple-50 mt-auto">
                        <span>Analysis</span>
                        <div className="bg-purple-50 p-1.5 md:p-2 rounded-full group-hover:bg-[#5F259F] group-hover:text-white transition-all shadow-sm">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Drill Down Flow */}
            {selectedPillarId && !selectedMainQuestionId && (
              <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-in slide-in-from-right-8 duration-500 mb-8">
                <button 
                  onClick={() => setSelectedPillarId(null)}
                  className="flex items-center gap-2 text-[#5F259F] font-black uppercase tracking-widest text-[10px] hover:bg-purple-50 w-fit px-4 py-2 rounded-full transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  Home
                </button>
                <div className="bg-[#5F259F] p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-[6rem] md:text-[10rem] select-none pointer-events-none">{selectedPillar?.icon}</div>
                  <h3 className="text-xl md:text-3xl font-black mb-2">{selectedPillar?.title}</h3>
                  <p className="text-purple-200 text-xs md:text-base font-medium leading-relaxed">{selectedPillar?.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {selectedPillar?.mainQuestions.map(mq => (
                    <button
                      key={mq.id}
                      onClick={() => setSelectedMainQuestionId(mq.id)}
                      className="group flex items-center justify-between p-5 md:p-8 bg-white hover:bg-purple-50/50 border border-purple-50 rounded-2xl md:rounded-[2rem] text-left transition-all shadow-sm active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl md:text-2xl p-2 bg-purple-50 rounded-xl">{mq.icon || selectedPillar.icon}</span>
                        <span className="text-base md:text-xl font-black text-gray-800">{mq.title}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl group-hover:bg-[#5F259F] group-hover:text-white shadow-sm border border-purple-50 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedPillarId && selectedMainQuestionId && (
              <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-in slide-in-from-right-8 duration-500 mb-8">
                <button 
                  onClick={() => setSelectedMainQuestionId(null)}
                  className="flex items-center gap-2 text-[#5F259F] font-black uppercase tracking-widest text-[10px] hover:bg-purple-50 w-fit px-4 py-2 rounded-full transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  Back
                </button>
                <div className="bg-purple-50 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-purple-100 flex items-center gap-4 md:gap-6 shadow-sm">
                  <div className="text-3xl md:text-5xl">{selectedMainQuestion?.icon || selectedPillar?.icon}</div>
                  <div>
                    <h3 className="text-base md:text-xl font-black text-[#5F259F]">{selectedMainQuestion?.title}</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Behavioral Deep Dive</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {selectedMainQuestion?.questions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => openQuestion(q)}
                      className="group flex items-center justify-between p-5 md:p-7 bg-white hover:bg-[#5F259F] border border-purple-50 rounded-2xl md:rounded-[2rem] text-left transition-all shadow-sm active:scale-[0.98]"
                    >
                      <span className="text-sm md:text-lg font-black text-gray-800 group-hover:text-white transition-colors leading-tight">{q.label}</span>
                      <div className="bg-purple-50 p-2 rounded-lg group-hover:bg-white/20 group-hover:text-white shadow-inner transition-all">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Repository Section */}
            <div className="mt-8 md:mt-16 bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-12 border border-purple-50 shadow-sm overflow-hidden mb-20 md:mb-0">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10 gap-4">
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-gray-800">Transaction Repository</h3>
                  <div className="flex gap-2 mt-3 bg-purple-50/50 p-1 rounded-xl w-fit border border-purple-100/50">
                    <button 
                      onClick={() => setRepoTab('all')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${repoTab === 'all' ? 'bg-[#5F259F] text-white shadow-md' : 'text-gray-400 hover:text-purple-600'}`}
                    >
                      All ({transactions.length})
                    </button>
                    {duplicates.length > 0 && (
                      <button 
                        onClick={() => setRepoTab('duplicates')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${repoTab === 'duplicates' ? 'bg-[#333] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Duplicates ({duplicates.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-[#5F259F] uppercase tracking-[0.1em]">Database Active</span>
                </div>
              </div>

              {/* Mobile Card List */}
              <div className="block md:hidden space-y-3">
                {(repoTab === 'all' ? transactions : duplicates).slice(-15).reverse().map(tx => (
                  <div key={tx.id} className="bg-purple-50/30 p-4 rounded-2xl border border-purple-50/50 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{tx.date}</span>
                      <span className={`text-sm font-black ${tx.amount < 0 ? 'text-gray-900' : 'text-green-600'}`}>
                        {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-black text-[#5F259F] uppercase tracking-tight line-clamp-2 leading-tight">
                      {tx.description}
                    </div>
                    <div className="mt-1">
                      <span className="bg-white text-[#5F259F] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-purple-100 shadow-sm">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Web Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-b border-purple-50">
                      <th className="pb-6">Date</th>
                      <th className="pb-6">Narrative</th>
                      <th className="pb-6">Class</th>
                      <th className="pb-6 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50/50">
                    {(repoTab === 'all' ? transactions : duplicates).slice(-20).reverse().map(tx => (
                      <tr key={tx.id} className="hover:bg-purple-50/30 transition-all group">
                        <td className="py-6"><div className="text-[10px] font-bold text-gray-400">{tx.date}</div></td>
                        <td className="py-6"><div className="text-sm font-bold text-gray-700 max-w-sm truncate uppercase tracking-tight group-hover:text-[#5F259F] transition-colors">{tx.description}</div></td>
                        <td className="py-6"><span className="bg-purple-50 text-[#5F259F] px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-purple-100/50">{tx.category}</span></td>
                        <td className={`py-6 text-base font-black text-right ${tx.amount < 0 ? 'text-gray-800' : 'text-green-600'}`}>
                          {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chat Bot Bar */}
      {transactions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-purple-100 z-30">
          <div className="max-w-3xl mx-auto flex items-center gap-2 bg-purple-50 p-2 rounded-2xl border border-purple-100 shadow-inner">
            <input 
              type="text" 
              placeholder="Ask Sensei" 
              className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-medium text-gray-700"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && setShowPhase2Popup(true)}
            />
            <button 
              onClick={() => {
                if(chatInput.trim()) {
                  setShowPhase2Popup(true);
                }
              }}
              disabled={!chatInput.trim()}
              className={`p-3 rounded-xl transition-all shadow-sm ${chatInput.trim() ? 'bg-[#5F259F] text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Overlay */}
      {uploadOverlay !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-[#1A1122]/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 md:zoom-in-95 duration-400">
            <button onClick={() => setUploadOverlay('idle')} className="absolute top-8 right-8 text-gray-300 hover:text-purple-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-[#5F259F] p-3 rounded-2xl text-white shadow-lg text-2xl">🧠</div>
              <div>
                <h3 className="text-2xl font-black text-[#5F259F]">Sensei Ingest</h3>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Universal Parser Engine</p>
              </div>
            </div>

            {uploadOverlay === 'options' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8 md:pb-0">
                <label className="cursor-pointer bg-purple-50 p-6 md:p-8 rounded-3xl border border-purple-100 flex flex-col items-center hover:bg-white hover:border-[#5F259F] transition-all group active:scale-95 h-full">
                  <span className="text-4xl mb-4">📂</span>
                  <span className="text-[10px] font-black text-[#5F259F] uppercase">CSV Import</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={() => setUploadOverlay('text')} className="bg-purple-50 p-6 md:p-8 rounded-3xl border border-purple-100 flex flex-col items-center hover:bg-white hover:border-[#5F259F] transition-all group active:scale-95 h-full">
                  <span className="text-4xl mb-4">📝</span>
                  <span className="text-[10px] font-black text-[#5F259F] uppercase">Paste Text</span>
                </button>
                <button onClick={useSampleData} className="bg-purple-50 p-6 md:p-8 rounded-3xl border border-purple-100 flex flex-col items-center hover:bg-white hover:border-[#5F259F] transition-all group active:scale-95 h-full">
                  <span className="text-4xl mb-4">🪄</span>
                  <span className="text-[10px] font-black text-[#5F259F] uppercase">Demo Batch</span>
                </button>
              </div>
            ) : (
              <div className="animate-in zoom-in-95 duration-200 pb-8 md:pb-0">
                <textarea 
                  className="w-full h-64 p-6 md:p-8 bg-gray-50 border-2 border-transparent rounded-[1.5rem] md:rounded-[2rem] font-mono text-xs focus:border-[#5F259F] focus:bg-white transition-all outline-none resize-none shadow-inner leading-relaxed"
                  placeholder="Paste bank content here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <div className="flex gap-3 md:gap-4 mt-8">
                  <button onClick={() => setUploadOverlay('options')} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Back</button>
                  <button 
                    onClick={() => handleIngestion(detectAndParse(pastedText))} 
                    className="flex-[2] bg-[#5F259F] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-[#4E1E83] transition-all text-xs uppercase tracking-widest"
                  >
                    Run Parser
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 2 Modal */}
      {showPhase2Popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A1122]/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300 border border-purple-50">
            <div className="text-6xl mb-6 mx-auto bg-purple-50 w-24 h-24 flex items-center justify-center rounded-3xl shadow-inner">🚀</div>
            <h3 className="text-2xl font-black text-[#5F259F] mb-4">Phase 2 Incoming</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">We are working on it! This feature will be available in the upcoming Sensei update.</p>
            <button 
              onClick={() => setShowPhase2Popup(false)}
              className="w-full bg-[#5F259F] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-[#4E1E83] transition-all active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {activeQuestion && currentInsight && (
        <InsightModal 
          question={activeQuestion}
          insight={currentInsight}
          onClose={() => { setActiveQuestion(null); setCurrentInsight(null); }}
        />
      )}
    </div>
  );
};

export default App;