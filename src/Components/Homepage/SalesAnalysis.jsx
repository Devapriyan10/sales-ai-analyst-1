import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import './style/home.css';
import './style/style.css';

const SalesAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});

  // Handling file uploads and validation (CSV or Excel)
  const handleFileUpload = (file) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.xlsx')) {
      setErrorMessage('Please upload a valid CSV or Excel file.');
      return;
    }

    setUploadedFile(file);
    setErrorMessage('');
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        Papa.parse(e.target.result, {
          header: true,
          complete: (result) => {
            const data = result.data;
            setFileData(data);
            const headerRow = Object.keys(data[0]);
            const missingColumns = checkMissingColumnsAndDataAnalysis(headerRow, data);
            if (missingColumns.length === 0) {
              processData(data);
            }
          },
        });
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const headerRow = sheet[0]; // Assuming the first row is the header row
        const data = sheet.slice(1); // Data after the header
        setFileData(data);
        const missingColumns = checkMissingColumnsAndDataAnalysis(headerRow, data);
        if (missingColumns.length === 0) {
          processData(data);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Function to check missing columns and perform data analysis
  const checkMissingColumnsAndDataAnalysis = (headerRow, data) => {
    const salesAnalysisColumns = ["Transaction ID", "Date and Time", "Value", "Product Code"];

    let requiredColumns = salesAnalysisColumns; // You can update this based on other analysis options

    const lowerCasedHeaders = headerRow.map(col => col.toLowerCase());
    const lowerCasedRequiredColumns = requiredColumns.map(col => col.toLowerCase());

    // Check for missing columns
    const missingColumns = requiredColumns.filter(col => !lowerCasedHeaders.includes(col.toLowerCase()));

    if (missingColumns.length > 0) {
      setIsEditing(true);  // Enable edit mode to allow user to modify the CSV
      setErrorMessage(`Error: The following columns are missing: ${missingColumns.join(', ')}. Please edit the CSV file.`);
    } else {
      setIsEditing(false); // Disable edit mode if no columns are missing
      setErrorMessage(''); // Clear previous error messages
    }

    // Perform missing data analysis if no columns are missing
    if (missingColumns.length === 0) {
      const { columnMissingPercentage, missingScore } = analyzeMissingData(data);

      if (missingScore < 100) {
        setErrorMessage(`Warning: Missing data found. Missing data score: ${missingScore.toFixed(2)}%.`);
      }

      setAnalysisResults(prev => ({
        ...prev,
        missingData: { columnMissingPercentage, missingScore }
      }));
    }

    return missingColumns;
  };

  // Process data (trigger missing/duplicate data analysis)
  const processData = (data) => {
    analyzeMissingData(data);
    analyzeDuplicateData(data);
  };

  // Missing Data Analysis
  const analyzeMissingData = (data) => {
    const totalRows = data.length;
    const missingValues = {};
    const missingPercentage = {};

    data.forEach((row) => {
      Object.keys(row).forEach((col) => {
        if (!row[col]) {
          missingValues[col] = (missingValues[col] || 0) + 1;
        }
      });
    });

    Object.keys(missingValues).forEach((col) => {
      missingPercentage[col] = (missingValues[col] / totalRows) * 100;
    });

    const averageMissingPercentage =
      Object.values(missingPercentage).reduce((acc, perc) => acc + perc, 0) / Object.keys(missingPercentage).length;

    setAnalysisResults((prev) => ({
      ...prev,
      missingValues,
      missingPercentage,
      averageMissingPercentage: averageMissingPercentage.toFixed(2),
      missingScore: (100 - averageMissingPercentage).toFixed(2),
    }));

    return {
      columnMissingPercentage: missingPercentage,
      missingScore: (100 - averageMissingPercentage),
    };
  };

  // Duplicate Data Analysis
  const analyzeDuplicateData = (data) => {
    const uniqueRows = new Set();
    const duplicateRecords = [];

    data.forEach((row) => {
      const rowString = JSON.stringify(row);
      if (uniqueRows.has(rowString)) {
        duplicateRecords.push(row);
      } else {
        uniqueRows.add(rowString);
      }
    });

    const duplicatePercentage = (duplicateRecords.length / data.length) * 100;

    setAnalysisResults((prev) => ({
      ...prev,
      duplicatePercentage: duplicatePercentage.toFixed(2),
      duplicateScore: (100 - duplicatePercentage).toFixed(2),
    }));
  };

  // Function to load sample CSV
  const loadSampleCSV = () => {
    let csvFilePath = './assests/product_analysis.csv';

    if (csvFilePath) {
      fetch(csvFilePath)
        .then((response) => response.text())
        .then((csvText) => {
          Papa.parse(csvText, {
            header: false,
            complete: (result) => {
              setSampleFileData(result.data);
            },
          });
        })
        .catch((error) => console.error('Error loading sample CSV:', error));
    }
  };

  // useDropzone hook to handle drag-and-drop functionality
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      handleFileUpload(file);
    }
  });


  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileData([]);
    setAnalysisResults({});
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    console.log('Updated CSV Data:', fileData); // Handle saving or further processing
  };

  const handleCellChange = (rowIndex, cellIndex, value) => {
    const updatedData = [...fileData];
    updatedData[rowIndex][cellIndex] = value;
    setFileData(updatedData);
  };

  // Render CSV table
  const renderCSVTable = (data) => {
    if (!data.length) return null;

    const headers = Object.keys(data[0]);

    return (
      <table className="csv-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, cellIndex) => (
                <td key={cellIndex}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={row[header]}
                      onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                    />
                  ) : (
                    row[header]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const displayResults = () => {
    const { missingValues, missingPercentage, averageMissingPercentage, missingScore, duplicatePercentage, duplicateScore } = analysisResults;


    return (
      <div>
        <h3>Missing Data Analysis</h3>
        <pre>{JSON.stringify(missingValues, null, 2)}</pre>
        <p>Missing Data Percentage: {JSON.stringify(missingPercentage, null, 2)}</p>
        <p>Average Missing Data Percentage: {averageMissingPercentage}%</p>
        <p>Missing Data Score: {missingScore}</p>

        <h3>Duplicate Data Analysis</h3>
        <p>Duplicate Data Percentage: {duplicatePercentage}%</p>
        <p>Duplicate Data Score: {duplicateScore}</p>
      </div>
    );
  };

  return (
    <div className="upload-container">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <button type="button" className="upload-btn">
          <i className="fas fa-upload"></i> Browse Files
        </button>
        <span> Or drag and drop files</span>
      </div>

      {/* Google Drive Picker */}
      <div className="picker-btn">
        <GoogleDrivePicker />
      </div>

      {uploadedFile && (
        <div className="uploaded-file-container">
          <div className="uploaded-file-header">
            <h3
              className="file-name"
              onClick={() => setIsEditing(!isEditing)}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              {uploadedFile.name}
            </h3>
            <div className="file-options">
              <FontAwesomeIcon
                icon={isEditing ? faSave : faEdit}
                className="edit-save-icon"
                onClick={isEditing ? handleSaveChanges : handleEditToggle}
              />
              <FontAwesomeIcon icon={faTimes} className="remove-file-icon" onClick={handleRemoveFile} />
            </div>
          </div>

          <div className="scroll">{renderCSVTable(fileData)}</div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {/* Display analysis results */}
          {analysisResults && displayResults()}
        </div>
      )}

      {/* Sample CSV loading */}
      <button className="sample-csv-btn" onClick={loadSampleCSV}>
        <FontAwesomeIcon icon={faFileAlt} /> View Sample CSV
      </button>

      {sampleFileData.length > 0 && (
        <div className="sample-csv-container">
          <div className="sample-file-header">
            <h3>Sample CSV File</h3>
            <FontAwesomeIcon icon={faTimes} className="remove-sample-file-icon" onClick={() => setSampleFileData([])} />
          </div>
          <div className="scroll">{renderCSVTable(sampleFileData)}</div>
        </div>
      )}
    </div>
  );
};

export default SalesAnalysis;