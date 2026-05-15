import { 
  getFirestore, collection, query, where, orderBy, getDocs, 
  doc, updateDoc, deleteDoc, onSnapshot 
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

let currentUser = null;
let currentFilter = 'all';

// --- INITIALIZATION ---
async function init() {
  // Listen for auth state changes
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    currentUser = user;
    renderProfilePanel();
    await loadPosts();
    setupTabs();
  });
}

// --- PROFILE LOGIC ---
function renderProfilePanel() {
  const panel = document.getElementById('profile-panel');
  if (!panel || !currentUser) return;

  const initials = currentUser.displayName ? getInitials(currentUser.displayName) : '?';
  
  panel.innerHTML = `
    <div class="profile-avatar-lg">
      ${currentUser.photoURL 
        ? `<img src="${currentUser.photoURL}" alt="avatar">` 
        : initials}
    </div>
    <div class="profile-info">
      <div class="profile-name">${currentUser.displayName || 'Family Member'}</div>
      <div class="profile-email">${currentUser.email}</div>
    </div>
    <button class="logout-btn" onclick="logout()">Logout</button>
  `;
}

window.logout = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
};

// --- DATA LOADING (FIREBASE) ---
async function loadPosts() {
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = '<div class="spinner"></div>';

  try {
    const postsCol = collection(db, "posts");
    let q;

    // Filter logic
    if (currentFilter !== 'all') {
      q = query(postsCol, where("type", "==", currentFilter), orderBy("createdAt", "desc"));
    } else {
      q = query(postsCol, orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    if (posts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-emoji">📸</div>
          <h3>No memories yet</h3>
          <p>Tap the <strong>+</strong> button to add<br>your first moment!</p>
        </div>`;
      return;
    }

    grid.innerHTML = posts.map((post, i) => renderPostCard(post, i)).join('');
  } catch (error) {
    console.error("Load error:", error);
    grid.innerHTML = '<div class="empty-state"><h3>Error loading feed</h3></div>';
  }
}

// --- UPDATE & DELETE FUNCTIONS ---
window.handleDelete = async (postId) => {
  if (confirm("Are you sure you want to delete this memory? 🌸")) {
    try {
      await deleteDoc(doc(db, "posts", postId)); [cite: 7]
      alert("Deleted successfully!");
      loadPosts(); 
    } catch (error) {
      alert("You don't have permission to delete this.");
    }
  }
};

window.handleUpdate = async (postId, currentContent) => {
  const newContent = prompt("Edit your memory description:", currentContent);
  if (newContent !== null && newContent !== currentContent) {
    try {
      await updateDoc(doc(db, "posts", postId), { content: newContent }); [cite: 6]
      alert("Updated!");
      loadPosts();
    } catch (error) {
      alert("Update failed. You can only edit your own posts.");
    }
  }
};

// --- UI RENDERING ---
function renderPostCard(post, index) {
  const isAuthor = currentUser && post.authorId === currentUser.uid; [cite: 3]
  const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
  
  const badgeClass = { moment: 'badge-moment', album: 'badge-album', vlog: 'badge-vlog' }[post.type] || 'badge-moment';
  const media = post.media || [];

  let mediaHtml = '';
  if (post.type === 'vlog' && media.length > 0) {
    mediaHtml = `
      <div class="post-video-container">
        <video src="${media[0].url}" controls poster="" style="width:100%; border-radius:8px;"></video>
      </div>`;
  } else if (media.length > 0) {
    mediaHtml = `<div class="post-images-grid">
      ${media.map(m => `<img src="${m.url}" loading="lazy">`).join('')}
    </div>`;
  }

  return `
    <div class="post-card" style="animation-delay:${index * 0.05}s">
      <div class="post-header">
        <div class="post-meta">
          <div class="post-date">${date}</div>
          <span class="post-type-badge ${badgeClass}">${post.type}</span>
        </div>
        ${isAuthor ? `
          <div class="post-controls">
            <button onclick="handleUpdate('${post.id}', '${escapeHtml(post.content)}')">✏️</button>
            <button onclick="handleDelete('${post.id}')">🗑️</button>
          </div>
        ` : ''}
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      ${mediaHtml}
    </div>
  `;
}

// --- HELPER FUNCTIONS ---
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadPosts();
    };
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

document.addEventListener('DOMContentLoaded', init);
