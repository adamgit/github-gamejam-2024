export const openIndexedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('windowPositionsDB', 1);
      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('windows')) {
          db.createObjectStore('windows', { keyPath: 'id' });
        }
      };
      request.onsuccess = function (event) {
        resolve(event.target.result);
      };
      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  };
  
  export const saveWindowData = async (id, data) => {
    const db = await openIndexedDB();
    const transaction = db.transaction(['windows'], 'readwrite');
    const store = transaction.objectStore('windows');

    //console.log("saving entry for window-key = "+id+" = "+JSON.stringify(data))
    store.put({ id, ...data });
  };
  
  export const loadWindowData = async (id) => {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['windows'], 'readonly');
      const store = transaction.objectStore('windows');
      const request = store.get(id);

      request.onsuccess = function (event) {
        //console.log("found entry for window-key = "+id+" = "+JSON.stringify(event.target.result))
        resolve(event.target.result);
      };
      request.onerror = function (event) {
        console.log("NO entries for window-key = "+id+" = "+JSON.stringify(event.target.result))
        reject(event.target.error);
      };
    });
  };
  
  export const deleteWindowData = async (id) => {
    const db = await openIndexedDB();
    const transaction = db.transaction(['windows'], 'readwrite');
    const store = transaction.objectStore('windows');
    store.delete(id);
  };
  