'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ParsedClip {
  episode: string;
  youtubeLink: string;
  startTime: string;
  endTime: string;
  language: string;
  category?: string;
  clipTitle?: string;
  briefDescription: string;
  needsAI?: boolean;
}

interface CSVImporterProps {
  onImport: (clips: ParsedClip[]) => void;
  categories: { id: string; name: string }[];
}

const MAX_CLIPS_PER_IMPORT = 100;

export default function CSVImporter({ onImport, categories }: CSVImporterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedClip[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      parseCSV(droppedFile);
    } else {
      setParseError('Please upload a CSV file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (csvFile: File) => {
    setParseError('');
    setParsedData([]);
    setProcessing(true);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setParseError('CSV file appears to be empty or has no data rows');
        setProcessing(false);
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['episode', 'youtube link', 'start time', 'end time', 'language', 'brief description'];
      const optionalHeaders = ['category', 'clip title'];
      
      // Check for required headers
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setParseError(`Missing required columns: ${missingHeaders.join(', ')}`);
        setProcessing(false);
        return;
      }

      // Parse data rows
      const clips: ParsedClip[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has incorrect number of columns, skipping`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });

        // Skip empty rows
        if (!row['youtube link'] || !row['start time'] || !row['end time']) {
          continue;
        }

        const clip: ParsedClip = {
          episode: row['episode'] || '',
          youtubeLink: row['youtube link'],
          startTime: row['start time'],
          endTime: row['end time'],
          language: row['language'] || 'English',
          briefDescription: row['brief description'] || '',
          category: row['category'] || undefined,
          clipTitle: row['clip title'] || undefined,
          // Mark clips without title as needing AI processing (regardless of language)
          needsAI: !row['clip title']
        };

        clips.push(clip);
      }

      if (clips.length === 0) {
        setParseError('No valid data rows found in CSV');
        setProcessing(false);
        return;
      }

      // Check if file is too large
      if (clips.length > MAX_CLIPS_PER_IMPORT) {
        setParseError(`File contains ${clips.length} clips. Maximum ${MAX_CLIPS_PER_IMPORT} clips per import. Please split your CSV into smaller files.`);
        setParsedData([]);
      } else {
        setParsedData(clips);
      }
      setProcessing(false);
    } catch (error) {
      setParseError(`Error parsing CSV: ${error}`);
      setProcessing(false);
    }
  };

  // Helper function to properly parse CSV line (handles commas in quoted fields)
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setParseError('');
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-300 hover:border-gray-400 bg-white'
            }
          `}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your CSV file here
          </p>
          <p className="text-sm text-gray-600 mb-4">
            or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Select CSV File
          </label>
          <div className="mt-4 text-xs text-gray-500">
            Required columns: Episode, YouTube Link, Start Time, End Time, Language, Brief Description
            <br />
            Optional columns: Category, Clip Title
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">{file.name}</span>
              <span className="text-sm text-gray-500">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>

          {processing && (
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing CSV...</span>
            </div>
          )}

          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{parseError}</div>
            </div>
          )}

          {parsedData.length > 0 && (
            <>
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <div className="font-medium">Successfully parsed {parsedData.length} clips</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Clips with titles provided:</span>
                      <span className="font-medium">{parsedData.filter(c => !c.needsAI).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clips needing AI titles:</span>
                      <span className="font-medium">{parsedData.filter(c => c.needsAI).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clips with categories:</span>
                      <span className="font-medium">{parsedData.filter(c => c.category).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ready to import:</span>
                      <span className="font-medium">{parsedData.filter(c => c.briefDescription).length}</span>
                    </div>
                  </div>
                  {parsedData.length > 50 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                      <strong>Note:</strong> Large import detected. Processing may take 1-2 minutes.
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Episode</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Language</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Time</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Title Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedData.slice(0, 5).map((clip, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{clip.episode}</td>
                        <td className="px-3 py-2">{clip.language}</td>
                        <td className="px-3 py-2 text-xs">
                          {clip.startTime} - {clip.endTime}
                        </td>
                        <td className="px-3 py-2 truncate max-w-xs" title={clip.briefDescription}>
                          {clip.briefDescription}
                        </td>
                        <td className="px-3 py-2">
                          {clip.clipTitle ? (
                            <span className="text-green-600">✓ Provided</span>
                          ) : (
                            <span className="text-blue-600">AI Generated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    ... and {parsedData.length - 5} more clips
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import {parsedData.length} Clips
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}