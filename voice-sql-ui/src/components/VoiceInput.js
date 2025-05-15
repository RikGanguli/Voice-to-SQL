import React from 'react';
import './VoiceInput.css';

const VoiceInput = ({ listening, toggleListening, transcript }) => (
  <>
    <section className="voice-section">
        <div className="voice-content">
            {/* <h2 className="gradient-text">Talk to your data</h2> */}
            <button className={`listen-button ${listening ? 'listening' : ''}`} onClick={toggleListening}>
                {listening ? '🛑 Stop Listening' : '🎤 Talk to your Data'}
            </button>
            <p className="subtitle">Ask questions about policies, claims, or trends</p>
        </div>
    </section>

    {transcript && (
        <div className="transcript">
            <p><strong>You Said:</strong> {transcript.charAt(0).toUpperCase() + transcript.slice(1)}</p>
        </div>
    )}
  </>
);

export default VoiceInput;
