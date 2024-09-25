import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import '../home.css'
import './style/style.css';

const ProductAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});


  // File upload handling
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
          setFileData(data);  // Set file data without analysis

          // Perform analyses
          performProductAnalysis(data);
          performMissingDataAnalysis(data);
          performDuplicateDataAnalysis(data);
        },
      });
    };

    reader.readAsText(file);  // Read the file content
  };

  // Product Analysis: Analyze Profit by Product Code and Product Cost Summary
  const performProductAnalysis = (data) => {
    const productProfit = data.reduce((acc, row) => {
      const productCode = row['Product Code'];
      const profit = parseFloat(row['Profit']) || 0;
      acc[productCode] = (acc[productCode] || 0) + profit;
      return acc;
    }, {});

    const productCostSummary = data.reduce((acc, row) => {
      const productCode = row['Product Code'];
      const productCost = parseFloat(row['Product Cost']) || 0;
      acc[productCode] = (acc[productCode] || []).concat(productCost);
      return acc;
    }, {});

    const averageProductCost = Object.keys(productCostSummary).reduce((acc, productCode) => {
      const totalCost = productCostSummary[productCode].reduce((sum, cost) => sum + cost, 0);
      acc[productCode] = (totalCost / productCostSummary[productCode].length).toFixed(2);
      return acc;
    }, {});

    setAnalysisResults((prev) => ({
      ...prev,
      productProfit,
      averageProductCost,
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
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateCount = data.length - uniqueRows.size;
    const duplicatePercentage = ((duplicateCount / data.length) * 100).toFixed(2);

    setAnalysisResults((prev) => ({
      ...prev,
      duplicateCount,
      duplicatePercentage,
    }));
  };

  // Trigger all analyses after file upload
  const triggerAnalysis = () => {
    performProductAnalysis(fileData);
    performMissingDataAnalysis(fileData);
    performDuplicateDataAnalysis(fileData);
  };

  // Function to load sample CSV
  const loadSampleCSV = () => {
    let csvFilePath = './assests/sales_analysis.csv';

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

  // Dropzone for file uploading
  const { getRootProps, getInputProps } = useDropzone({
    accept: '.csv',
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

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

  const handleCellChange = (rowIndex, cellIndex, value) => {
    const updatedData = [...fileData];
    updatedData[rowIndex][cellIndex] = value;
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
                      onChange={(e) =>
                        handleCellChange(rowIndex, header, e.target.value)
                      }
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
  
      {/* Display uploaded file and trigger analysis */}
      {uploadedFile && (
        <div>
          <h3>{uploadedFile.name}</h3>
          <button onClick={triggerAnalysis} className="analyze-btn">Analyze File</button>
        </div>
      )}
  
      {/* Render editable CSV table */}
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
  
          <div className="scroll">{renderCSVTable(fileData)}</div>
        </div>
      )}
  
      {/* Display Product Analysis Results */}
      {analysisResults.productProfit && (
        <div>
          <h4>Product Profit Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisResults.productProfit).map(([code, profit]) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>{profit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
  
          <h4>Average Product Cost Summary</h4>
          <table>
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Average Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisResults.averageProductCost).map(([code, avgCost]) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>{avgCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
  
      {/* Display Missing Data Analysis */}
      {analysisResults.missingValues && (
        <div>
          <h4>Missing Data Analysis</h4>
          <p>Total Missing Data Percentage: {analysisResults.missingPercentage}%</p>
          <table>
            <thead>
              <tr>
                <th>Column</th>
                <th>Missing Values</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysisResults.missingValues).map(([col, count]) => (
                <tr key={col}>
                  <td>{col}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
  
      {/* Display Duplicate Data Analysis */}
      {analysisResults.duplicateCount !== undefined && (
        <div>
          <h4>Duplicate Data Analysis</h4>
          <p>Total Duplicate Rows: {analysisResults.duplicateCount}</p>
          <p>Duplicate Data Percentage: {analysisResults.duplicatePercentage}%</p>
        </div>
      )}
  
      {/* Display sample CSV file */}
      <button onClick={loadSampleCSV} className="sample-csv-btn">
        Load Sample CSV
      </button>
      {sampleFileData.length > 0 && (
        <div className="sample-csv-container">
          <h4>Sample CSV File</h4>
          <div className="scroll">
            {renderCSVTable(sampleFileData)}
          </div>
        </div>
      )}
    </div>
  );
  
};

export default ProductAnalysis;
