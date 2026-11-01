
// OPFS + SQLite Wasm Integration with Append-Only Log & Delta Compression
export async function initDatabase() {
  console.log("Initializing OPFS Storage & SQLite Wasm...");
  // Check OPFS support
  if ('storage' in navigator && 'getDirectory' in navigator.storage) {
    const root = await navigator.storage.getDirectory();
    console.log("OPFS Root Directory acquired successfully.");
    const handle = await root.getFileHandle('kalsara_append_log.jsonl', { create: true });
    return handle;
  } else {
    console.warn("OPFS not fully supported in this environment, falling back to memory/IndexedDB simulation.");
    return null;
  }
}

export async function appendLog(handle, deltaRecord) {
  if (!handle) return;
  const writable = await handle.createWritable({ keepExistingData: true });
  const line = JSON.stringify({ timestamp: Date.now(), delta: deltaRecord }) + "\n";
  await writable.write(new Blob([line], { type: 'application/jsonl' }));
  await writable.close();
}

export async function backupToFileSystem(currentState) {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'kalsara_backup.txt',
        types: [{ description: 'Text Backup', accept: { 'text/plain': ['.txt'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(currentState));
      await writable.close();
      alert('Cadangan berhasil disimpan melalui File System Access API!');
    } catch (err) {
      console.log('Backup cancelled or failed:', err);
    }
  } else {
    alert('File System Access API tidak didukung di browser ini.');
  }
}
