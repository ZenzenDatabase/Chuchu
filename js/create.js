import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Initializing Services
const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

let selectedType = 'moment';
let selectedFiles = []; // For images
let selectedVideoFile = null; // For video
let isUploading = false; // Prevent double-submissions

// --- UI ELEMENTS ---
const videoInput = document.getElementById('video-file');
const videoFileName = document.getElementById('video-file-name');
const progressBar = document.getElementById('upload-progress-bar');
const progressContainer = document.getElementById('upload-progress-container');
const statusText = document.getElementById('upload-status-text');
const saveBtn = document.querySelector('.save-btn'); // Ensure you have this class on your button

// --- INITIALIZATION ---
function init() {
  setupTypeSelector();
  setupPhotoUpload();
  setupVideoUpload();
}

function setupTypeSelector() {
  document.querySelectorAll('.type-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedType = opt.dataset.type;

      document.getElementById('photo-section').style.display = (selectedType === 'moment' || selectedType === 'album') ? 'block' : 'none';
      document.getElementById('video-section').style.display = selectedType === 'vlog' ? 'block' : 'none';
    });
  });
}

// --- PHOTO LOGIC ---
function setupPhotoUpload() {
  const area = document.getElementById('photo-upload-area');
  const input = document.getElementById('photo-input');
  if (!area || !input) return;

  area.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.filter(f => f.type.startsWith('image/'));
    
    // Add new files to existing ones, max 9 [cite: 11]
    selectedFiles = [...selectedFiles, ...newFiles].slice(0, 9);
    renderPhotoPreview();
    input.value = ''; // Reset so the same file can be picked again
  });
}

function renderPhotoPreview() {
  const grid = document.getElementById('photo-preview-grid');
  grid.innerHTML = ''; // Clear previous
  
  selectedFiles.forEach((file, i) => {
    const url = URL.createObjectURL(file); // Create preview URL
    const item = document.createElement('div');
    item.className = 'photo-preview-item';
    item.innerHTML = `
      <img src="${url}" alt="preview">
      <button class="photo-remove" onclick="removePhoto(${i})">✕</button>
    `;
    grid.appendChild(item);
  });
}

window.removePhoto = (index) => {
  selectedFiles.splice(index, 1);
  renderPhotoPreview();
};

// --- VIDEO LOGIC ---
function setupVideoUpload() {
  if (!videoInput) return;
  videoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      selectedVideoFile = e.target.files[0];
      videoFileName.innerText = selectedVideoFile.name;
    }
  });
}

// Core upload function with progress tracking [cite: 8, 9]
async function uploadFileWithProgress(file) {
  // Use user ID in path for security rules compliance [cite: 10]
  const filePath = `posts/${auth.currentUser.uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  progressContainer.style.display = 'block';

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = progress + '%';
        statusText.innerText = `Uploading: ${Math.round(progress)}%`;
      }, 
      (error) => {
        // Handle file size or permission errors [cite: 11, 12]
        console.error("Upload Error:", error);
        alert("Upload failed. Please ensure the file is under 200MB.");
        reject(error);
      }, 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// --- SAVE POST ---
async function savePost() {
  if (isUploading) return;

  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();

  if (!title && !content && selectedFiles.length === 0 && !selectedVideoFile) {
    alert('Please add a title, description, or media! ✏️');
    return;
  }

  try {
    isUploading = true;
    if (saveBtn) saveBtn.disabled = true;
    let mediaUrls = [];

    // 1. Handle Video Upload
    if (selectedType === 'vlog' && selectedVideoFile) {
      const url = await uploadFileWithProgress(selectedVideoFile);
      mediaUrls.push({ url, type: 'video' });
    } 
    // 2. Handle Image Uploads
    else if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const url = await uploadFileWithProgress(file);
        mediaUrls.push({ url, type: 'image' });
      }
    }

    // 3. Save metadata to Firestore [cite: 2, 6]
    await addDoc(collection(db, "posts"), {
      authorId: auth.currentUser.uid, [cite: 3, 6]
      title: title,
      content: content,
      type: selectedType,
      media: mediaUrls,
      createdAt: serverTimestamp()
    });

    alert('Memory saved! 🌟');
    window.location.href = 'feed.html';

  } catch (err) {
    console.error("Save Error:", err);
    alert('Error saving memory. Please try again.');
  } finally {
    isUploading = false;
    if (saveBtn) saveBtn.disabled = false;
  }
}

// --- UPDATE & DELETE FUNCTIONS --- [cite: 5, 7]
window.handleDelete = async (postId) => {
  if (confirm("Delete this memory permanently?")) {
    try {
      await deleteDoc(doc(db, "posts", postId));
      location.reload();
    } catch (err) {
      alert("You can only delete your own posts."); [cite: 7]
    }
  }
};

window.handleUpdate = async (postId, currentContent) => {
  const newContent = prompt("Update your memory text:", currentContent);
  if (newContent !== null && newContent !== currentContent) {
    try {
      await updateDoc(doc(db, "posts", postId), { 
        content: newContent,
        updatedAt: serverTimestamp() 
      });
      location.reload();
    } catch (err) {
      alert("Update failed. You can only edit your own posts."); [cite: 6]
    }
  }
};

document.addEventListener('DOMContentLoaded', init);
window.savePost = savePost;
