import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const KPICards = () => {
  const kpis = [
    { label: 'Total Active Policies', value: '125,000' },
    { label: 'Claims in Progress', value: '850' },
    { label: 'Claim Settlement Ratio', value: '94.2%' },
    { label: 'Avg Claim Processing Time', value: '12 days' },
    { label: 'Policy Lapse Rate', value: '8.5%' },
    { label: 'Customer Satisfaction', value: '89%' },
  ];

  return (
    <div className="kpi-container">
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-card">
          <h2>{kpi.value}</h2>
          <p>{kpi.label}</p>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState([]);
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const speechText = event.results[event.results.length - 1][0].transcript;
      setTranscript(speechText);
      fetchQueryResult(speechText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      if (stopRequested) {
        setStopRequested(false);
        return;
      }

      if (listening) {
        try {
          recognition.start();
        } catch (error) {
          if (error.name !== 'InvalidStateError') {
            console.error("Failed to restart recognition:", error);
          }
        }
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      setStopRequested(true);
      setListening(false);
      recognitionRef.current.stop();
    } else {
      setStopRequested(false);
      setListening(true);
      setTranscript('');
      setResult([]);
      setSql('');

      try {
        recognitionRef.current.start();
      } catch (error) {
        if (error.name !== 'InvalidStateError') {
          console.error("Failed to start recognition:", error);
        }
      }
    }
  };

  const fetchQueryResult = async (question) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/ask', { question });
      const data = response.data;
      setSql(data.sql || '');
      setResult(data.result || []);
    } catch (error) {
      console.error(error);
      setResult([]);
    } finally {
      setLoading(false);
    }
  };

  const isISODate = (val) =>
    typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val);

  const formatDate = (val) => {
    const date = new Date(val);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <img src="/coaction-logo.jpg" alt="Coaction Specialty" className="logo" />
        <h1 className="header-title">Policy Insights</h1>
      </header>

      <KPICards />

      <section className="voice-section">
        <h2>Talk to your data</h2>
        <button
          className={`listen-button ${listening ? 'listening' : ''}`}
          onClick={toggleListening}
        >
          {listening ? '🛑 Stop Listening' : '🎤 Start Listening'}
        </button>
        <p className="subtitle">Ask questions about policies, claims, or trends</p>
      </section>

      {transcript && (
        <div className="transcript">
          <p><strong>You said:</strong> {transcript}</p>
        </div>
      )}

      {sql && (
        <div className="sql-box">
          <strong>Generated SQL:</strong>
          <div><code>{sql}</code></div>
        </div>
      )}

      {loading && <div className="loader"></div>}

      {result.length > 0 && (
        <table className="result-table">
          <thead>
            <tr>
              {Object.keys(result[0]).map((key) => <th key={key}>{key}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j}>
                    {typeof val === 'number'
                      ? val.toLocaleString('en-US')
                      : (typeof val === 'string' && val.includes('GMT'))
                        ? new Date(val).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit'
                          })
                        : isISODate(val)
                          ? formatDate(val)
                          : val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default App;
