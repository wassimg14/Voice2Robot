import React, { useEffect, useRef, useState } from 'react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('Ready to listen...');
  const [emotion, setEmotion] = useState('neutral');
  const [intent, setIntent] = useState('idle');
  const [robotStatus, setRobotStatus] = useState('Waiting for command...');
  const [status, setStatus] = useState('Ready to receive commands');
  const [statusType, setStatusType] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const emotionMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const robotPositionRef = useRef({ x: 0, y: 0, rotation: 0 });
  const currentEmotionRef = useRef('neutral');
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    initSpeechRecognition();
    initAudio();
    return () => {
      if (emotionMonitorRef.current) {
        clearInterval(emotionMonitorRef.current);
      }
    };
  }, []);

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        processCommand(speechResult);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        updateStatus('Speech recognition error: ' + event.error, 'error');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      updateStatus('Speech recognition not supported in this browser', 'error');
    }
  };

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.3;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        audioChunksRef.current = [];
      };
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      updateStatus('Error: Could not access microphone', 'error');
    }
  };

  const analyzeEmotionFromAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return 'neutral';
    }
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    let sum = 0;
    let maxValue = 0;
    
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
      if (dataArrayRef.current[i] > maxValue) {
        maxValue = dataArrayRef.current[i];
      }
    }
    
    const avgVolume = sum / dataArrayRef.current.length;
    
    if (maxValue > 100 && avgVolume > 30) {
      return maxValue > 150 ? 'angry' : 'happy';
    } else if (avgVolume < 10 && maxValue < 30) {
      return 'sad';
    }
    
    return 'neutral';
  };

  const startEmotionMonitoring = () => {
    if (emotionMonitorRef.current) {
      clearInterval(emotionMonitorRef.current);
    }
    
    emotionMonitorRef.current = setInterval(() => {
      if (analyserRef.current && dataArrayRef.current) {
        const detectedEmotion = analyzeEmotionFromAudio();
        if (detectedEmotion !== currentEmotionRef.current) {
          currentEmotionRef.current = detectedEmotion;
          setEmotion(detectedEmotion);
        }
      }
    }, 200);
  };

  const stopEmotionMonitoring = () => {
    if (emotionMonitorRef.current) {
      clearInterval(emotionMonitorRef.current);
      emotionMonitorRef.current = null;
    }
  };

  const processCommand = (speechText: string) => {
    const audioEmotion = currentEmotionRef.current;
    const textEmotion = analyzeEmotionFromSpeech(speechText);
    const detectedEmotion = audioEmotion !== 'neutral' ? audioEmotion : textEmotion;
    const detectedIntent = getIntent(speechText);
    
    setEmotion(detectedEmotion);
    setIntent(detectedIntent);
    setRobotStatus(`Moving: ${detectedIntent} (${detectedEmotion})`);
    
    executeRobotCommand(detectedIntent, detectedEmotion);
    updateStatus('Command executed successfully!', 'success');
  };

  const analyzeEmotionFromSpeech = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (/\b(great|awesome|fantastic|wonderful|amazing|excellent|good|nice|love|happy|excited|yay|hooray|brilliant|perfect|super|cool|fun|joy|smile|laugh)\b/.test(lowerText) || 
        text.includes('!') || text.includes('yeah') || text.includes('yes') || text.includes('wow')) {
      return 'happy';
    }
    
    if (/\b(stop|damn|angry|mad|frustrated|annoying|stupid|hate|terrible|awful|furious|rage|pissed|irritated)\b/.test(lowerText) ||
        text.includes('!!') || /[A-Z]{4,}/.test(text)) {
      return 'angry';
    }
    
    if (/\b(sad|tired|slow|quiet|sorry|please|help|down|low|depressed|lonely|cry|weep|sigh|disappointed|hurt|pain)\b/.test(lowerText)) {
      return 'sad';
    }
    
    return 'neutral';
  };

  const getIntent = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (/\b(stop|halt|freeze|wait|pause)\b/.test(lowerText)) return 'stop';
    if (/\b(left|turn left)\b/.test(lowerText)) return 'turn_left';
    if (/\b(right|turn right)\b/.test(lowerText)) return 'turn_right';
    if (/\b(back|reverse|backward|go back)\b/.test(lowerText)) return 'back';
    if (/\b(forward|walk|go|ahead|move|start)\b/.test(lowerText)) return 'walk';
    
    return 'idle';
  };

  const executeRobotCommand = (intentType: string, emotionType: string) => {
    const emotionGain: { [key: string]: number } = {
      happy: 1.2,
      angry: 1.5,
      sad: 0.5,
      neutral: 1.0
    };
    
    const gain = emotionGain[emotionType] || 1.0;
    let movement = { linear: 0, angular: 0 };
    
    switch (intentType) {
      case 'walk':
        movement.linear = 1.0 * gain;
        break;
      case 'back':
        movement.linear = -0.8 * gain;
        break;
      case 'turn_left':
        movement.angular = 1.2 * gain;
        break;
      case 'turn_right':
        movement.angular = -1.2 * gain;
        break;
      case 'stop':
      case 'idle':
      default:
        movement = { linear: 0, angular: 0 };
        break;
    }
    
    const newX = robotPositionRef.current.x + movement.linear * Math.cos(robotPositionRef.current.rotation) * 0.1;
    const newY = robotPositionRef.current.y + movement.linear * Math.sin(robotPositionRef.current.rotation) * 0.1;
    
    const minX = -3.5, maxX = 3.5, minY = -1.8, maxY = 1.8;
    
    robotPositionRef.current.x = Math.max(minX, Math.min(maxX, newX));
    robotPositionRef.current.y = Math.max(minY, Math.min(maxY, newY));
    robotPositionRef.current.rotation += movement.angular * 0.1;
  };

  const updateStatus = (message: string, type: string) => {
    setStatus(message);
    setStatusType(type);
  };

  const startRecording = () => {
    if (isRecording) return;
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    setIsRecording(true);
    updateStatus('Listening...', 'processing');
    
    startEmotionMonitoring();
    
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    
    stopEmotionMonitoring();
    setIsRecording(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const getEmotionColors = () => {
    const colors = {
      happy: { body: '#4CAF50', accent: '#2E7D32' },
      angry: { body: '#F44336', accent: '#C62828' },
      sad: { body: '#2196F3', accent: '#1565C0' },
      neutral: { body: '#4a90e2', accent: '#2c5aa0' }
    };
    return colors[emotion as keyof typeof colors] || colors.neutral;
  };

  const robotX = 400 + robotPositionRef.current.x * 100;
  const robotY = 200 + robotPositionRef.current.y * 100;
  const rotation = robotPositionRef.current.rotation * 180 / Math.PI;
  const colors = getEmotionColors();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-shadow">
            Voice → Robot (Command + Emotion)
          </h1>
          <p className="text-center mb-8 opacity-90 text-lg">
            Hold the mic ~3–5s. Try: 'walk forward', 'turn left', 'stop'. Speak happy/angry/sad.
          </p>
          
          <div className="flex flex-col items-center gap-6 mb-8">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              className={`px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 shadow-lg ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:-translate-y-1'
              }`}
            >
              {isRecording ? '🔴 Recording...' : '🎤 Hold to Record'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="text-sm opacity-80 mb-2">ASR Transcript</h3>
              <div className="text-lg font-semibold break-words">{transcript}</div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="text-sm opacity-80 mb-2">Detected Emotion</h3>
              <div className="text-lg font-semibold">{emotion}</div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="text-sm opacity-80 mb-2">Detected Intent</h3>
              <div className="text-lg font-semibold">{intent}</div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="text-sm opacity-80 mb-2">Robot Status</h3>
              <div className="text-lg font-semibold break-words">{robotStatus}</div>
            </div>
          </div>
          
          <div className="bg-white/90 rounded-2xl p-6 text-gray-800">
            <h3 className="text-xl font-bold mb-4 text-center">Simulation Preview</h3>
            <div className="w-full h-80 md:h-96 border-2 border-gray-300 rounded-xl bg-white overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="400" fill="white"/>
                <g transform={`translate(${robotX}, ${robotY}) rotate(${rotation})`}>
                  <circle cx="0" cy="0" r="20" fill={colors.body} stroke={colors.accent} strokeWidth="2"/>
                  <polygon points="15,0 25,5 25,-5" fill={colors.accent}/>
                  <circle cx="-8" cy="-8" r="3" fill="white"/>
                  <circle cx="8" cy="-8" r="3" fill="white"/>
                  <circle cx="-8" cy="-8" r="1" fill="black"/>
                  <circle cx="8" cy="-8" r="1" fill="black"/>
                </g>
                <text x="10" y="20" fontFamily="Arial" fontSize="12" fill="#333">
                  Position: ({robotPositionRef.current.x.toFixed(1)}, {robotPositionRef.current.y.toFixed(1)})
                </text>
                <text x="10" y="35" fontFamily="Arial" fontSize="12" fill="#333">
                  Rotation: {(robotPositionRef.current.rotation * 180 / Math.PI).toFixed(1)}°
                </text>
              </svg>
            </div>
            <div className={`mt-4 p-3 rounded-lg font-semibold ${
              statusType === 'success' ? 'bg-green-100 text-green-800' :
              statusType === 'error' ? 'bg-red-100 text-red-800' :
              statusType === 'processing' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </div>
          </div>
          
          <div className="text-center mt-8 pt-6 border-t border-white/20">
            <div className="text-lg font-bold mb-1">Made by Wassim Gueraoui</div>
            <div className="text-sm opacity-70">
              <a href="mailto:wassimgueraoui@gmail.com" className="hover:opacity-100 transition-opacity">
                wassimgueraoui@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;