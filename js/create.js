// ===== CREATE POST LOGIC =====

let currentUser = null;
let selectedType = 'moment';
let selectedFiles = [];

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  setupTypeSelector();
  setupPhotoUpload();
}

function setupTypeSelector() {
  document.querySelectorAll('.type-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedType = opt.dataset.type;

      // Show/hide relevant sections
      document.getElementById('photo-section').style.display =
        (selectedType === 'moment' || selectedType === 'album') ? 'block' : 'none';
      document.getElementById('video-section').style.display =
        selectedType === 'vlog' ? 'block' : 'none';
    });
  });
}

function setupPhotoUpload() {
  const area = document.getElementById('photo-upload-area');
  const input = document.getElementById('photo-input');

  area.addEventListener('click', () => input.click());

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.filter(f => f.type.startsWith('image/'));
    selectedFiles = [...selectedFiles, ...newFiles].slice(0, 9); // max 9 photos
    renderPhotoPreview();
    input.value = ''; // reset so same file can be re-added
  });
}

function renderPhotoPreview() {
  const grid = document.getElementById('photo-preview-grid');
  if (selectedFiles.length === 0) {
    grid.innerHTML = '';
    return;
  }
  grid.innerHTML = selectedFiles.map((file, i) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="photo-preview-item">
        <img src="${url}" alt="preview">
        <button class="photo-remove" onclick="removePhoto(${i})">✕</button>
      </div>
    `;
  }).join('');
}

function removePhoto(index) {
  selectedFiles.splice(index, 1);
  renderPhotoPreview();
}

async function savePost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const videoUrl = document.getElementById('video-url') ? document.getElementById('video-url').value.trim() : '';

  if (!title && !content && selectedFiles.length === 0 && !videoUrl) {
    showToast('Please add a title, text, or media ✏️');
    return;
  }

  showLoading('Saving your memory...');

  try {
    // 1. Create the post record
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        title: title || null,
        content: content || null,
        type: selectedType,
      })
      .select()
      .single();

    if (postError) throw postError;

    // 2. Upload images (if any)
    const mediaInserts = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = file.name.split('.').pop();
      const path = `${currentUser.id}/${post.id}/${Date.now()}_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      mediaInserts.push({
        post_id: post.id,
        url: publicUrl,
        type: 'image',
        order_index: i,
      });
    }

    // 3. Add video URL (if vlog)
    if (selectedType === 'vlog' && videoUrl) {
      mediaInserts.push({
        post_id: post.id,
        url: videoUrl,
        type: 'video',
        order_index: 0,
      });
    }

    // 4. Insert media records
    if (mediaInserts.length > 0) {
      const { error: mediaError } = await supabase
        .from('media')
        .insert(mediaInserts);
      if (mediaError) throw mediaError;
    }

    hideLoading();
    showToast('Memory saved! 🌟');
    setTimeout(() => { window.location.href = 'feed.html'; }, 1200);

  } catch (err) {
    hideLoading();
    console.error(err);
    showToast('Error saving: ' + (err.message || 'Please try again'));
  }
}

document.addEventListener('DOMContentLoaded', init);
