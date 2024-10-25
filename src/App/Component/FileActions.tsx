import './FileActions.css';

const FileActions = ({ onAddFile, onExportData }) => {
  return (
    <div className="file-actions">
      <button className="action-button add-file" onClick={onAddFile}>
        Add File
      </button>
      <button className="action-button export-data" onClick={onExportData}>
        Export Data
      </button>
    </div>
  );
};

export default FileActions;
