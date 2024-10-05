// import React, { useEffect, useState } from 'react';
// import { gapi } from 'gapi-script';

// const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
// const API_KEY = 'YOUR_GOOGLE_API_KEY';
// const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// function App() {
//   const [isSignedIn, setIsSignedIn] = useState(false);
//   const [files, setFiles] = useState([]);

//   // Initialize Google API client
//   useEffect(() => {
//     const initClient = () => {
//       gapi.client.init({
//         apiKey: 'AIzaSyDNOZKGW_nlw0FCMmJeu_vB0NyOzytjynQ',
//         clientId: '130064533513-3q1qluhmhmje804ks2cg7ki9mc0fp1n2.apps.googleusercontent.com',
//         discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
//         scope: SCOPES,
//       }).then(() => {
//         // Listen for sign-in state changes.
//         gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);

//         // Handle the initial sign-in state.
//         setIsSignedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
//       });
//     };

//     gapi.load('client:auth2', initClient);
//   }, []);

//   // Handle sign-in
//   const handleSignIn = () => {
//     gapi.auth2.getAuthInstance().signIn();
//   };

//   // Handle sign-out
//   const handleSignOut = () => {
//     gapi.auth2.getAuthInstance().signOut();
//   };

//   // List files in Google Drive
//   const listFiles = () => {
//     gapi.client.drive.files.list({
//       pageSize: 10,
//       fields: 'nextPageToken, files(id, name)',
//     }).then((response) => {
//       const files = response.result.files;
//       setFiles(files);
//     });
//   };

//   // Download selected file
//   const downloadFile = (fileId, fileName) => {
//     gapi.client.drive.files.get({
//       fileId: fileId,
//       alt: 'media',
//     }).then((response) => {
//       const blob = new Blob([response.body], { type: response.headers['Content-Type'] });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = fileName;
//       a.click();
//     });
//   };

//   return (
//     <div className="App">
//       <h1>Google Drive File Selector</h1>
//       {isSignedIn ? (
//         <>
//           <button onClick={handleSignOut}>Sign Out</button>
//           <button onClick={listFiles}>List Files</button>
//           <ul>
//             {files.map(file => (
//               <li key={file.id}>
//                 {file.name} <button onClick={() => downloadFile(file.id, file.name)}>Download</button>
//               </li>
//             ))}
//           </ul>
//         </>
//       ) : (
//         <button onClick={handleSignIn}>Sign In with Google</button>
//       )}
//     </div>
//   );
// }

// export default App;


import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = '130064533513-3q1qluhmhmje804ks2cg7ki9mc0fp1n2.apps.googleusercontent.com'; // Replace with your Google Client ID
const API_KEY = 'AIzaSyDNOZKGW_nlw0FCMmJeu_vB0NyOzytjynQ'; // Replace with your Google API Key
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Initialize Google API client
  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: SCOPES,
      }).then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);

        // Handle the initial sign-in state.
        setIsSignedIn(gapi.auth2.getAuthInstance().isSignedIn.get());
      });
    };

    gapi.load('client:auth2', initClient);
  }, []);

  // Handle sign-in
  const handleSignIn = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  // Handle sign-out
  const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut();
  };

  // List CSV files in Google Drive
  const listFiles = () => {
    gapi.client.drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, mimeType)',
      q: "mimeType='text/csv'", // Filter to show only CSV files
    }).then((response) => {
      const files = response.result.files;
      setFiles(files);
    });
  };

  // Handle file selection
  const handleFileSelection = (file) => {
    setSelectedFile(file); // Allow only one file selection
  };

  // Save the selected file to the Express backend
  const saveSelectedFile = () => {
    if (selectedFile) {
      gapi.client.drive.files.get({
        fileId: selectedFile.id,
        alt: 'media',
      }).then((response) => {
        const fileBlob = new Blob([response.body], { type: 'text/csv' });

        // Prepare form data to send the file to the backend
        const formData = new FormData();
        formData.append('file', fileBlob, selectedFile.name);

        // Send file to backend API to store in the 'data' folder
        fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        })
        .then(response => response.json())
        .then(data => {
          console.log('File saved successfully:', data);
          // alert(`File "${data.fileName}" saved to server!`);
        })
        .catch(error => {
          console.error('Error saving file:', error);
        });
      });
    }
  };

  return (
    <div className="App">
      <h1>Google Drive CSV File Picker</h1>
      {isSignedIn ? (
        <>
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={listFiles}>List CSV Files</button>
          <ul>
            {files.map(file => (
              <li key={file.id}>
                <input
                  type="radio"
                  name="file"
                  checked={selectedFile?.id === file.id}
                  onChange={() => handleFileSelection(file)}
                />
                {file.name}
              </li>
            ))}
          </ul>
          {selectedFile && (
            <button onClick={saveSelectedFile}>
              Save Selected File to Server
            </button>
          )}
        </>
      ) : (
        <button onClick={handleSignIn}>Sign In with Google</button>
      )}
    </div>
  );
}

export default App;
