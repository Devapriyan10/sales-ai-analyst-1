import react from 'react';
import  { useEffect } from 'react';
import useDrivePicker from 'react-google-drive-picker'
const GoogleDrivePicker = () => {
    const [openPicker, authResponse] = useDrivePicker();
    const handleOpenPicker = () => {
        openPicker({
          clientId: "130064533513-3q1qluhmhmje804ks2cg7ki9mc0fp1n2.apps.googleusercontent.com",
          developerKey: "AIzaSyDNOZKGW_nlw0FCMmJeu_vB0NyOzytjynQ",
          viewId: "DOCS",
          // token: token, // pass oauth token in case you already have one
          showUploadView: true,
          showUploadFolders: true,
          supportDrives: true,
          multiselect: true, 
          // customViews: customViewsArray, // custom view
          callbackFunction: (data) => {
            if (data.action === 'cancel') {
              console.log('User clicked cancel/close button')
            }
            console.log(data)
          },
        })
      }
    return(
        <div>
             <button onClick={() => handleOpenPicker()}>Open Picker</button>
        </div>

    );
};
export default GoogleDrivePicker;