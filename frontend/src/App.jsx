import { useState } from 'react';

import {
  analyzePDFWithGemini,
} from './services/geminiService';

import {
  exportCSV,
  exportExcel,
} from './services/exportService';

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

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold mb-8">
          Sanctions Monitoring Dashboard
        </h1>

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
              {stats.totalEntities}
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

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
              className="bg-black text-white px-6 py-3 rounded-xl"
            >
              {loading
                ? 'Processing...'
                : 'Start Analysis'}
            </button>

            {results.length > 0 && (
              <>
                <button
                  onClick={() =>
                    exportCSV(results)
                  }
                  className="bg-green-600 text-white px-6 py-3 rounded-xl"
                >
                  Download CSV
                </button>

                <button
                  onClick={() =>
                    exportExcel(results)
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

          {/* Logs */}
          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-2xl font-bold mb-4">
              Processing Logs
            </h2>

            <div className="bg-black text-green-400 p-4 rounded-xl h-80 overflow-auto font-mono text-sm">

              {logs.map(
                (log, index) => (
                  <div key={index}>
                    {log}
                  </div>
                )
              )}

            </div>
          </div>

          {/* Errors */}
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

{/* Results Table */}
{results.length > 0 && (
  <div className="bg-white rounded-2xl shadow-lg p-6 overflow-hidden">

    <div className="flex justify-between items-center mb-4">

      <h2 className="text-2xl font-bold">
        Extracted Entities
      </h2>

      <div className="text-gray-500">
        Total Records: {results.length}
      </div>
    </div>

    <div className="overflow-auto max-h-[700px] border rounded-xl">

      <table className="min-w-full border-collapse text-sm">

        <thead className="sticky top-0 bg-gray-200 z-10">

          <tr>

            {Object.keys(results[0]).map(
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

          {results.map(
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