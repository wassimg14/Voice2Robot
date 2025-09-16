# Voice-to-Robot Control with Emotion Detection

Ever wanted to talk to a robot and have it actually understand not just what you're saying, but *how* you're feeling when you say it? That's exactly what this project does!

## What This Actually Is

This is a web application that lets you control a virtual robot using your voice. But here's the cool part - it doesn't just listen to your words, it also picks up on your emotions and changes how the robot behaves accordingly.

Say "move forward" in a happy, excited voice? The robot zips along quickly with enthusiasm. Grumble the same command when you're frustrated? It moves more aggressively. Whisper it sadly? The robot moves slowly and gently, almost like it's being careful with your feelings.

## How It Works (The Simple Version)

1. **You talk** - Hold down the microphone button and give the robot a command
2. **It listens** - The app converts your speech to text using your browser's built-in speech recognition
3. **It feels** - While you're talking, it analyzes the tone, volume, and energy of your voice to figure out your mood
4. **It understands** - The app figures out what you want the robot to do (walk, turn, stop, etc.)
5. **It responds** - The virtual robot moves according to your command, but the speed and style depend on how you sounded

## What You Can Say

Keep it simple and natural:
- "Walk forward" or "Go ahead" or just "Move"
- "Turn left" or "Turn right" 
- "Go back" or "Reverse"
- "Stop" or "Wait"

The magic happens when you say these things with different emotions. Try being excited, frustrated, or gentle - you'll see the robot respond differently each time!

## The Tech Behind It (For the Curious)

- **Speech Recognition**: Uses your browser's Web Speech API (no heavy AI models needed)
- **Emotion Detection**: Analyzes your voice's volume, pitch patterns, and energy in real-time
- **Robot Simulation**: A simple 2D robot that moves around based on your commands
- **No Installation**: Everything runs in your web browser - no downloads, no setup

## Why This Matters

This isn't just a fun demo (though it definitely is that). It's exploring how we can make human-computer interaction more natural and emotionally aware. Imagine if all our devices could pick up on not just what we're asking for, but how we're feeling when we ask for it.

The robot might move cautiously when you sound tired, energetically when you're excited, or gently when you seem sad. It's a small step toward technology that doesn't just process our commands, but actually cares about our emotional state.

## Technical Notes

- Works best with short, clear commands (3-5 seconds)
- Uses lightweight processing - everything runs on your CPU, no cloud services needed
- The emotion detection is based on audio analysis, not facial recognition or text sentiment
- Built with vanilla JavaScript and modern web APIs for maximum compatibility

Give it a try and see how it feels to have a robot that actually listens to more than just your words!


Built by Wassim Gueraoui
wassimgueraoui@gmail.com
