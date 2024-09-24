import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import '../home.css'
import './style/style.css'
const SalesAnalysis = () => {

  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  //const [openPicker, data, authResponse] = useDrivePicker()
  const checkMissingColumnsAndDataAnalysis = (headerRow, data) => {
    // Define required columns for each analysis type
    const salesAnalysisColumns = ["Transaction ID", "Date and Time", "Value", "Product Code"];
    const categoricalAnalysisColumns = [...salesAnalysisColumns, "Product Category", "Product Method", "Customer Segment"];
    const productAnalysisColumns = [...categoricalAnalysisColumns, "Product Name", "Product Cost", "Profit"];
    const inventoryAnalysisColumns = [...categoricalAnalysisColumns, "Storage Location", "Stock Level", "Restock Frequency"];
  
    let requiredColumns = [];
  
    // Determine the required columns based on the selected option
  
        requiredColumns = salesAnalysisColumns;
  
    // Check for missing columns
    const missingColumns = requiredColumns.filter(col => !headerRow.includes(col));
  
    if (missingColumns.length > 0) {
      setIsEditing(true);  // Enable edit mode to allow user to modify the CSV
      setErrorMessage(`Error: The following columns are missing: ${missingColumns.join(', ')}. Please edit the CSV file.`);
    } else {
      setIsEditing(false); // Disable edit mode if no columns are missing
      setErrorMessage(''); // Clear previous error messages
    }
  
    // Perform missing data analysis if no columns are missing
    if (missingColumns.length === 0) {
      const { columnMissingPercentage, missingScore } = missingDataAnalysis(data);
  
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
  
  
  // Missing Data Analysis
  const missingDataAnalysis = (data) => {
    if (!data || data.length === 0) {
      setErrorMessage('Error: No data provided for missing data analysis.');
      return {
        columnMissingDetails: {},
        rowsWithMissingData: [],
        missingScore: 100,
      };
    }
  
    const columnMissingDetails = {};
    const rowsWithMissingData = [];
    let totalMissing = 0;
  
    Object.keys(data[0]).forEach((column) => {
      const missingIndices = [];
      const missingCount = data.filter((row, index) => {
        if (!row[column] || row[column] === "") {
          missingIndices.push(index + 1);  // Store row number with missing data
          return true;
        }
        return false;
      }).length;
  
      const missingPercentage = (missingCount / data.length) * 100;
      columnMissingDetails[column] = {
        missingCount,
        missingPercentage: missingPercentage.toFixed(2),
        missingIndices,
      };
      totalMissing += missingPercentage;
  
      if (missingIndices.length > 0) {
        rowsWithMissingData.push({ column, rows: missingIndices });
      }
    });
  
    const averageMissingPercentage = (totalMissing / Object.keys(data[0]).length).toFixed(2);
  
    setAnalysisResults(prev => ({
      ...prev,
      missingDataDetails: columnMissingDetails,
      rowsWithMissingData,
      averageMissingPercentage,
    }));
  
    const missingScore = (100 - averageMissingPercentage).toFixed(2);
    return { columnMissingDetails, rowsWithMissingData, missingScore };
  };
  
  
// Duplicate Data Analysis
const duplicateDataAnalysis = (data) => {
  const uniqueRows = new Set(data.map(JSON.stringify));
  const duplicateCount = data.length - uniqueRows.size;
  const duplicatePercentage = (duplicateCount / data.length) * 100;

  setAnalysisResults(prev => ({
    ...prev,
    duplicateData: {
      duplicateCount,
      duplicatePercentage: duplicatePercentage.toFixed(2),
    }
  }));

  const duplicateScore = 100 - duplicatePercentage;
  return { duplicateCount, duplicateScore };
};


// Data Quality Score Calculation
const dataQualityScore = (missingScore, duplicateScore) => {
  const overallScore = (missingScore + duplicateScore) / 2;
  setAnalysisResults(prev => ({
    ...prev,
    overallDataQualityScore: overallScore.toFixed(2),
  }));
  return overallScore;
};


// Suggest Methods for Fixing Missing Data
const suggestMethodsForMissingData = (columnMissingPercentage) => {
  console.log("\n=== Methods to Fix Missing Data ===");
  for (const [col, perc] of Object.entries(columnMissingPercentage)) {
    console.log(`\nColumn: ${col} | Missing: ${perc.toFixed(2)}%`);
    console.log("Suggested Methods:");
    console.log("- Mode Imputation (replace missing values with the most frequent value)");
    console.log("- Fill with 'Unknown' or 'Other'");
    console.log("- Drop Rows (if the missing percentage is too high)");
  }
};

// Suggest Methods for Fixing Duplicate Data
const suggestMethodsForDuplicateData = () => {
  console.log("\n=== Methods to Fix Duplicate Data ===");
  console.log("- Drop Duplicate Rows (use unique sets)");
  console.log("- Aggregate Duplicate Rows (e.g., sum or average values for numerical columns)");
};



  const handleRemoveSampleFile = () => {
    setSampleFileData([]);
  };

    
  
//handling file uploads and validation
const handleFileUpload = (file) => {
  if (file.type !== 'text/csv') {
    setErrorMessage('Please upload a valid CSV file.');
    return;
  }

  setUploadedFile(file);
  setErrorMessage('');  // Clear any previous error messages
  const reader = new FileReader();

  reader.onload = (e) => {
    Papa.parse(e.target.result, {
      header: true,
      complete: (result) => {
        const headerRow = result.meta.fields;
        const data = result.data;

        // Check for missing columns and perform missing data analysis
        const missingColumns = checkMissingColumnsAndDataAnalysis(headerRow);
        
        if (missingColumns.length > 0) {
          setErrorMessage(`Error: The following columns are missing: ${missingColumns.join(', ')}`);
          setFileData([]);  // Clear file data if columns are missing
        } else {
          // Perform detailed missing data analysis
          const { columnMissingDetails, rowsWithMissingData, missingScore } = missingDataAnalysis(data);
          
          // Optionally, log or set this detailed information in the state to display in the UI
          console.log("Missing Data Details:", columnMissingDetails);
          console.log("Rows with Missing Data:", rowsWithMissingData);
          console.log(`Overall Data Quality Score: ${missingScore}`);
          
          setFileData(data);  // Set file data if everything is valid
        }
      },
    });
  };

  reader.readAsText(file);  // Read the file content
};

  const loadSampleCSV = () => {
    let csvFilePath = './assests/sales_analysis.csv';

    if (csvFilePath) {
      fetch(csvFilePath)
        .then(response => response.text())
        .then(csvText => {
          Papa.parse(csvText, {
            header: false,
            complete: (result) => {
              setSampleFileData(result.data);
            },
          });
        })
        .catch(error => console.error('Error loading sample CSV:', error));
    }
  };

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
  console.log('analysis',analysisResults);
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

      {/* Display error message if any columns are missing */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

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

          {/* Render the CSV table, allowing edits even if missing columns */}
          <div className='scroll'> 
          {renderCSVTable(fileData)}
        </div>
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
              onClick={handleRemoveSampleFile}
            />
          </div>
          <div className='scroll'> 
          {renderCSVTable(sampleFileData)}</div>
        </div>
      )}

      {/* Data Analysis Results Section */}
      <div>
        <h2>Data Analysis</h2>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

        <div>
          <h3>Analysis Results:</h3>

          {/* Missing Data Analysis Section */}
          {analysisResults?.missingData && (
            <div>
              <h4>=== Missing Data Analysis ===</h4>
              <p><strong>Transaction ID:</strong> {analysisResults.missingData.transactionId ?? 'N/A'}</p>
              <p><strong>Date and Time:</strong> {analysisResults.missingData.dateAndTime ?? 'N/A'}</p>
              <p><strong>Value:</strong> {analysisResults.missingData.value ?? 'N/A'}</p>
              <p><strong>Product Code:</strong> {analysisResults.missingData.productCode ?? 'N/A'}</p>

              {/* Missing Data Percentage */}
              <h4>Missing Data Percentage:</h4>
              <p><strong>Transaction ID:</strong> {analysisResults.missingDataPercentage?.transactionId ?? 'N/A'}%</p>
              <p><strong>Date and Time:</strong> {analysisResults.missingDataPercentage?.dateAndTime ?? 'N/A'}%</p>
              <p><strong>Value:</strong> {analysisResults.missingDataPercentage?.value ?? 'N/A'}%</p>
              <p><strong>Product Code:</strong> {analysisResults.missingDataPercentage?.productCode ?? 'N/A'}%</p>

              <p><strong>Average Missing Data Percentage:</strong> {analysisResults.averageMissingDataPercentage ?? 'N/A'}%</p>
            </div>
          )}

          {/* Duplicate Data Analysis Section */}
          {analysisResults?.duplicateData && (
            <div>
              <h4>=== Duplicate Data Analysis ===</h4>
              <p><strong>Total Duplicate Rows:</strong> {analysisResults.duplicateData.duplicateCount ?? 'N/A'}</p>
              <p><strong>Duplicate Data Percentage:</strong> {analysisResults.duplicateData.duplicatePercentage ?? 'N/A'}%</p>
            </div>
          )}

          {/* Data Quality Score Section */}
          {analysisResults?.overallDataQualityScore && (
            <div>
              <h4>=== Data Quality Score ===</h4>
              <p><strong>Missing Data Score:</strong> {analysisResults.missingDataScore ?? 'N/A'}</p>
              <p><strong>Duplicate Data Score:</strong> {analysisResults.duplicateDataScore ?? 'N/A'}</p>
              <p><strong>Overall Data Quality Score:</strong> {analysisResults.overallDataQualityScore ?? 'N/A'}</p>
            </div>
          )}

          {/* Suggestions to Fix Missing Data */}
          {analysisResults?.missingDataSuggestions && (
            <div>
              <h4>=== Methods to Fix Missing Data ===</h4>
              {analysisResults.missingDataSuggestions.map((suggestion, index) => (
                <div key={index}>
                  <p><strong>Column:</strong> {suggestion.column}</p>
                  <p><strong>Missing Percentage:</strong> {suggestion.percentage}%</p>
                  <ul>
                    {suggestion.methods.map((method, idx) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalysis;
