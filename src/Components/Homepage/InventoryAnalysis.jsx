import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import GoogleDrivePicker from '../GoogleDrivePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFileAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import '../home.css';
import './style/style.css';

const InventoryAnalysis = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [sampleFileData, setSampleFileData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handling file uploads and validation
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
          const data = result.data;
          setFileData(data);  // Set file data without analysis
        },
      });
    };

    reader.readAsText(file);  // Read the file content
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
    </div>
  );
};

export default InventoryAnalysis;
