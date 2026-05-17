// ===== FEED PAGE LOGIC =====

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
  // --- 1. Identity & Metadata Setup ---
  const profile = post.profiles;
  const initials = getInitials(profile ? profile.username : '?');
  const avatarHtml = profile && profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="avatar">`
    : initials;

  const badgeClass = { moment: 'badge-moment', album: 'badge-album', vlog: 'badge-vlog' }[post.type] || 'badge-moment';
  const badgeLabel = { moment: '📝 Moment', album: '📷 Album', vlog: '🎬 Vlog' }[post.type] || '📝 Moment';

  // Permission check for Edit/Delete buttons [cite: 3, 6, 7]
  const isAuthor = currentUser && (post.authorId === currentUser.uid || post.user_id === currentUser.id);

  // --- 2. Media Rendering Logic ---
  const images = (post.media || [])
    .filter(m => m.type === 'image')
    .sort((a, b) => a.order_index - b.order_index);
  const video = (post.media || []).find(m => m.type === 'video');

  let mediaHtml = '';
  
  if (post.type === 'vlog' && video) {
    // UPDATED: Standard video player for your direct uploads
    mediaHtml = `
      <div class="post-video-container">
        <video src="${video.url}" controls style="width:100%; border-radius:8px;"></video>
      </div>`;
  } else if (images.length > 1) {
    // NEW: iPhone-style Swipe Gallery for multiple images
    mediaHtml = `
      <div class="post-images-gallery">
        ${images.map(img => `
          <div class="gallery-item">
            <img src="${img.url}" onclick="window.open('${img.url}', '_blank')" loading="lazy" alt="photo">
          </div>
        `).join('')}
      </div>
      <div class="gallery-indicator">滑动屏幕观看${images.length}张照片photos ↔️</div>
    `;
  } else if (images.length === 1) {
    // Single Image: Full width and reviewable
    mediaHtml = `
      <div class="post-images-single">
        <img src="${images[0].url}" onclick="window.open('${images[0].url}', '_blank')" loading="lazy" alt="photo">
      </div>`;
  }

  // --- 3. Final Template Construction ---
  return `
    <div class="post-card" style="animation-delay:${index * 0.07}s">
      <div class="post-header">
        <div class="post-avatar">${avatarHtml}</div>
        <div class="post-meta">
          <div class="post-author">${escapeHtml(profile ? profile.username : 'Unknown')}</div>
          <div class="post-date">${formatDate(post.created_at || post.createdAt)}</div>
        </div>
        <div class="post-header-right">
          <span class="post-type-badge ${badgeClass}">${badgeLabel}</span>
          ${isAuthor ? `
            <div class="post-controls">
              <button class="control-btn" onclick="handleUpdate('${post.id}', '${escapeHtml(post.content || '')}')" title="Edit">✏️</button>
              <button class="control-btn" onclick="handleDelete('${post.id}')" title="Delete">🗑️</button>
            </div>
          ` : ''}
        </div>
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


