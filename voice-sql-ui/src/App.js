import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FilterSidebar from './components/FilterSidebar';
import KPICards from './components/KPICards';
import VoiceInput from './components/VoiceInput';
import SQLBox from './components/SQLBox';
import Loader from './components/Loader';
import NoData from './components/NoData';
import ResultTable from './components/ResultTable';
import Footer from './components/Footer';
import './App.css';


const App = () => {
  const [transcript, setTranscript] = useState('');
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const [filters, setFilters] = useState({
    manualQuery: '',
    effectiveFrom: '',
    effectiveTo: '',
    transactionType: '',
    insuredState: '',
    coverage: '',
    limitMin: '',
    limitMax: '',
    premiumMin: '',
    premiumMax: ''
  });

  const [manualQueryResults, setManualQueryResults] = useState([]);
  const [filterResults, setFilterResults] = useState([]);
  const [manualQueryAttempted, setManualQueryAttempted] = useState(false);
  const [filterAttempted, setFilterAttempted] = useState(false);

  const recognitionRef = useRef(null);
  const stopRequestedRef = useRef(false);
  const listeningRef = useRef(false); // ✅ New ref to track listening state

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const speechText = event.results[event.results.length - 1][0].transcript;
      setTranscript(speechText);
      handleManualQuerySubmit(speechText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      console.error("Speech recognition error:", event.error);
      setListening(false);
      listeningRef.current = false;
    };

    recognition.onend = () => {
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        console.log("Stopped listening on user request.");
        return;
      }
      if (listeningRef.current) {  // ✅ Use ref to check active listening
        try {
          recognition.start();
          console.log("Restarting recognition...");
        } catch (error) {
          if (error.name !== 'InvalidStateError') console.error("Failed to restart recognition:", error);
        }
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      stopRequestedRef.current = true;
      listeningRef.current = false; // ✅ Update ref when stopping
      setListening(false);
      recognitionRef.current.stop();
    } else {
      stopRequestedRef.current = false;
      listeningRef.current = true;  // ✅ Update ref when starting
      setListening(true);
      setTranscript('');
      setSql('');
      setManualQueryResults([]);
      try {
        recognitionRef.current.start();
      } catch (error) {
        if (error.name !== 'InvalidStateError') console.error("Failed to start recognition:", error);
      }
    }
  };

  const handleManualQuerySubmit = async (query = filters.manualQuery) => {
    if (query.trim() === '') return;

    setManualQueryAttempted(true);
    setFilterAttempted(false);
    setFilterResults([]);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/ask', { question: query });
      const data = response.data;
      setSql(data.sql || '');
      setManualQueryResults(data.result || []);
    } catch (error) {
      console.error(error);
      setManualQueryResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async (currentFilters) => {
  // ✅ Prevent triggering with empty filters
  const isFilterApplied = Object.values(currentFilters).some(value => value !== '' && value !== null && value !== undefined);

  if (!isFilterApplied) {
    console.log('No filters selected, ignoring apply.');
    return;
  }

  setFilterAttempted(true);
  setManualQueryAttempted(false);
  setManualQueryResults([]);
  setLoading(true);

  try {
    const response = await axios.post('http://localhost:5000/filters', currentFilters);
    const data = response.data;
    setSql(data.sql || '');
    setFilterResults(data.result || []);
  } catch (error) {
    console.error(error);
    setFilterResults([]);
  } finally {
    setLoading(false);
  }
};


  const manualQueryColumns = manualQueryResults.length > 0
    ? Object.keys(manualQueryResults[0])
    : ["policy_number", "effective_date", "transaction_type", "insured_state", "coverage", "limit", "gross_premium"];

  const filterResultsColumns = filterResults.length > 0
    ? Object.keys(filterResults[0])
    : ["policy_number", "effective_date", "transaction_type", "insured_state", "coverage", "limit", "gross_premium"];

    const columnOrder = [
      'policy_number',
      'effective_date',
      'transaction_type',
      'insured_state',
      'coverage',
      'limit',
      'gross_premium'
    ];

    const columnDisplayNames = {
      policy_number: 'Policy Number',
      effective_date: 'Effective Date',
      transaction_type: 'Transaction Type',
      insured_state: 'Insured State',
      coverage: 'Coverage',
      limit: 'Policy Limit ($)',
      gross_premium: 'Gross Premium ($)'
    };


  return (
    <>
      <div className="app-layout">
        <main className="main-content">
          <header className="header">
            <img src="/coaction-logo.jpg" alt="Coaction Specialty" className="logo" />
            <h1 className="header-title">Policy Insights</h1>
          </header>

          <KPICards />

          <VoiceInput
            listening={listening}
            toggleListening={toggleListening}
            transcript={transcript}
          />

          <SQLBox sql={sql} />
          {loading && <Loader />}

          {manualQueryAttempted && !loading && (
            manualQueryResults.length > 0 ? (
              <ResultTable
                data={manualQueryResults}
                columnOrder={columnOrder}
                columnDisplayNames={columnDisplayNames}
              />
            ) : (
              <NoData message="No data found matching your query." />
            )
          )}

          {filterAttempted && !loading && !manualQueryAttempted && (
            <div>
              <h2 className="results-heading">Filtered Query Results</h2>
              {filterResults.length > 0 ? (
                <ResultTable
                  data={filterResults}
                  columnOrder={columnOrder}
                  columnDisplayNames={columnDisplayNames}
                />
              ) : (
                <NoData message="No data found matching your filters." />
              )}
            </div>
          )}
          
        </main>

        <FilterSidebar
          filters={filters}
          onChange={(name, value) => setFilters(prev => ({ ...prev, [name]: value }))}
          onApplyFilters={() => handleApplyFilters(filters)}
          onManualQuerySubmit={() => handleManualQuerySubmit()}
        />
      </div>

      <Footer />
    </>
  );
};

export default App;
