import { useState, useRef } from 'react'
import { Tldraw, loadSnapshot, getSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <FileSnapshotDemo />
    </div>
  )
}

// Enhanced snapshot functionality that saves to file including images
function FileSnapshotDemo() {
  const [editor, setEditor] = useState(null);
  const fileInputRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {/* Floating action button - now at bottom right */}
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        {/* Dropdown menu - now appears above the button */}
        {isMenuOpen && (
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              width: '160px',
              marginBottom: '8px'
            }}
          >
            <div 
              onClick={() => {
                handleSaveToFile(editor);
                setIsMenuOpen(false);
              }}
              style={{
                padding: '10px',
                cursor: editor ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: editor ? 1 : 0.5,
                borderBottom: '1px solid #eee',
                color: '#333',  // Dark text for contrast
                backgroundColor: 'white',
                transition: 'background-color 0.2s',
                ':hover': { backgroundColor: '#f5f5f5' }
              }}
              title="Save whiteboard to a file"
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <span style={{ fontSize: '16px' }}>💾</span>
              <span style={{ fontWeight: '500' }}>Save to File</span>
            </div>
            
            <div 
              onClick={() => {
                if (editor && fileInputRef.current) {
                  fileInputRef.current.click();
                  setIsMenuOpen(false);
                }
              }}
              style={{
                padding: '10px',
                cursor: editor ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: editor ? 1 : 0.5,
                color: '#333',  // Dark text for contrast
                backgroundColor: 'white',
                transition: 'background-color 0.2s'
              }}
              title="Load whiteboard from a file"
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <span style={{ fontSize: '16px' }}>📂</span>
              <span style={{ fontWeight: '500' }}>Load from File</span>
            </div>
          </div>
        )}
        
        {/* Menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#2563eb', // Updated to a nice blue color
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '20px'
          }}
          title="File Options"
        >
          {isMenuOpen ? "×" : "⋮"}
        </button>
      </div>
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }} 
        accept=".tldr" 
        onChange={(e) => handleFileUpload(e, editor)} 
      />
      
      {/* Main editor area */}
      <Tldraw onMount={setEditor} />
    </div>
  )
}

// Function to handle saving the whiteboard to a file
const handleSaveToFile = async (editor) => {
  if (!editor) return;

  try {
    // Get the complete snapshot including assets
    const snapshot = getSnapshot(editor.store);
    
    // Convert the snapshot to a JSON string
    const jsonString = JSON.stringify(snapshot);
    
    // Create a blob with the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-snapshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.tldr`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Snapshot saved to file successfully');
  } catch (error) {
    console.error('Error saving snapshot to file:', error);
    alert('Failed to save snapshot to file.');
  }
};

// Function to handle file upload and loading the snapshot
const handleFileUpload = async (event, editor) => {
  if (!editor || !event.target.files || event.target.files.length === 0) return;
  
  const file = event.target.files[0];
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      // Parse the JSON data from the file
      const snapshot = JSON.parse(e.target.result);
      
      // Reset the tool to select before loading the snapshot
      editor.setCurrentTool('select');
      
      // Load the snapshot into the editor
      loadSnapshot(editor.store, snapshot);
      
      console.log('Snapshot loaded from file successfully');
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error loading snapshot from file:', error);
      alert('Failed to load snapshot from file. The file may be corrupted or in an invalid format.');
      // Reset the file input
      event.target.value = '';
    }
  };
  
  reader.onerror = () => {
    console.error('Error reading file');
    alert('Error reading file');
    // Reset the file input
    event.target.value = '';
  };
  
  // Read the file as text
  reader.readAsText(file);
};