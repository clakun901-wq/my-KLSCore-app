// Modul File System Access API
export async function saveBackup(dataString) {
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: `kalsara-backup-${new Date().toISOString().split('T')[0]}.db`,
            types: [{ description: 'Database Backup', accept: { 'application/octet-stream': ['.db'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(dataString);
        await writable.close();
        return true;
    } catch (err) {
        console.error('Backup dibatalkan atau gagal', err);
        return false;
    }
}
