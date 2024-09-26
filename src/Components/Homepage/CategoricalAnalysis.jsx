import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import '../home.css';
import './style/style.css';

const CategoricalAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  // Handling file uploads and validation
  const handleFileUpload = (file) => {
    if (file.type !== 'text/csv') {
      setErrorMessage('Please upload a valid CSV file.');
      return;
    }

    setUploadedFile(file);
    setErrorMessage(''); // Clear any previous error messages
    const reader = new FileReader();

    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        complete: (result) => {
          const data = result.data;
          setFileData(data);  // Set file data for analysis

          // Perform analyses
          performCategoricalAnalysis(data);
          performMissingDataAnalysis(data);
          performDuplicateDataAnalysis(data);
        },
      });
    };

    reader.readAsText(file);  // Read the file content
  };

  // Perform Categorical Analysis: Sales by Product Category, Payment Method, Customer Segment
  const performCategoricalAnalysis = (data) => {
    const categorySummary = data.reduce((acc, row) => {
      const category = row['Product Category'];
      const value = parseFloat(row['Value']) || 0;
      acc[category] = (acc[category] || 0) + value;
      return acc;
    }, {});

    const paymentMethodSummary = data.reduce((acc, row) => {
      const paymentMethod = row['Payment Method'];
      const value = parseFloat(row['Value']) || 0;
      acc[paymentMethod] = (acc[paymentMethod] || 0) + value;
      return acc;
    }, {});

    const customerSegmentSummary = data.reduce((acc, row) => {
      const segment = row['Customer Segment'];
      const value = parseFloat(row['Value']) || 0;
      acc[segment] = (acc[segment] || 0) + value;
      return acc;
    }, {});

    setAnalysisResults((prev) => ({
      ...prev,
      categorySummary,
      paymentMethodSummary,
      customerSegmentSummary,
    }));
  };

  // Missing Data Analysis
  const performMissingDataAnalysis = (data) => {
    const missingValues = {};
    const totalRows = data.length;
    let totalMissing = 0;

    data.forEach((row) => {
      Object.keys(row).forEach((column) => {
        if (!row[column]) {
          missingValues[column] = (missingValues[column] || 0) + 1;
          totalMissing++;
        }
      });
    });

    const missingPercentage = ((totalMissing / (totalRows * Object.keys(data[0]).length)) * 100).toFixed(2);

    setAnalysisResults((prev) => ({
      ...prev,
      missingValues,
      missingPercentage,
    }));
  };

  // Duplicate Data Analysis
  const performDuplicateDataAnalysis = (data) => {
    const uniqueRows = new Set(data.map((row) => JSON.stringify(row)));
    const duplicateCount = data.length - uniqueRows.size;
    const duplicatePercentage = ((duplicateCount / data.length) * 100).toFixed(2);

    setAnalysisResults((prev) => ({
      ...prev,
      duplicateCount,
      duplicatePercentage,
    }));
  };

  // Load sample CSV
  const loadSampleCSV = () => {
    let csvFilePath = './assets/sales_analysis.csv';

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

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileData([]);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    setErrorMessage(''); // Clear any existing error message
    console.log('Updated CSV Data:', fileData); // Handle saving or further processing
  };

  const handleCellChange = (rowIndex, header, value) => {
    const updatedData = [...fileData];
    updatedData[rowIndex][header] = value;
    setFileData(updatedData);
  };

  const renderCSVTable = (data) => {
    if (!data.length) return null;

    const headers = Object.keys(data[0]); // Assuming first row has headers

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
                      value={row[header]} // Access cell by header name
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

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.csv',
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  return (
    <div className="upload-container">
      {/* File upload dropzone */}
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <button type="button" className="upload-btn">
          <i className="fas fa-upload"></i> Browse Files
        </button>
        <span> Or drag and drop files</span>
      </div>

      {/* Add Google Drive Browse Button */}
      <div className="picker-btn">
        <GoogleDrivePicker />
      </div>

      {/* Display uploaded file if present */}
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
              <FontAwesomeIcon
                icon={faTimes}
                className="remove-file-icon"
                onClick={handleRemoveFile}
              />
            </div>
          </div>

          {/* Render the CSV table */}
          <div className="scroll">{renderCSVTable(fileData)}</div>
        </div>
      )}

      {/* Button to load and display a sample CSV */}
      <button className="sample-csv-btn" onClick={loadSampleCSV}>
        <FontAwesomeIcon icon={faFileAlt} /> View Sample CSV
      </button>

      {/* Display sample CSV if loaded */}
      {sampleFileData.length > 0 && (
        <div className="sample-csv-container">
          <div className="sample-file-header">
            <h3>Sample CSV File</h3>
            <FontAwesomeIcon
              icon={faTimes}
              className="remove-sample-file-icon"
              onClick={() => setSampleFileData([])}
            />
          </div>
          <div className="scroll">{renderCSVTable(sampleFileData)}</div>
        </div>
      )}

      {/* Categorical Analysis Results */}
      {analysisResults.categorySummary && (
        <div>
          <h4>Product Category Sales Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Product Category</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisResults.categorySummary).map(([category, value]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysisResults.paymentMethodSummary && (
        <div>
          <h4>Payment Method Sales Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisResults.paymentMethodSummary).map(([method, value]) => (
                <tr key={method}>
                  <td>{method}</td>
                  <td>{value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysisResults.customerSegmentSummary && (
        <div>
          <h4>Customer Segment Sales Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Customer Segment</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisResults.customerSegmentSummary).map(([segment, value]) => (
                <tr key={segment}>
                  <td>{segment}</td>
                  <td>{value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display analysis for missing and duplicate data */}
      {analysisResults.missingValues && (
        <div className="analysis-results">
          <h3>Missing Data Analysis</h3>
          <p>Missing Percentage: {analysisResults.missingPercentage}%</p>
          <ul>
            {Object.entries(analysisResults.missingValues).map(([column, count]) => (
              <li key={column}>
                {column}: {count} missing values
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysisResults.duplicatePercentage && (
        <div className="analysis-results">
          <h3>Duplicate Data Analysis</h3>
          <p>Duplicate Count: {analysisResults.duplicateCount}</p>
          <p>Duplicate Percentage: {analysisResults.duplicatePercentage}%</p>
        </div>
      )}

      {/* Display any error message */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default CategoricalAnalysis;