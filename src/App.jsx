import { useState, useEffect, useRef } from 'react';
import './App.css';


function App() {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isPartyMode, setIsPartyMode] = useState(false);
  const partyIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const colorInfo = hexToRgbHsl(backgroundColor);


  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log(`Copied: ${text}`);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleColorChange = (color) => {
    setBackgroundColor(color);
  };

  const startPartyMode = () => {
    setIsPartyMode(true);
    partyIntervalRef.current = setInterval(() => {
      const randomColor = getRandomColor();
      setBackgroundColor(randomColor);
    }, 200);

    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const stopPartyMode = () => {
    setIsPartyMode(false);
    clearInterval(partyIntervalRef.current);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    return () => clearInterval(partyIntervalRef.current);
  }, []);

  return (
    <div className="App" style={{ backgroundColor }}>
      {isPartyMode && <div className="music-bar-animation1"></div>}
      {isPartyMode && <div className="music-bar-animation2"></div>}
      {isPartyMode && <div className="music-bar-animation3"></div>}
      {isPartyMode && <div className="music-bar-animation4"></div>}
      {isPartyMode && <div className="music-bar-animation5"></div>}


      <h1 className="title inverted-heading">Color Picker</h1>

    {!isPartyMode && <div className="color-info inverted-heading" >
      <strong>HEX: </strong>{' '}
      <span className="copyable" onClick={() => copyToClipboard(colorInfo.hex)}>
        {colorInfo.hex}
      </span>
      &nbsp;&nbsp;

      <strong>RGB: </strong>{' '}
      <span className="copyable" onClick={() => copyToClipboard(colorInfo.rgb)}>
        {colorInfo.rgb}
      </span>
      &nbsp;&nbsp;

      <strong>HSL: </strong>{' '}
      <span className="copyable" onClick={() => copyToClipboard(colorInfo.hsl)}>
        {colorInfo.hsl}
      </span>
    </div>}

      <div className="color-palette">
        {[...Array(5)].map((_, index) => {
          const color = getRandomColor();
          return (
            <div
              key={index}
              className="color-box"
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            ></div>
          );
        })}
      </div>

      <div className="custom-color-picker">
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => handleColorChange(e.target.value)}
        />
      </div>

      <div className="party-controls">
        <button onClick={isPartyMode ? stopPartyMode : startPartyMode} className='party-button'>
          {isPartyMode ? '🛌🏻' : '😎'}
        </button>
      </div>

      <audio ref={audioRef} src="moichammoi.mp3" loop hidden />


      {isPartyMode && <div className="music-bar-animation5"></div>}
      {isPartyMode && <div className="music-bar-animation4"></div>}
      {isPartyMode && <div className="music-bar-animation3"></div>}
      {isPartyMode && <div className="music-bar-animation2"></div>}
      {isPartyMode && <div className="music-bar-animation1"></div>}
    </div>
  );
}

// Function to convert hex color to RGB and HSL to díplay
// in the color info section
function hexToRgbHsl(hex) {
  let r = 0, g = 0, b = 0;

  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h *= 60;
  }

  return {
    hex,
    rgb: `${r}, ${g}, ${b}`,
    hsl: `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`
  };
}


export default App;
