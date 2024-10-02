import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import '../home.css';
import './style/style.css';

const InventoryAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});
  const [csvData, setCsvData] = useState(null);

  const requiredColumns = ['Transaction ID', 'Date and Time', 'Value', 'Product Code', 'Product Category', 'Restock Frequency', 'Stock Level', 'Storage Location', 'Payment Method', 'Customer Segment']; // Define required columns

  // Column validation function
  const validateColumns = (headers) => {
    const lowerCasedHeaders = headers.map(header => header.toLowerCase());
    const lowerCasedRequiredColumns = requiredColumns.map(col => col.toLowerCase());
    const missingColumns = requiredColumns.filter(col => !lowerCasedHeaders.includes(col.toLowerCase()));
    if (missingColumns.length > 0) {
      setErrorMessage(`Missing required columns: ${missingColumns.join(', ')}`);
      return false;
    }
    return true;
  };

  // Process the data
  const processData = (data) => {
    const headers = Object.keys(data[0]); // Get column headers from the first row
    if (!validateColumns(headers)) return; // Check for missing columns

    const cleanedData = cleanData(data);
    analyzeInventory(cleanedData);
    analyzeMissingData(cleanedData);
    analyzeDuplicateData(cleanedData);
    setFileData(cleanedData); // Save cleaned data for display
  };

  // Handling file uploads and validation
  const handleFileUpload = (file) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.xlsx')) {
      setErrorMessage('Please upload a valid CSV or Excel file.');
      return;
    }

    setUploadedFile(file);
    setErrorMessage(''); // Clear any previous error messages
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        Papa.parse(e.target.result, {
          header: true,
          complete: (result) => {
            const data = result.data;
            processData(data);
          },
        });
      };
      reader.readAsText(file); // Read CSV content
    } else if (file.name.endsWith('.xlsx')) {
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const headers = sheet[0]; // Assuming first row is headers in Excel
        if (!validateColumns(headers)) return; // Check for missing columns

        processData(sheet);
      };
      reader.readAsBinaryString(file); // Read Excel content
    }
  };

  // Function to load sample CSV
  const loadSampleCSV = () => {
    fetch('/assets/inventory_analysis.csv')
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



  // Data cleaning and transformation
  const cleanData = (data) => {
    return data.map((row) => ({
      ...row,
      restock_frequency: row.restock_frequency?.replace(/(Daily|Weekly|Monthly|Bi-weekly)\1/, '$1'),
      stock_level: parseFloat(row.stock_level) || null, // Convert stock level to number or null
    }));
  };

  // Inventory-specific analysis
  const analyzeInventory = (data) => {
    const stockSummary = data.reduce((acc, row) => {
      acc[row.product_code] = (acc[row.product_code] || 0) + (row.stock_level || 0);
      return acc;
    }, {});

    const restockSummary = data.reduce((acc, row) => {
      acc[row.product_code] = acc[row.product_code] || {};
      acc[row.product_code][row.restock_frequency] = (acc[row.product_code][row.restock_frequency] || 0) + 1;
      return acc;
    }, {});

    setAnalysisResults((prev) => ({
      ...prev,
      stockSummary,
      restockSummary,
    }));
  };

  // Missing data analysis
  const analyzeMissingData = (data) => {
    const missingValues = {};
    const totalRows = data.length;

    data.forEach((row) => {
      Object.keys(row).forEach((col) => {
        if (!row[col]) {
          missingValues[col] = (missingValues[col] || 0) + 1;
        }
      });
    });

    const missingPercentage = Object.keys(missingValues).reduce(
      (acc, key) => acc + (missingValues[key] / totalRows) * 100, 0
    ) / Object.keys(data[0]).length;

    setAnalysisResults((prev) => ({
      ...prev,
      missingValues,
      missingPercentage: missingPercentage.toFixed(2),
    }));
  };

  // Duplicate data analysis
  const analyzeDuplicateData = (data) => {
    const duplicates = data.filter((row, index, self) =>
      index !== self.findIndex((r) => JSON.stringify(r) === JSON.stringify(row))
    );

    const duplicatePercentage = (duplicates.length / data.length) * 100;

    setAnalysisResults((prev) => ({
      ...prev,
      duplicatePercentage: duplicatePercentage.toFixed(2),
      totalDuplicates: duplicates.length,
    }));
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.csv, .xlsx',
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

      {/* Display the error message */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Add Google Drive Browse Button */}
      <div className="picker-btn">
        <GoogleDrivePicker />
      </div>

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


          {/* Display analysis results */}
          {analysisResults.stockSummary && (
            <div>
              <h4>Stock Summary</h4>
              <pre>{JSON.stringify(analysisResults.stockSummary, null, 2)}</pre>

              <h4>Restock Summary</h4>
              <pre>{JSON.stringify(analysisResults.restockSummary, null, 2)}</pre>

              <h4>Missing Data Percentage</h4>
              <p>{analysisResults.missingPercentage ? `${analysisResults.missingPercentage}%` : 'No missing data analysis performed.'}</p>

              <h4>Total Duplicates</h4>
              <p>{analysisResults.totalDuplicates ? analysisResults.totalDuplicates : 'No duplicate data analysis performed.'}</p>

              <h4>Duplicate Data Percentage</h4>
              <p>{analysisResults.duplicatePercentage ? `${analysisResults.duplicatePercentage}%` : 'No duplicate data analysis performed.'}</p>

              {/* Optionally, display the missing values details */}
              {analysisResults.missingValues && (
                <div>
                  <h4>Missing Values Details</h4>
                  <pre>{JSON.stringify(analysisResults.missingValues, null, 2)}</pre>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryAnalysis;

