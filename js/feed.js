// ===== FEED PAGE LOGIC =====
import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore";

const db = getFirestore();

// --- DELETE FUNCTION ---
async function handleDelete(postId) {
  if (confirm("Are you sure you want to delete this memory? 🌸")) {
    try {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);
      alert("Deleted successfully!");
      location.reload(); // Refresh the feed
    } catch (error) {
      console.error("Delete failed:", error);
      alert("You don't have permission to delete this.");
    }
  }
}

// --- UPDATE FUNCTION (Simple Text Edit) ---
async function handleUpdate(postId, currentCaption) {
  const newCaption = prompt("Edit your caption:", currentCaption);
  
  if (newCaption !== null && newCaption !== currentCaption) {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        caption: newCaption,
        updatedAt: new Date()
      });
      alert("Updated!");
      location.reload();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed. You can only edit your own posts.");
    }
  }
}

let currentUser = null;
let currentProfile = null;
let currentFilter = 'all';

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;

  currentProfile = await getProfile(currentUser.id);
  renderProfilePanel();
  await loadPosts();
  setupTabs();
}

function renderProfilePanel() {
  const panel = document.getElementById('profile-panel');
  if (!panel || !currentProfile) return;
  const initials = getInitials(currentProfile.username);
  panel.innerHTML = `
    <div class="profile-avatar-lg">
      ${currentProfile.avatar_url
        ? `<img src="${currentProfile.avatar_url}" alt="avatar">`
        : initials}
    </div>
    <div class="profile-info">
      <div class="profile-name">${currentProfile.username}</div>
      <div class="profile-email">${currentUser.email}</div>
    </div>
    <button class="logout-btn" onclick="logout()">Logout</button>
  `;
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      await loadPosts();
    });
  });
}

async function loadPosts() {
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = '<div class="spinner"></div>';

  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles(username, avatar_url),
      media(url, type, order_index, caption)
    `)
    .order('created_at', { ascending: false });

  if (currentFilter !== 'all') {
    query = query.eq('type', currentFilter);
  }

  const { data: posts, error } = await query;

  if (error) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-emoji">⚠️</div><h3>Oops!</h3><p>Could not load memories. Please check your connection.</p></div>';
    return;
  }

  if (!posts || posts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">📸</div>
        <h3>No memories yet</h3>
        <p>Tap the <strong>+</strong> button to add<br>your first moment!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = posts.map((post, i) => renderPostCard(post, i)).join('');
}

function renderPostCard(post, index) {
  const profile = post.profiles;
  const initials = getInitials(profile ? profile.username : '?');
  const avatarHtml = profile && profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="avatar">`
    : initials;

  const badgeClass = { moment: 'badge-moment', album: 'badge-album', vlog: 'badge-vlog' }[post.type] || 'badge-moment';
  const badgeLabel = { moment: '📝 Moment', album: '📷 Album', vlog: '🎬 Vlog' }[post.type] || '📝 Moment';

  const images = (post.media || [])
    .filter(m => m.type === 'image')
    .sort((a, b) => a.order_index - b.order_index);
  const video = (post.media || []).find(m => m.type === 'video');

  let mediaHtml = '';
  if (post.type === 'vlog' && video) {
    // Extract YouTube thumbnail if YouTube URL
    const ytMatch = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const thumb = ytMatch
      ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
      : '';
    mediaHtml = `
      <div class="post-video-thumb" onclick="openVideo('${escapeHtml(video.url)}')">
        ${thumb ? `<img src="${thumb}" alt="video thumbnail">` : '<div style="height:180px;background:var(--sand);display:flex;align-items:center;justify-content:center;font-size:48px;">🎬</div>'}
        <div class="play-btn">▶</div>
      </div>
    `;
  } else if (images.length === 1) {
    mediaHtml = `<div class="post-images-single"><img src="${images[0].url}" alt="post image" loading="lazy"></div>`;
  } else if (images.length >= 2) {
    const shown = images.slice(0, 4);
    const extra = images.length > 4 ? images.length - 4 : 0;
    const gridItems = shown.map((img, i) => {
      const isLast = i === 3 && extra > 0;
      return `<div class="${isLast ? 'img-more' : ''}" ${isLast ? `data-more="+${extra}"` : ''}>
        <img src="${img.url}" alt="photo" loading="lazy">
      </div>`;
    }).join('');
    mediaHtml = `<div class="post-images-grid">${gridItems}</div>`;
  }

  return `
    <div class="post-card" style="animation-delay:${index * 0.07}s">
      <div class="post-header">
        <div class="post-avatar">${avatarHtml}</div>
        <div class="post-meta">
          <div class="post-author">${escapeHtml(profile ? profile.username : 'Unknown')}</div>
          <div class="post-date">${formatDate(post.created_at)}</div>
        </div>
        <span class="post-type-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      ${post.title ? `<div class="post-title">${escapeHtml(post.title)}</div>` : ''}
      ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
      ${mediaHtml}
    </div>
  `;
}

function openVideo(url) {
  window.open(url, '_blank');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', init);
