import { useState, useEffect, useRef } from 'react';

import {
  analyzePDFWithGemini,
} from './services/geminiService';

import {
  exportCSV,
  exportExcel,
} from './services/exportService';

import {
  fetchSanctionsData,
  fetchAutomationStatus,
  runAutomation,
  cancelAutomation,
} from './services/apiService';

export default function App() {
  const [files, setFiles] =
    useState([]);

  const [results, setResults] =
    useState([]);

  const [logs, setLogs] =
    useState([]);

  const [errors, setErrors] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [automationRunning, setAutomationRunning] =
    useState(false);

  const [forceReprocess, setForceReprocess] =
    useState(false);

  const [testLimit, setTestLimit] =
    useState('');

  const pollRef = useRef(null);

  const [stats, setStats] =
    useState({
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: 0,
      totalEntities: 0,
    });

  const addLog = (message) => {
    const timestamp =
      new Date().toLocaleTimeString();

    setLogs((prev) => [
      `[${timestamp}] ${message}`,
      ...prev,
    ]);
  };

  const addError = (message) => {
    const timestamp =
      new Date().toLocaleTimeString();

    setErrors((prev) => [
      `[${timestamp}] ${message}`,
      ...prev,
    ]);
  };

  const loadSanctionsData = async () => {
    try {
      const records = await fetchSanctionsData();

      if (records.length > 0) {
        setResults(records);
        setStats((prev) => ({
          ...prev,
          totalEntities: records.length,
        }));
        addLog(
          `Loaded ${records.length} records from sanctions list`
        );
      }
    } catch (error) {
      addError(
        `Failed to load sanctions data: ${error.message}`
      );
    }
  };

  useEffect(() => {
    loadSanctionsData();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const startStatusPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchAutomationStatus();

        if (status.logs?.length) {
          const formatted = status.logs
            .slice(0, 20)
            .map(
              (entry) =>
                `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.message}`
            );

          setLogs(formatted);
        }

        if (!status.isRunning) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setAutomationRunning(false);

          if (status.lastRun) {
            const summary = status.lastRun;

            addLog(
              summary.cancelled
                ? `Automation cancelled: saved ${summary.entitiesExtracted} entities from ${summary.pdfsProcessed} PDF(s)`
                : `Automation finished: ${summary.entitiesExtracted} entities from ${summary.pdfsProcessed} PDF(s)`
            );

            summary.errors?.forEach((err) => {
              addError(
                `${err.source || 'automation'}: ${err.message}`
              );
            });
          }

          await loadSanctionsData();
        }
      } catch (error) {
        console.error(error);
      }
    }, 2000);
  };

  const handleCancelAutomation = async () => {
    try {
      await cancelAutomation();
      addLog('Cancel requested — stopping after current PDF...');
    } catch (error) {
      addError(`Cancel failed: ${error.message}`);
    }
  };

  const handleFetchFromAmlc = async () => {
    setAutomationRunning(true);
    setLogs([]);
    setErrors([]);

    addLog(
      'Starting automated fetch from AMLC website...'
    );

    try {
      const options = {
        force: forceReprocess,
      };

      if (testLimit) {
        options.limit = Number(testLimit);
      }

      await runAutomation(options);
      startStatusPolling();
    } catch (error) {
      addError(
        `Automation failed: ${error.message}`
      );
      setAutomationRunning(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => {
          const base64 =
            reader.result.split(',')[1];

          resolve(base64);
        };

        reader.onerror = (error) =>
          reject(error);
      }
    );
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      alert('Upload PDFs first');
      return;
    }

    setLoading(true);

    setLogs([]);
    setErrors([]);

    let allResults = [];

    let processed = 0;
    let failed = 0;

    addLog(
      `Starting processing for ${files.length} files`
    );

    for (const file of files) {
      try {
        addLog(
          `Processing file: ${file.name}`
        );

        const start = performance.now();

        const base64 =
          await convertToBase64(file);

        addLog(
          `Converted ${file.name} to Base64`
        );

        const result =
          await analyzePDFWithGemini(
            base64
          );

        addLog(
          `Gemini response received for ${file.name}`
        );

        const text =
          result.candidates[0].content
            .parts[0].text;

        let parsed =
          JSON.parse(text);

        parsed = parsed.map((item) => ({
          ...item,
          'Source File': file.name,
        }));

        allResults = [
          ...allResults,
          ...parsed,
        ];

        processed++;

        const end = performance.now();

        addLog(
          `${file.name} completed in ${(
            (end - start) /
            1000
          ).toFixed(2)}s`
        );

      } catch (error) {
        failed++;

        addError(
          `${file.name} failed: ${error.message}`
        );

        console.error(error);
      }

      setStats({
        totalFiles: files.length,
        processedFiles: processed,
        failedFiles: failed,
        totalEntities:
          allResults.length,
      });
    }

    addLog('Processing complete');

    setResults(allResults);

    setLoading(false);
  };

  const displayResults = results;

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold mb-2">
          Sanctions Monitoring Dashboard
        </h1>

        <p className="text-gray-600 mb-8">
          Automated AMLC terrorism financing resolution monitoring
        </p>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-gray-500">
              Total Files
            </h2>

            <p className="text-4xl font-bold">
              {stats.totalFiles}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-gray-500">
              Processed
            </h2>

            <p className="text-4xl font-bold text-green-600">
              {stats.processedFiles}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-gray-500">
              Failed
            </h2>

            <p className="text-4xl font-bold text-red-600">
              {stats.failedFiles}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-gray-500">
              Entities Extracted
            </h2>

            <p className="text-4xl font-bold text-blue-600">
              {displayResults.length}
            </p>
          </div>
        </div>

        {/* Automation Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-l-4 border-blue-600">

          <h2 className="text-2xl font-bold mb-2">
            Automated AMLC Fetch
          </h2>

          <p className="text-gray-600 mb-4">
            Scrapes{' '}
            <a
              href="http://www.amlc.gov.ph/laws/terrorism-financing/resolution-related-to-terrorism-financing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              AMLC Resolution TF PDFs
            </a>
            , extracts entities, and saves to: 
            <a
              href="https://github.com/zmpld/sanction-list/tree/main/data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Extracted Sanction List
            </a>
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-4">

            <button
              onClick={handleFetchFromAmlc}
              disabled={automationRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {automationRunning
                ? 'Fetching from AMLC...'
                : 'Fetch from AMLC Website'}
            </button>

            {automationRunning && (
              <button
                onClick={handleCancelAutomation}
                className="bg-red-600 text-white px-6 py-3 rounded-xl"
              >
                Cancel
              </button>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={forceReprocess}
                onChange={(e) =>
                  setForceReprocess(
                    e.target.checked
                  )
                }
              />
              Re-process all PDFs
            </label>

            <label className="flex items-center gap-2 text-sm">
              Test limit:
              <input
                type="number"
                min="1"
                placeholder="all"
                value={testLimit}
                onChange={(e) =>
                  setTestLimit(
                    e.target.value
                  )
                }
                className="border rounded px-2 py-1 w-20"
              />
            </label>

            <button
              onClick={loadSanctionsData}
              className="bg-gray-200 text-gray-800 px-4 py-3 rounded-xl"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Manual Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

          <h2 className="text-2xl font-bold mb-4">
            Manual PDF Upload
          </h2>

          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) =>
              setFiles(
                Array.from(
                  e.target.files
                )
              )
            }
            className="mb-4"
          />

          <div className="flex gap-4 flex-wrap">

            <button
              onClick={handleAnalyze}
              disabled={loading || automationRunning}
              className="bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : 'Start Analysis'}
            </button>

            {displayResults.length > 0 && (
              <>
                <button
                  onClick={() =>
                    exportCSV(displayResults)
                  }
                  className="bg-green-600 text-white px-6 py-3 rounded-xl"
                >
                  Download CSV
                </button>

                <button
                  onClick={() =>
                    exportExcel(displayResults)
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl"
                >
                  Download Excel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Logs + Errors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-2xl font-bold mb-4">
              Processing Logs
            </h2>

            <div className="bg-black text-green-400 p-4 rounded-xl h-80 overflow-auto font-mono text-sm">

              {logs.length === 0 ? (
                <p>No logs yet</p>
              ) : (
                logs.map(
                  (log, index) => (
                    <div key={index}>
                      {log}
                    </div>
                  )
                )
              )}

            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-2xl font-bold mb-4 text-red-600">
              Error Tracking
            </h2>

            <div className="bg-red-50 p-4 rounded-xl h-80 overflow-auto text-sm">

              {errors.length === 0 ? (
                <p>
                  No errors detected
                </p>
              ) : (
                errors.map(
                  (error, index) => (
                    <div
                      key={index}
                      className="mb-2 text-red-700"
                    >
                      {error}
                    </div>
                  )
                )
              )}

            </div>
          </div>
        </div>

        {displayResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-2xl font-bold">
                Extracted Entities
              </h2>

              <div className="text-gray-500">
                Total Records: {displayResults.length}
              </div>
            </div>

            <div className="overflow-auto max-h-[700px] border rounded-xl">

              <table className="min-w-full border-collapse text-sm">

                <thead className="sticky top-0 bg-gray-200 z-10">

                  <tr>

                    {Object.keys(displayResults[0]).map(
                      (key) => (
                        <th
                          key={key}
                          className="border p-3 text-left font-bold whitespace-nowrap min-w-[180px]"
                        >
                          {key}
                        </th>
                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {displayResults.map(
                    (item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50"
                      >

                        {Object.values(item).map(
                          (value, idx) => (
                            <td
                              key={idx}
                              className="
                                border
                                p-3
                                align-top
                                whitespace-pre-wrap
                                break-words
                                max-w-[350px]
                              "
                            >
                              {value || (
                                <span className="text-gray-400">
                                  N/A
                                </span>
                              )}
                            </td>
                          )
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
