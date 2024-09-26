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
        processData(sheet);
      };
      reader.readAsBinaryString(file); // Read Excel content
    }
  };

  // Function to load sample CSV
  const loadSampleCSV = () => {
    let csvFilePath = './assests/inventory_analysis.csv';

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

  // Process the data
  const processData = (data) => {
    const cleanedData = cleanData(data);
    analyzeInventory(cleanedData);
    analyzeMissingData(cleanedData);
    analyzeDuplicateData(cleanedData);
    setFileData(cleanedData); // Save cleaned data for display
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

             
