import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './FileActions.css';

const FileActions = ({ onAddFile, onExportData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddFileClick = () => {
    setIsModalOpen(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.nodes && data.edges) {
            onAddFile(data.nodes, data.edges);
          } else {
            alert("Invalid JSON format. Make sure it contains 'nodes' and 'edges'.");
          }
        } catch (error) {
          alert("Failed to parse JSON. Please check the file.");
        }
        setIsModalOpen(false);
      };
      reader.readAsText(file);
    }
  };

  const handleExportClick = () => {
    Swal.fire({
      title: "Do you want to save the changes?",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Save",
      denyButtonText: `Don't save`
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Saved!", "", "success");
        onExportData(); // Call the export function here if confirmed
      } else if (result.isDenied) {
        Swal.fire("Changes are not saved", "", "info");
      }
    });
  };

  return (
    <div className="file-actions">
      <button className="action-button add-file" onClick={handleAddFileClick}>
        Import Json
      </button>
      <button className="action-button export-data" onClick={handleExportClick}>
        Export Json
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <input type="file" accept=".json" onChange={handleFileChange} />
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileActions;
