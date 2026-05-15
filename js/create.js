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

// --- UI ELEMENTS ---
const videoInput = document.getElementById('video-file');
const videoFileName = document.getElementById('video-file-name');
const progressBar = document.getElementById('upload-progress-bar');
const progressContainer = document.getElementById('upload-progress-container');
const statusText = document.getElementById('upload-status-text');

// --- INITIALIZATION ---
function init() {
  setupTypeSelector();
  setupPhotoUpload();
  setupVideoUpload();
}

// Switch between Moment (Images) and Vlog (Video)
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
    selectedFiles = [...selectedFiles, ...newFiles].slice(0, 9);
    renderPhotoPreview();
    input.value = '';
  });
}

function renderPhotoPreview() {
  const grid = document.getElementById('photo-preview-grid');
  grid.innerHTML = selectedFiles.map((file, i) => `
    <div class="photo-preview-item">
      <img src="${URL.createObjectURL(file)}" alt="preview">
      <button class="photo-remove" onclick="removePhoto(${i})">✕</button>
    </div>
  `).join('');
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

// The core upload function [cite: 8, 9]
async function uploadFileWithProgress(file, folder) {
  const filePath = `posts/${auth.currentUser.uid}/${Date.now()}-${file.name}`; [cite: 10]
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
        alert("Upload failed. Max size: 200MB."); [cite: 11, 12]
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
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();

  if (!title && !content && selectedFiles.length === 0 && !selectedVideoFile) {
    alert('Please add some content! ✏️');
    return;
  }

  try {
    let mediaUrls = [];

    // 1. Handle Video Upload (Vlog)
    if (selectedType === 'vlog' && selectedVideoFile) {
      const url = await uploadFileWithProgress(selectedVideoFile, 'videos');
      mediaUrls.push({ url, type: 'video' });
    } 
    // 2. Handle Image Uploads (Moments/Albums)
    else if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const url = await uploadFileWithProgress(file, 'images');
        mediaUrls.push({ url, type: 'image' });
      }
    }

    // 3. Save to Firestore [cite: 2, 6]
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
    console.error(err);
    alert('Error saving memory.');
  }
}

// --- UPDATE & DELETE FUNCTIONS --- [cite: 5, 7]
window.handleDelete = async (postId) => {
  if (confirm("Delete this memory permanently?")) {
    await deleteDoc(doc(db, "posts", postId));
    location.reload();
  }
};

window.handleUpdate = async (postId, currentContent) => {
  const newContent = prompt("Update your memory text:", currentContent);
  if (newContent) {
    await updateDoc(doc(db, "posts", postId), { content: newContent });
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', init);
window.savePost = savePost; // Make available to HTML button
