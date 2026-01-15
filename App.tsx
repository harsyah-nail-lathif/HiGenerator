
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/Button';
import { FileAttachment, PromptType } from './types';
import { generatePromptResponse, generateImageFromPrompt, generateVoiceOver } from './services/geminiService';

const MAX_ATTACHMENTS = 4;
const MAX_UGC_ATTACHMENTS = 5;

// Config Codes & Device Limits
const ACCESS_CONFIG: Record<string, { limit: number, role: 'admin' | 'user' }> = {
  "NNK-7FQ29": { limit: 2, role: 'user' },
  "BIN-MX83A": { limit: 2, role: 'user' },
  "VEO-4KJ71": { limit: 2, role: 'user' },
  "IDN-9ZP56": { limit: 2, role: 'user' },
  "KNT-3RLA8": { limit: 2, role: 'user' },
  "FBX-82NQK": { limit: 2, role: 'user' },
  "RLS-5TMW9": { limit: 2, role: 'user' },
  "AIK-6YH27": { limit: 2, role: 'user' },
  "MOD-8CEX4": { limit: 2, role: 'user' },
  "XVN-91PLD": { limit: 2, role: 'user' },
  "MamankAdmin": { limit: 5, role: 'admin' }
};

const RunnerLoading: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl animate-fade-in overflow-hidden">
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="speed-line"
          style={{ 
            top: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${0.5 + Math.random()}s`
          }}
        />
      ))}
    </div>
    <div className="relative z-10 flex flex-col items-center">
      <div className="runner-container mb-12">
        <svg viewBox="0 0 100 100" className="w-40 h-40 text-indigo-500 fill-none stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="60" cy="25" r="5" className="animate-head-bob" />
          <path d="M60,30 L55,50" className="animate-torso-sway" />
          <path d="M57,35 L45,45 L50,55" className="animate-arm-back" />
          <path d="M57,35 L70,45 L65,55" className="animate-arm-front" />
          <path d="M55,50 L40,65 L50,85" className="animate-leg-back" />
          <path d="M55,50 L70,65 L60,85" className="animate-leg-front" />
          <g className="dust-clouds">
            <circle cx="35" cy="85" r="2" className="dust dust-1" />
            <circle cx="30" cy="87" r="1.5" className="dust dust-2" />
            <circle cx="25" cy="84" r="1" className="dust dust-3" />
          </g>
        </svg>
      </div>
      <div className="relative flex flex-col items-center">
        <span className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          {Math.round(progress)}%
        </span>
        <div className="mt-4 text-center">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-[0.4em] animate-pulse">
            Tunggu Aku Ya
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
            Engineering your cinematic prompt...
          </p>
        </div>
      </div>
      <div className="mt-16 w-80 bg-slate-900/50 h-2 rounded-full overflow-hidden border border-white/5 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-gradient-shift transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
    <style>{`
      @keyframes speed-line-move {
        from { transform: translateX(100vw); opacity: 0; }
        50% { opacity: 0.5; }
        to { transform: translateX(-100vw); opacity: 0; }
      }
      .speed-line {
        position: absolute;
        right: 0;
        width: 150px;
        height: 1px;
        background: linear-gradient(to left, transparent, rgba(99, 102, 241, 0.4), transparent);
        animation: speed-line-move linear infinite;
      }
      @keyframes head-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(2px); }
      }
      .animate-head-bob { animation: head-bob 0.4s infinite ease-in-out; }
      @keyframes leg-front-move {
        0%, 100% { d: path("M55,50 L70,65 L60,85"); }
        50% { d: path("M55,50 L40,65 L25,75"); }
      }
      @keyframes leg-back-move {
        0%, 100% { d: path("M55,50 L40,65 L50,85"); }
        50% { d: path("M55,50 L75,60 L90,75"); }
      }
      .animate-leg-front { animation: leg-front-move 0.4s infinite linear; }
      .animate-leg-back { animation: leg-back-move 0.4s infinite linear; }
      @keyframes arm-front-move {
        0%, 100% { d: path("M57,35 L75,45 L85,35"); }
        50% { d: path("M57,35 L40,40 L30,55"); }
      }
      @keyframes arm-back-move {
        0%, 100% { d: path("M57,35 L40,40 L30,55"); }
        50% { d: path("M57,35 L75,45 L85,35"); }
      }
      .animate-arm-front { animation: arm-front-move 0.4s infinite linear; }
      .animate-arm-back { animation: arm-back-move 0.4s infinite linear; }
      @keyframes dust-cloud {
        0% { transform: translateX(0) scale(1); opacity: 0.8; }
        100% { transform: translateX(-50px) scale(0.5); opacity: 0; }
      }
      .dust { animation: dust-cloud 0.6s infinite linear; fill: rgba(148, 163, 184, 0.3); stroke: none; }
      .dust-1 { animation-delay: 0s; }
      .dust-2 { animation-delay: 0.2s; }
      .dust-3 { animation-delay: 0.4s; }
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      .animate-gradient-shift { animation: gradient-shift 2s linear infinite; }
    `}</style>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [result, setResult] = useState<{ text: string; type: PromptType; audioUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(15);
  const [ugcRatio, setUgcRatio] = useState<string>("1:1");
  const [hasVoiceOver, setHasVoiceOver] = useState<boolean>(true);
  const [ugcHasScript, setUgcHasScript] = useState<boolean>(true);
  const [storyboardLang, setStoryboardLang] = useState<string>("Bahasa Indonesia");
  const [ugcLang, setUgcLang] = useState<string>("Bahasa Indonesia");
  const [activeMode, setActiveMode] = useState<'PROMPT' | 'STORYBOARD' | 'UGC' | 'VOICE_OVER'>('STORYBOARD');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  // Voice Over Specific States
  const [voChar, setVoChar] = useState<string>("Fenrir");
  const [voLang, setVoLang] = useState<string>("Bahasa Indonesia");
  const [voStyle, setVoStyle] = useState<string>("Natural dan tenang");
  
  const [generatingScenes, setGeneratingScenes] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('hpk_auth');
    if (savedAuth && ACCESS_CONFIG[savedAuth]) {
      setIsAuthenticated(true);
      setIsAdmin(ACCESS_CONFIG[savedAuth].role === 'admin');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = loginCode.trim();
    setIsLoggingIn(true);
    setLoginError('');

    await new Promise(r => setTimeout(r, 1200));

    if (ACCESS_CONFIG[code]) {
      localStorage.setItem('hpk_auth', code);
      setIsAuthenticated(true);
      setIsAdmin(ACCESS_CONFIG[code].role === 'admin');
      setLoginError('');
    } else {
      setLoginError('Kode akses tidak valid atau sudah mencapai batas penggunaan.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('hpk_auth');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setLoginCode('');
    resetForm();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentMax = activeMode === 'UGC' ? MAX_UGC_ATTACHMENTS : MAX_ATTACHMENTS;
    const remainingSlots = currentMax - attachments.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
    const newAttachments: FileAttachment[] = await Promise.all(
      filesToProcess.map(async (file: File) => {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
        });
        reader.readAsDataURL(file);
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          type: file.type.startsWith('video') ? 'video' : 'image',
          base64: await base64Promise
        };
      })
    );
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newArr = [...prev];
      URL.revokeObjectURL(newArr[index].previewUrl);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const resetForm = () => {
    attachments.forEach(att => URL.revokeObjectURL(att.previewUrl));
    if (result?.audioUrl) URL.revokeObjectURL(result.audioUrl);
    setInstruction('');
    setAttachments([]);
    setResult(null);
    setError(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setGeneratingScenes(new Set());
  };

  const handleGenerate = async (type: PromptType) => {
    if (!instruction && attachments.length === 0 && type !== 'VOICE_OVER') {
      setError("Please provide instructions or attach media.");
      return;
    }
    if (type === 'VOICE_OVER' && !instruction) {
      setError("Silakan isi teks yang ingin dijadikan suara.");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);
    setResult(null);
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 98) return prev;
        const speed = prev < 30 ? 4 : prev < 80 ? 1 : 0.2;
        return Math.min(prev + (Math.random() * speed), 98);
      });
    }, 150);

    try {
      if (type === 'VOICE_OVER') {
        const base64Data = await generateVoiceOver(instruction, voChar, voStyle, voLang);
        const audioUrl = await base64ToAudioUrl(base64Data);
        setResult({ text: instruction, type: 'VOICE_OVER', audioUrl });
      } else {
        const responseText = await generatePromptResponse(
          instruction, 
          attachments, 
          type, 
          { 
            duration, 
            hasVoiceOver: type === 'UGC_CONTENT' ? ugcHasScript : hasVoiceOver, 
            ratio: ugcRatio, 
            language: type === 'UGC_CONTENT' ? ugcLang : storyboardLang 
          }
        );
        setResult({ text: responseText, type });
      }
      
      setGenerationProgress(100);
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsGenerating(false);
      setGenerationProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const base64ToAudioUrl = async (base64: string): Promise<string> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const wavBlob = createWavBlob(bytes, 24000);
    return URL.createObjectURL(wavBlob);
  };

  const createWavBlob = (pcmData: Uint8Array, sampleRate: number) => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); 
    view.setUint16(22, 1, true); 
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);
    return new Blob([header, pcmData], { type: 'audio/wav' });
  };

  const handleGenerateSceneImage = async (sceneNumber: number, prompt: string) => {
    setGeneratingScenes(prev => new Set(prev).add(sceneNumber));
    try {
      const ratioMapping: Record<string, string> = { "4:4": "1:1", "1:1": "1:1", "16:9": "16:9", "9:16": "9:16" };
      const apiRatio = ratioMapping[ugcRatio] || "1:1";
      const imageUrl = await generateImageFromPrompt(prompt, apiRatio);
      
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `scene-${sceneNumber}-storyboard.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Error generating image for scene ${sceneNumber}: ${err.message}`);
    } finally {
      setGeneratingScenes(prev => {
        const next = new Set(prev);
        next.delete(sceneNumber);
        return next;
      });
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const renderStoryboardResults = () => {
    if (!result || result.type !== 'STORYBOARD') return null;
    try {
      const data = JSON.parse(result.text);
      const imagePromptsText = data.scenes.map((s: any) => `SCENE ${s.scene_number} [${s.title}]:\n${s.image_prompt}`).join('\n\n');
      const videoPromptsText = data.scenes.map((s: any) => `SCENE ${s.scene_number} [${s.title}]:\n${JSON.stringify(s.video_animation_prompt, null, 2)}`).join('\n\n');
      return (
        <div className="space-y-8 animate-fade-in mb-12">
          <div className="glass-effect rounded-2xl p-6 border-indigo-500/20">
            <h3 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-widest">Story Summary</h3>
            <p className="text-slate-300 italic">{data.story_summary}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  1. PROMPT IMAGE
                </h2>
                <button onClick={() => handleCopyToClipboard(imagePromptsText, "all-images")} className={`text-xs px-4 py-2 rounded-xl border font-bold transition-all flex items-center gap-2 ${copySuccess === 'all-images' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30"}`}>
                  {copySuccess === 'all-images' ? "SUKSES COPY" : "COPY ALL IMAGES"}
                </button>
              </div>
              <div className="glass-effect rounded-2xl p-6 h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 font-mono text-sm border-indigo-500/10 bg-slate-900/60 shadow-inner">
                {data.scenes.map((s: any) => (
                  <div key={s.scene_number} className="mb-6 pb-6 border-b border-slate-800 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-indigo-500 font-bold block">SCENE {s.scene_number}</span>
                      <button 
                        onClick={() => handleGenerateSceneImage(s.scene_number, s.image_prompt)}
                        disabled={generatingScenes.has(s.scene_number)}
                        className={`text-[10px] px-3 py-1.5 rounded-lg border font-black tracking-widest uppercase transition-all flex items-center gap-2 ${
                          generatingScenes.has(s.scene_number) 
                          ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed" 
                          : "bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                        }`}
                      >
                        {generatingScenes.has(s.scene_number) ? "RUNNING..." : "GENERATE"}
                      </button>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-[13px]">{s.image_prompt}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  2. PROMPT ANIMASI VIDEO
                </h2>
                <button onClick={() => handleCopyToClipboard(videoPromptsText, "all-videos")} className={`text-xs px-4 py-2 rounded-xl border font-bold transition-all flex items-center gap-2 ${copySuccess === 'all-videos' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"}`}>
                  {copySuccess === 'all-videos' ? "SUKSES COPY" : "COPY ALL VIDEOS"}
                </button>
              </div>
              <div className="glass-effect rounded-2xl p-6 h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 font-mono text-sm border-purple-500/10 bg-slate-900/60 shadow-inner">
                {data.scenes.map((s: any) => (
                  <div key={s.scene_number} className="mb-6 pb-6 border-b border-slate-800 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-purple-500 font-bold">SCENE {s.scene_number}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-black">JSONPROMT</span>
                        <button 
                          onClick={() => handleCopyToClipboard(JSON.stringify(s.video_animation_prompt, null, 2), `v-copy-${s.scene_number}`)} 
                          title="Copy Scene Prompt"
                          className={`p-1.5 rounded-lg border transition-all ${copySuccess === `v-copy-${s.scene_number}` ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"}`}
                        >
                          {copySuccess === `v-copy-${s.scene_number}` ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-purple-500/10 mb-3 font-mono text-[11px] leading-relaxed text-purple-300">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(s.video_animation_prompt, null, 2)}</pre>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded text-[11px] border border-slate-800 text-slate-400 min-h-[60px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-300 block uppercase">Dialog:</span>
                        {s.narration && (
                          <button 
                            onClick={() => handleCopyToClipboard(s.narration, `n-copy-${s.scene_number}`)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${copySuccess === `n-copy-${s.scene_number}` ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"}`}
                          >
                            {copySuccess === `n-copy-${s.scene_number}` ? "COPIED" : "COPY DIALOG"}
                          </button>
                        )}
                      </div>
                      {s.narration || <span className="text-slate-600 italic">Dialog terintegrasi dalam Video Prompt (Karakter Berbicara)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      return <div className="glass-effect rounded-3xl p-6 text-slate-400 font-mono text-sm">Gagal memproses Storyboard.</div>;
    }
  };

  const renderUgcResults = () => {
    if (!result || result.type !== 'UGC_CONTENT') return null;
    try {
      const parsed = JSON.parse(result.text);
      let cleanText = parsed.data || "";
      if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0].trim();
      } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0].trim();
      }
      const data = JSON.parse(cleanText);
      const videoPromptStr = typeof data.video_prompt === 'object' ? JSON.stringify(data.video_prompt, null, 2) : data.video_prompt;

      return (
        <div className="flex flex-col gap-6 animate-fade-in mb-12 items-stretch">
          <div className="w-full glass-effect rounded-[2.5rem] p-6 border-slate-700/50 flex flex-col shadow-2xl relative group/img">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">HASIL IMAGE</h2>
              <button onClick={() => setShowImageModal(true)} className="p-2 bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl transition-all border border-white/5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
            </div>
            <div className="rounded-[1.5rem] overflow-hidden border border-white/5 bg-slate-900/60 shadow-inner relative flex items-center justify-center min-h-[300px] max-h-[450px]">
              {parsed.image ? <img src={parsed.image} className="w-full h-full object-contain cursor-pointer" alt="UGC" onClick={() => setShowImageModal(true)} /> : <div className="text-slate-600 font-bold text-sm">Memproses...</div>}
            </div>
            <a href={parsed.image} download="ugc-content-image.png" className="mt-6 w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-xs font-black transition-all text-center tracking-widest uppercase shadow-lg">DOWNLOAD IMAGE</a>
          </div>
          {showImageModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowImageModal(false)}>
              <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
                <img src={parsed.image} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="Full preview" onClick={(e) => e.stopPropagation()} />
                <button onClick={() => setShowImageModal(false)} className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/10 transition-all text-xs tracking-widest uppercase">CLOSE PREVIEW</button>
              </div>
            </div>
          )}
          
          <div className="w-full glass-effect rounded-[2.5rem] p-8 border-indigo-500/20 flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-[0.2em]">Jsonpromt</h2>
              <button onClick={() => handleCopyToClipboard(videoPromptStr, "ugc-v-copy")} className={`px-6 py-2 rounded-xl border text-[10px] font-black transition-all tracking-widest uppercase ${copySuccess === 'ugc-v-copy' ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>{copySuccess === 'ugc-v-copy' ? "SUKSES" : "COPY"}</button>
            </div>
            <div className="bg-slate-950/40 p-6 rounded-[1.5rem] border border-slate-800/80 font-mono text-xs text-indigo-300 shadow-inner overflow-y-auto max-h-[250px] leading-relaxed whitespace-pre">{videoPromptStr}</div>
          </div>

          <div className="w-full glass-effect rounded-[2.5rem] p-8 border-slate-700/50 flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">CAPTION & HASHTAGS</h2>
              <button onClick={() => handleCopyToClipboard(data.caption, "ugc-c-copy")} className={`px-6 py-2 rounded-xl border text-[10px] font-black transition-all tracking-widest uppercase ${copySuccess === 'ugc-c-copy' ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-slate-800 text-slate-400 border-slate-700"}`}>{copySuccess === 'ugc-c-copy' ? "SUKSES" : "COPY"}</button>
            </div>
            <div className="bg-slate-950/40 p-6 rounded-[1.5rem] border border-slate-800/80 text-sm italic text-slate-300 shadow-inner overflow-y-auto leading-relaxed whitespace-pre-wrap">{data.caption}</div>
          </div>
        </div>
      );
    } catch (e) {
      return <div className="glass-effect rounded-[2rem] p-12 text-slate-400 font-bold text-center border-red-500/20 shadow-2xl">Gagal memproses hasil visual.</div>;
    }
  };

  const renderVoResults = () => {
    if (!result || result.type !== 'VOICE_OVER' || !result.audioUrl) return null;
    return (
      <section className="glass-effect rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-fade-in border-white/5 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            Generated Voice Over
          </h2>
          <a 
            href={result.audioUrl} 
            download="voice-over-promkelas.wav"
            className="flex items-center gap-2 font-bold transition-all px-6 py-3 rounded-xl border bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
          >
            DOWNLOAD MP3 (WAV)
          </a>
        </div>
        
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-10 flex flex-col items-center gap-6">
          <div className="w-full max-w-md">
            <audio controls src={result.audioUrl} className="w-full custom-audio-player" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Voice Context</span>
            <p className="text-sm text-slate-300 italic">Character: {voChar === 'Fenrir' ? 'Pria' : 'Wanita'} | Style: {voStyle}</p>
          </div>
        </div>
      </section>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-6 overflow-hidden relative">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full z-0" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full z-0" />
        <div className="relative z-10 w-full max-w-md glass-effect p-10 rounded-[2.5rem] shadow-2xl border-white/10 animate-fade-in text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Hi<span className="gradient-text">Generator</span></h1>
            <p className="text-slate-400 text-sm font-medium">Access Gate</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Unique Access Code</label>
              <input type="text" value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="Enter Code" className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-4 text-center text-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all tracking-[0.1em]" disabled={isLoggingIn} required />
            </div>
            {loginError && <p className="text-red-400 text-xs font-bold bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-shake">{loginError}</p>}
            <button type="submit" className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 ${isLoggingIn ? 'opacity-50' : 'hover:scale-[1.02] active:scale-95'}`} disabled={isLoggingIn}>
               {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER STUDIO'}
            </button>
          </form>
          <div className="mt-8 flex justify-center gap-4 border-t border-white/5 pt-6">
              <div className="flex flex-col items-center"><span className="text-[10px] text-slate-600 font-bold uppercase">User Limit</span><span className="text-xs text-slate-400 font-bold">2 Devices</span></div>
              <div className="w-px h-8 bg-white/5"></div>
              <div className="flex flex-col items-center"><span className="text-[10px] text-slate-600 font-bold uppercase">Admin Limit</span><span className="text-xs text-slate-400 font-bold">5 Devices</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30 pb-24">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none" />
      {isGenerating && <RunnerLoading progress={generationProgress} />}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        {isAdmin && <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-indigo-500/30 tracking-widest uppercase shadow-lg shadow-indigo-500/10 animate-pulse">SUPER ADMIN</span>}
        <button onClick={handleLogout} className="glass-effect px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center gap-2">LOGOUT</button>
      </div>
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Hi<span className="gradient-text">Generator</span></h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">AI-Powered Storyboard & Visual Prompt Engineering Suite.</p>
        </header>

        <div className="flex justify-center mb-10">
          <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 flex gap-1 overflow-x-auto no-scrollbar max-w-full">
            <button onClick={() => { setActiveMode('PROMPT'); }} className={`whitespace-nowrap px-6 py-3 rounded-xl transition-all font-bold tracking-tight ${activeMode === 'PROMPT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Prompt Tools</button>
            <button onClick={() => { setActiveMode('STORYBOARD'); }} className={`whitespace-nowrap px-6 py-3 rounded-xl transition-all font-bold tracking-tight ${activeMode === 'STORYBOARD' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Storyboard</button>
            <button onClick={() => { setActiveMode('UGC'); }} className={`whitespace-nowrap px-6 py-3 rounded-xl transition-all font-bold tracking-tight ${activeMode === 'UGC' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>UGC Content</button>
            <button onClick={() => { setActiveMode('VOICE_OVER'); }} className={`whitespace-nowrap px-6 py-3 rounded-xl transition-all font-bold tracking-tight ${activeMode === 'VOICE_OVER' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Voice Over</button>
          </div>
        </div>

        <section className={`glass-effect rounded-[2.5rem] p-6 lg:p-10 shadow-2xl mb-12 border-white/5 transition-all duration-500 ${activeMode === 'UGC' ? 'ring-2 ring-pink-500/20 bg-pink-900/5' : activeMode === 'VOICE_OVER' ? 'ring-2 ring-orange-500/20 bg-orange-900/5' : ''}`}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em]">
              {activeMode === 'STORYBOARD' ? "CREATE STORYBOARD" : activeMode === 'UGC' ? "UGC CONTENT GENERATOR" : activeMode === 'VOICE_OVER' ? "VOICE OVER GENERATOR" : "INPUT WORKSPACE"}
            </h2>
            <button onClick={resetForm} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-bold px-4 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800">New</button>
          </div>

          {activeMode !== 'VOICE_OVER' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-slate-300">
                  {activeMode === 'UGC' ? "Product Reference Images (Max 5)" : activeMode === 'STORYBOARD' ? "Character / Product Reference" : "Media Attachments"} 
                  <span className="text-slate-500 font-normal ml-2">({attachments.length}/{activeMode === 'UGC' ? MAX_UGC_ATTACHMENTS : MAX_ATTACHMENTS})</span>
                </label>
                {attachments.length < (activeMode === 'UGC' ? MAX_UGC_ATTACHMENTS : MAX_ATTACHMENTS) && (
                  <button onClick={() => fileInputRef.current?.click()} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1">ADD IMAGES</button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple={true} accept="image/*,video/*" className="hidden" />
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {attachments.map((att, idx) => (
                  <div key={idx} className={`relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border shadow-inner transition-all ${activeMode === 'UGC' ? 'border-pink-500/30' : 'border-slate-700/50'}`}>
                    {att.type === 'image' ? <img src={att.previewUrl} className="w-full h-full object-cover" alt="Preview" /> : <video src={att.previewUrl} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removeAttachment(idx)} className="p-2 bg-red-500 rounded-full hover:scale-110 transition-transform"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <div onClick={() => fileInputRef.current?.click()} className={`col-span-full border-2 border-dashed rounded-[2rem] h-28 flex flex-col items-center justify-center cursor-pointer transition-all group ${activeMode === 'UGC' ? 'border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/5' : 'border-slate-800 hover:border-indigo-500/30 hover:bg-indigo-500/5'}`}>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-slate-300">Upload References</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMode === 'VOICE_OVER' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Karakter Suara</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Pria', val: 'Fenrir' }, 
                    { label: 'Wanita', val: 'Kore' }
                  ].map(c => (
                    <button key={c.val} onClick={() => setVoChar(c.val)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${voChar === c.val ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bahasa</label>
                <div className="grid grid-cols-1 gap-2">
                  {["Bahasa Indonesia", "English"].map(l => (
                    <button key={l} onClick={() => setVoLang(l)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${voLang === l ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Gaya Bicara</label>
                <textarea value={voStyle} onChange={(e) => setVoStyle(e.target.value)} placeholder="Contoh: Ceria, Bersemangat, atau Serius..." className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[120px] outline-none transition-all placeholder:text-slate-700 resize-none text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
          )}

          {(activeMode === 'UGC' || activeMode === 'STORYBOARD') && (
             <div className="mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pilih Ratio Image</label>
              <div className="grid grid-cols-3 gap-3">
                {["4:4", "16:9", "9:16"].map(r => (
                  <button key={r} onClick={() => setUgcRatio(r)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${ugcRatio === r ? (activeMode === 'UGC' ? 'bg-pink-600 border-pink-400' : 'bg-indigo-600 border-indigo-400') + ' text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{r === "4:4" ? "4:4 (Square)" : r}</button>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'STORYBOARD' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Duration</label><div className="grid grid-cols-1 gap-2">{[15, 30, 60].map(d => (<button key={d} onClick={() => setDuration(d)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${duration === d ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{d}s ({d === 15 ? '3' : d === 30 ? '6' : '12'} Scenes)</button>))}</div></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dialog</label><div className="grid grid-cols-1 gap-2">{[true, false].map(vo => (<button key={vo.toString()} onClick={() => setHasVoiceOver(vo)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${hasVoiceOver === vo ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{vo ? 'ON' : 'OFF'}</button>))}</div></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Language</label><div className="grid grid-cols-1 gap-2">{["Bahasa Indonesia", "English"].map(lang => (<button key={lang} onClick={() => setStoryboardLang(lang)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${storyboardLang === lang ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{lang}</button>))}</div></div>
            </div>
          )}

          {activeMode === 'UGC' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-pink-400 uppercase tracking-widest mb-4">Script</label>
                <div className="grid grid-cols-2 gap-2">
                  {[true, false].map(scriptOn => (
                    <button key={scriptOn.toString()} onClick={() => setUgcHasScript(scriptOn)} className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${ugcHasScript === scriptOn ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{scriptOn ? 'ON' : 'OFF'}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${ugcHasScript ? 'text-pink-400' : 'text-slate-600'}`}>Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Bahasa Indonesia", "English"].map(lang => (
                    <button 
                      key={lang} 
                      onClick={() => ugcHasScript && setUgcLang(lang)} 
                      disabled={!ugcHasScript}
                      className={`py-3 rounded-2xl text-[11px] font-bold border transition-all ${!ugcHasScript ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-700' : ugcLang === lang ? 'bg-pink-600 border-pink-400 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-10">
            <label className="block text-sm font-bold text-slate-300 mb-4">{activeMode === 'STORYBOARD' ? "Alur Cerita (Story Plot)" : activeMode === 'UGC' ? "Promt UGC (Promosi Produk)" : activeMode === 'VOICE_OVER' ? "Teks Untuk Voice Over" : "Prompt Instructions"}</label>
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={activeMode === 'UGC' ? "Describe the product scene..." : activeMode === 'STORYBOARD' ? "Describe your story arc..." : activeMode === 'VOICE_OVER' ? "Ketik naskah atau script di sini..." : "Describe the visuals..."} className={`w-full bg-slate-950/40 border rounded-2xl p-6 min-h-[140px] outline-none transition-all placeholder:text-slate-600 resize-none text-lg ${activeMode === 'UGC' ? 'border-pink-500/20 focus:ring-2 focus:ring-pink-500' : activeMode === 'VOICE_OVER' ? 'border-orange-500/20 focus:ring-2 focus:ring-orange-500' : 'border-slate-800 focus:ring-2 focus:ring-indigo-500'}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {activeMode === 'STORYBOARD' ? (
              <Button variant="accent" className="md:col-span-2 h-14 !rounded-2xl text-base !bg-gradient-to-r !from-indigo-600 !to-purple-700 hover:scale-[1.01]" onClick={() => handleGenerate('STORYBOARD')} isLoading={isGenerating} disabled={isGenerating}>GENERATE STORYBOARD</Button>
            ) : activeMode === 'UGC' ? (
              <Button variant="accent" className="md:col-span-2 h-14 !rounded-2xl text-base !bg-gradient-to-r !from-pink-600 !via-purple-600 !to-indigo-700 hover:scale-[1.01] shadow-pink-500/20" onClick={() => handleGenerate('UGC_CONTENT')} isLoading={isGenerating} disabled={isGenerating}>GENERATE UGC</Button>
            ) : activeMode === 'VOICE_OVER' ? (
              <Button variant="accent" className="md:col-span-2 h-14 !rounded-2xl text-base !bg-gradient-to-r !from-orange-600 !to-red-700 hover:scale-[1.01] shadow-orange-500/20" onClick={() => handleGenerate('VOICE_OVER')} isLoading={isGenerating} disabled={isGenerating}>RUN VOICE OVER</Button>
            ) : (
              <><Button variant="outline" className="h-14 !rounded-2xl" onClick={() => handleGenerate('SORA_2')} isLoading={isGenerating} disabled={isGenerating}>SORA 2</Button><Button variant="accent" className="h-14 !rounded-2xl" onClick={() => handleGenerate('VEO_3_JSON')} isLoading={isGenerating} disabled={isGenerating}>VEO 3.1</Button></>
            )}
          </div>
        </section>

        {error && <div className="mb-10 p-5 bg-red-500/10 border border-red-500/40 rounded-3xl text-red-400 text-sm font-bold text-center animate-shake">{error}</div>}

        {renderVoResults()}
        {result && result.type === 'STORYBOARD' && renderStoryboardResults()}
        {result && result.type === 'UGC_CONTENT' && renderUgcResults()}

        {result && result.type !== 'STORYBOARD' && result.type !== 'UGC_CONTENT' && result.type !== 'VOICE_OVER' && (
          <section className="glass-effect rounded-[2.5rem] p-8 lg:p-10 shadow-2xl animate-fade-in border-white/5 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />Generated Prompt Source</h2>
              <button onClick={() => handleCopyToClipboard(result.text, "main-result")} className={`flex items-center gap-2 font-bold transition-all px-6 py-3 rounded-xl border ${copySuccess === 'main-result' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20"}`}>
                {copySuccess === 'main-result' ? "SUKSES COPY" : "COPY PROMPT"}
              </button>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-indigo-900/40 text-slate-300 shadow-inner">{result.text}</div>
          </section>
        )}

        <section className="mt-16 flex flex-wrap justify-center gap-6 animate-fade-in">
          <a href="https://labs.google/fx/tools/flow" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 px-10 py-5 rounded-3xl glass-effect border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all group shadow-2xl">
            <div className="flex flex-col items-start"><span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Explore More</span><span className="text-xl font-extrabold text-slate-100">Go To Flow</span></div>
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform"><svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></div>
          </a>
          <a href="https://www.meta.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 px-10 py-5 rounded-3xl glass-effect border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5 transition-all group shadow-2xl">
            <div className="flex flex-col items-start"><span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Advanced AI</span><span className="text-xl font-extrabold text-slate-100">Go To Meta</span></div>
            <div className="bg-purple-600 p-2 rounded-xl group-hover:scale-110 transition-transform"><svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></div>
          </a>
        </section>
      </main>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-audio-player::-webkit-media-controls-panel {
          background-color: rgba(30, 41, 59, 0.8);
        }
        .custom-audio-player::-webkit-media-controls-current-time-display,
        .custom-audio-player::-webkit-media-controls-time-remaining-display {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default App;
