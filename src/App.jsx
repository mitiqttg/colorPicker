import { useState, useEffect, useRef } from 'react';
import './App.css'; // Assuming your .inverted-heading class for mix-blend-mode is here

// (Keep your nameToHex and getInverseHexColor functions if you still use them for other parts,
// but they are not directly used for the party mode's background color logic below.
// For simplicity, this example will use a simpler random color picker for party mode.)

const initialColors = ['red', 'blue', 'green', 'yellow', 'purple', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6', '#2ecc71'];

function App() {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isPartyModeOn, setIsPartyModeOn] = useState(false);

  const audioElRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null); // Stores frequency data
  const animationFrameIdRef = useRef(null);
  
  // For simpler beat detection
  const lastVolumeRef = useRef(0);
  const beatThreshold = 10; // Adjust this to make beat detection more/less sensitive
  const beatCooldownRef = useRef(false);


  // Function to get a random color from the palette
  const getRandomPartyColor = () => {
    return initialColors[Math.floor(Math.random() * initialColors.length)];
  };

  // The core audio analysis and color changing loop
  const partyLoop = () => {
    if (!analyserRef.current || !dataArrayRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(partyLoop);
      return;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    let sum = 0;
    // Consider only lower frequencies for a "bass kick" feel
    const bassFrequencies = dataArrayRef.current.slice(0, dataArrayRef.current.length / 8);
    for (let i = 0; i < bassFrequencies.length; i++) {
      sum += bassFrequencies[i];
    }
    const averageVolume = bassFrequencies.length > 0 ? sum / bassFrequencies.length : 0;

    // Simple beat detection: if volume suddenly increases significantly
    if (averageVolume > lastVolumeRef.current + beatThreshold && averageVolume > 30 && !beatCooldownRef.current) { // Min volume to avoid silence triggers
      setBackgroundColor(getRandomPartyColor());
      lastVolumeRef.current = averageVolume;
      beatCooldownRef.current = true; // Start cooldown
      setTimeout(() => {
        beatCooldownRef.current = false; // End cooldown after a short period
      }, 150); // Cooldown in ms, adjust to match music rhythm or desired flash rate
    } else if (averageVolume < lastVolumeRef.current) {
      // Decay lastVolume if current volume is lower, to catch subsequent beats
      lastVolumeRef.current = averageVolume;
    }
    
    // Fallback: If beat detection is not strong, or you want more continuous changes,
    // you could add a slow color fade or less conditional change here.
    // For example, to make it change more often even without strong beats:
    // if (Math.random() < 0.01) setBackgroundColor(getRandomPartyColor());


    animationFrameIdRef.current = requestAnimationFrame(partyLoop);
  };


  useEffect(() => {
    if (isPartyModeOn) {
      if (!audioElRef.current) return;

      // Initialize AudioContext and Analyser if not already done
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Determines how many data points we get for frequencies
        
        // Create a buffer for the frequency data
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }

      // Resume AudioContext if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Connect audio source only if it hasn't been connected or if it was disconnected
      // A more robust check might be needed if the audio source can change
      if (audioElRef.current && (!sourceRef.current || sourceRef.current.mediaElement !== audioElRef.current)) {
        // Disconnect previous source if any to avoid multiple processing
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination); // Connect analyser to output to hear music
      }
      
      if (audioElRef.current) {
        audioElRef.current.play().catch(error => console.error("Error playing audio:", error));
      }

      lastVolumeRef.current = 0; // Reset volume reference
      animationFrameIdRef.current = requestAnimationFrame(partyLoop);

    } else {
      // Cleanup when party mode is turned off
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioElRef.current) {
        audioElRef.current.pause();
      }
      // Optional: Disconnect analyser when not in use to save resources,
      // but be careful if you want to quickly re-enable party mode.
      // if (sourceRef.current) {
      //   sourceRef.current.disconnect();
      // }
      // if (analyserRef.current) {
      //    analyserRef.current.disconnect();
      // }
      // If you want to fully reset on stopping party mode:
      // if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      //   audioContextRef.current.close();
      //   audioContextRef.current = null;
      //   analyserRef.current = null;
      //   sourceRef.current = null;
      // }
    }

    // Cleanup on component unmount
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isPartyModeOn]); // Re-run effect when isPartyModeOn changes


  const handlePartyToggle = () => {
    setIsPartyModeOn(prev => !prev);
  };

  // Your existing color picker logic (simplified here)
  const [pickerColor, setPickerColor] = useState('#ffffff');
  const handlePickerColorChange = (color) => {
    if (!isPartyModeOn) { // Only allow manual change if party mode is off
        setBackgroundColor(color.startsWith('#') ? color : nameToHex(color)); // Assuming you have nameToHex
        setPickerColor(color.startsWith('#') ? color : nameToHex(color));
    }
  };

  // Example nameToHex (you might have a more complete one)
  const nameToHex = (name) => {
    const map = {'red': '#ff0000', 'blue': '#0000ff', 'green':'#008000', 'yellow': '#ffff00', 'purple': '#800080'};
    return map[name.toLowerCase()] || name;
  }


  return (
    <div className="App" style={{ 
        backgroundColor: backgroundColor, 
        minHeight: '100vh', 
        padding: '20px',
        transition: 'background-color 0.1s ease-out' // Faster transition for party feel
    }}>
      {/* Assuming .inverted-heading uses mix-blend-mode */}
      <h1 className="inverted-heading" style={{ transition: 'color 0.3s ease' }}>
        Color picker
      </h1>
      
      <div style={{ margin: '20px 0', textAlign: 'center' }}>
        <button onClick={handlePartyToggle} style={{padding: '10px 20px', fontSize: '16px', cursor: 'pointer'}}>
          {isPartyModeOn ? 'Stop Party Mode' : 'Start Party Mode!'}
        </button>
      </div>

      <div style={{margin: '20px 0', textAlign: 'center'}}>
        <audio ref={audioElRef} src="moichammoi.mp3" controls loop>
          Your browser does not support the audio element.
        </audio>
        <p style={{color: isPartyModeOn ? '#ccc': '#333'}}><small>Note: You need to provide a music file URL for <code>src</code> in the audio tag.</small></p>
      </div>

      {/* Your existing color palette and custom color picker */}
      {!isPartyModeOn && ( // Show color pickers only if party mode is off
        <>
          <div className='color-palette' style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            {initialColors.slice(0,5).map((colorNameOrHex, index) => { // Show a few example colors
              const displayColorHex = colorNameOrHex.startsWith('#') ? colorNameOrHex : nameToHex(colorNameOrHex);
              return (
                <div
                  key={index}
                  className='color-box'
                  title={colorNameOrHex}
                  style={{
                    backgroundColor: displayColorHex,
                    width: '50px',
                    height: '50px',
                    margin: '5px',
                    cursor: 'pointer',
                    border: `1px solid ${getContrastingTextColor(displayColorHex)}` // Assuming you have this
                  }}
                  onClick={() => { handlePickerColorChange(colorNameOrHex); }}
                ></div>
              );
            })}
          </div>

          <div className='custom-color-picker' style={{ textAlign: 'center' }}>
            <label htmlFor="customColorInput" style={{ marginRight: '10px', color: getContrastingTextColor(backgroundColor) }}>
              Custom background color:
            </label>
            <input
              id="customColorInput"
              type='color'
              value={pickerColor}
              onChange={(e) => handlePickerColorChange(e.target.value)}
              style={{ width: '100px', height: '50px', verticalAlign: 'middle' }}
              disabled={isPartyModeOn}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Dummy getContrastingTextColor for the color boxes border if you don't have it from previous step
// Replace with your actual implementation
function getContrastingTextColor(bgHex) {
    if (!bgHex || !bgHex.startsWith('#')) return '#000000';
    let hex = bgHex.slice(1);
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length !== 6) return '#000000';
    const r = parseInt(hex.substring(0,2),16);
    const g = parseInt(hex.substring(2,4),16);
    const b = parseInt(hex.substring(4,6),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}


export default App;