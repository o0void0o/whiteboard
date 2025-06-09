import { Tldraw } from 'tldraw'
import { useState } from 'react'
import 'tldraw/tldraw.css'

export default function App() {
  const [editor, setEditor] = useState(null)

  const handleMount = (editorInstance) => {
    setEditor(editorInstance)
  }

  const exportToFile = async () => {
    if (!editor) return
    
    try {
      // Get the complete snapshot of the store (all pages, shapes, etc.)
      const snapshot = editor.store.getSnapshot()
      
      // Get all assets (images, etc.) as base64
      const assets = {}
      const assetRecords = Object.values(snapshot.store).filter(record => record.typeName === 'asset')
      
      for (const asset of assetRecords) {
        if (asset.type === 'image' && asset.props.src) {
          try {
            // Convert image to base64 if it's not already
            if (!asset.props.src.startsWith('data:')) {
              const response = await fetch(asset.props.src)
              const blob = await response.blob()
              const reader = new FileReader()
              const base64 = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result)
                reader.readAsDataURL(blob)
              })
              assets[asset.id] = base64
            } else {
              assets[asset.id] = asset.props.src
            }
          } catch (error) {
            console.warn('Failed to export asset:', asset.id, error)
          }
        }
      }
      
      // Create export data with assets
      const exportData = {
        snapshot,
        assets,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
      
      // Create a downloadable file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      // Create download link
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tldraw-export-${new Date().toISOString().split('T')[0]}.json`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      URL.revokeObjectURL(url)
      
      console.log('Export successful!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Check console for details.')
    }
  }

  const importFromFile = () => {
    if (!editor) return
    
    // Create file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const importData = JSON.parse(text)
        
        // Handle both old format (direct snapshot) and new format (with assets)
        let snapshot, assets = {}
        
        if (importData.snapshot) {
          // New format with assets
          snapshot = importData.snapshot
          assets = importData.assets || {}
        } else if (importData.store && importData.schema) {
          // Old format (direct snapshot)
          snapshot = importData
        } else {
          alert('Invalid tldraw file format')
          return
        }
        
        // Simple approach: use the built-in loadSnapshot method
        // This preserves the editor state properly
        editor.store.loadSnapshot(snapshot)
        
        // Restore assets after loading
        for (const [assetId, base64Data] of Object.entries(assets)) {
          try {
            const assetRecord = editor.getAsset(assetId)
            if (assetRecord && assetRecord.type === 'image') {
              editor.updateAsset({
                ...assetRecord,
                props: {
                  ...assetRecord.props,
                  src: base64Data
                }
              })
            }
          } catch (error) {
            console.warn('Could not restore asset:', assetId, error)
          }
        }
        
        // Wait a bit then zoom to fit
        setTimeout(() => {
          try {
            editor.zoomToFit({ animation: { duration: 500 } })
          } catch (error) {
            console.warn('Could not zoom to fit:', error)
          }
        }, 200)
        
        console.log('Import successful!')
      } catch (error) {
        console.error('Import failed:', error)
        alert('Import failed. Make sure the file is a valid tldraw export.')
      }
    }
    
    input.click()
  }

  const clearCanvas = () => {
    if (!editor) return
    
    if (confirm('Are you sure you want to clear everything? This cannot be undone.')) {
      editor.selectAll()
      editor.deleteShapes(editor.getSelectedShapeIds())
      // Also clear all pages except the current one
      const pages = editor.getPages()
      const currentPageId = editor.getCurrentPageId()
      pages.forEach(page => {
        if (page.id !== currentPageId) {
          editor.deletePage(page.id)
        }
      })
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* Control buttons - positioned to avoid overlapping with tldraw's UI */}
      <div style={{
        position: 'absolute',
        top: 80,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
        flexDirection: 'column'
      }}>
        <button
          onClick={exportToFile}
          disabled={!editor}
          style={{
            padding: '8px 12px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: editor ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: '500',
            minWidth: '80px'
          }}
        >
          Export All
        </button>
        
        <button
          onClick={importFromFile}
          disabled={!editor}
          style={{
            padding: '8px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: editor ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: '500',
            minWidth: '80px'
          }}
        >
          Import File
        </button>
        
        <button
          onClick={clearCanvas}
          disabled={!editor}
          style={{
            padding: '8px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: editor ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: '500',
            minWidth: '80px'
          }}
        >
          Clear All
        </button>
      </div>

      <Tldraw 
        persistenceKey="my-tldraw-app"
        onMount={handleMount}
      />
    </div>
  )
}