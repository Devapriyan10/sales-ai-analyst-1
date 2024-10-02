import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import '../home.css'
import './style/style.css';

const ProductAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});
  const [csvData, setCsvData] = useState(null);
  // Required columns for validation
  const [columnValidationResult, setColumnValidationResult] = useState(null); // State to store validation result

  // Required columns for validation
  const requiredColumns = [
    "Transaction ID", "Date and Time", "Value", "Product Code", "Product Name",
    "Product Category", "Product Cost", "Profit", "Payment Method", "Customer Segment"
  ];

  // Function to validate columns
  const validateColumns = (csvHeaders) => {
    const missingColumns = [];
    const lowerCasedHeaders = csvHeaders.map(header => header.toLowerCase());

    requiredColumns.forEach((col) => {
      if (!lowerCasedHeaders.includes(col.toLowerCase())) {
        missingColumns.push(col);
      }
    });

    return missingColumns;
  };

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
          const csvHeaders = result.meta.fields; // Get headers from CSV

          // Validate columns
          const missingColumns = validateColumns(csvHeaders);

          if (missingColumns.length > 0) {
            setColumnValidationResult({
              isValid: false,
              missingColumns: missingColumns
            });
            setErrorMessage(`The following columns are missing or incorrect: ${missingColumns.join(", ")}`);
          } else {
            setColumnValidationResult({
              isValid: true,
              missingColumns: []
            });
            setErrorMessage(''); // Clear any error messages
          }

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



  const processData = (data) => {
    // Your data processing logic here
    setFileData(data); // Save processed data
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
    fetch('/assets/product_analysis.csv')
      // Update this path if necessary
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text(); // Return the raw CSV data as text
      })
      .then(data => {
        // Use PapaParse to parse the CSV data
        Papa.parse(data, {
          header: true, // Treat the first row as header
          complete: (result) => {
            setCsvData(result.data); // Set the parsed CSV data to state
            console.log('Updated CSV Data State:', result.data); // Log parsed data for debugging
          }
        });
      })
      .catch(error => {
        console.error('Error fetching the CSV file:', error); // Handle any errors
      });
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
    setIsEditing(false); // Exit editing mode
    setErrorMessage(''); // Clear any existing error message
    console.log('Updated CSV Data:', fileData); // Log the updated data for further processing
    // You can also handle saving the data to a server here if needed
  };
  
  const handleCellChange = (rowIndex, header, value) => {
    const updatedData = [...fileData];
    updatedData[rowIndex][header] = value; // Update the specific cell value
    setFileData(updatedData); // Set the updated data
  };
  

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

      {errorMessage && <div className="error-message">{errorMessage}</div>}

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
          {/* {errorMessage && <div className="error-message">{errorMessage}</div>} */}
        </div>
      )}

      <div>
        {columnValidationResult && (
          columnValidationResult.isValid ? (
            <p style={{ color: 'green' }}>CSV columns match the required format.</p>
          ) : (
            <p style={{ color: 'red' }}>
            </p>
          )
        )}
      </div>

      {/* Display Product Analysis Results */}
      {columnValidationResult && columnValidationResult.isValid && analysisResults.productProfit && (
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
      {columnValidationResult && columnValidationResult.isValid && analysisResults.missingValues && (
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
      {columnValidationResult && columnValidationResult.isValid && analysisResults.duplicateCount !== undefined && (
        <div>
          <h4>Duplicate Data Analysis</h4>
          <p>Total Duplicate Rows: {analysisResults.duplicateCount}</p>
          <p>Duplicate Data Percentage: {analysisResults.duplicatePercentage}%</p>
        </div>
      )}

      {/* Display sample CSV file */}
      <button className="sample-csv-btn" onClick={loadSampleCSV}>
        <FontAwesomeIcon icon={faFileAlt} /> View Sample CSV
      </button>

      {csvData && csvData.length > 0 && (
        <div className="sample-csv-container">
          <div className="sample-file-header">
            <h3>Sample CSV File</h3>
            <FontAwesomeIcon
              icon={faTimes}
              className="remove-sample-file-icon"
              onClick={() => setCsvData(null)}
            />
          </div>
          <div className="scroll">
            <table border="1">
              <thead>
                <tr>
                  {Object.keys(csvData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

};

export default ProductAnalysis; 