import express from 'express';
import multer from 'multer';
import cors from 'cors';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload handling
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simple audio processing utilities
class AudioProcessor {
  static analyzeAudio(audioBuffer) {
    // Simple amplitude analysis for emotion detection
    const samples = new Float32Array(audioBuffer);
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    const maxAmplitude = Math.max(...samples.map(Math.abs));
    
    return {
      rms,
      maxAmplitude,
      duration: samples.length / 16000 // assuming 16kHz
    };
  }

  static detectEmotion(audioFeatures) {
    const { rms, maxAmplitude } = audioFeatures;
    
    if (rms > 0.3 && maxAmplitude > 0.7) return 'angry';
    if (rms > 0.2 && maxAmplitude > 0.5) return 'happy';
    if (rms < 0.1 && maxAmplitude < 0.3) return 'sad';
    return 'neutral';
  }
}

// Simple speech-to-text simulation
class SpeechProcessor {
  static transcribeAudio(audioBuffer) {
    // Simulate transcription with random responses for demo
    const phrases = [
      'walk forward',
      'turn left',
      'turn right',
      'stop',
      'go back',
      'move forward',
      'turn around'
    ];
    
    // In a real implementation, this would use Web Speech API or similar
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

// Intent recognition
class IntentProcessor {
  static getIntent(text) {
    const lowerText = text.toLowerCase();
    
    if (/\b(stop|halt|freeze|wait)\b/.test(lowerText)) return 'stop';
    if (/\b(left|turn left)\b/.test(lowerText)) return 'turn_left';
    if (/\b(right|turn right)\b/.test(lowerText)) return 'turn_right';
    if (/\b(back|reverse|backward)\b/.test(lowerText)) return 'back';
    if (/\b(forward|walk|go|ahead|move)\b/.test(lowerText)) return 'walk';
    
    return 'idle';
  }
}

// Robot simulation
class RobotSimulator {
  constructor() {
    this.position = { x: 0, y: 0, rotation: 0 };
    this.emotionGain = {
      happy: 1.2,
      angry: 1.5,
      sad: 0.5,
      neutral: 1.0
    };
  }

  executeCommand(intent, emotion) {
    const gain = this.emotionGain[emotion] || 1.0;
    let movement = { linear: 0, angular: 0 };

    switch (intent) {
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

    // Update robot position
    this.position.x += movement.linear * Math.cos(this.position.rotation) * 0.1;
    this.position.y += movement.linear * Math.sin(this.position.rotation) * 0.1;
    this.position.rotation += movement.angular * 0.1;

    return {
      position: this.position,
      movement,
      emotion,
      intent
    };
  }

  generateFrame() {
    // Generate a simple SVG representation of the robot
    const robotX = 200 + this.position.x * 50;
    const robotY = 150 + this.position.y * 50;
    const rotation = this.position.rotation * 180 / Math.PI;

    return `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white"/>
        <g transform="translate(${robotX}, ${robotY}) rotate(${rotation})">
          <!-- Robot body -->
          <circle cx="0" cy="0" r="20" fill="#4a90e2" stroke="#2c5aa0" stroke-width="2"/>
          <!-- Robot direction indicator -->
          <polygon points="15,0 25,5 25,-5" fill="#2c5aa0"/>
          <!-- Robot eyes -->
          <circle cx="-8" cy="-8" r="3" fill="white"/>
          <circle cx="8" cy="-8" r="3" fill="white"/>
          <circle cx="-8" cy="-8" r="1" fill="black"/>
          <circle cx="8" cy="-8" r="1" fill="black"/>
        </g>
        <!-- Position info -->
        <text x="10" y="20" font-family="Arial" font-size="12" fill="#333">
          Position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})
        </text>
        <text x="10" y="35" font-family="Arial" font-size="12" fill="#333">
          Rotation: ${(this.position.rotation * 180 / Math.PI).toFixed(1)}°
        </text>
      </svg>
    `;
  }
}

const robot = new RobotSimulator();

// API endpoint for processing audio
app.post('/process-audio', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Simulate audio processing
    const audioFeatures = AudioProcessor.analyzeAudio(req.file.buffer);
    const emotion = AudioProcessor.detectEmotion(audioFeatures);
    const transcript = SpeechProcessor.transcribeAudio(req.file.buffer);
    const intent = IntentProcessor.getIntent(transcript);
    
    // Execute robot command
    const robotState = robot.executeCommand(intent, emotion);
    const frame = robot.generateFrame();

    res.json({
      transcript,
      emotion,
      intent,
      robotState,
      frame
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Voice-to-Robot server running at http://localhost:${port}`);
});