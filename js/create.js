let currentUser = null;
let selectedType = 'moment';
let selectedFiles = [];
let selectedVideoFile = null;

async function init() {
  try {
    currentUser = await requireAuth();
    if (!currentUser) return;

    setupTypeSelector();
    setupPhotoUpload();
    setupVideoUpload();

    document.getElementById('save-post-btn').addEventListener('click', savePost);
  } catch (err) {
    console.error(err);
  }
}

function setupTypeSelector() {
  document.querySelectorAll('.type-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.type-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedType = opt.dataset.type;

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
    selectedFiles = [...selectedFiles, ...newFiles].slice(0, 9);
    renderPhotoPreview();
    input.value = '';
  });
}

function setupVideoUpload() {
  const area = document.getElementById('video-upload-area');
  const input = document.getElementById('video-input');

  if (!area || !input) return;

  area.addEventListener('click', () => input.click());

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedVideoFile = file;

    document.getElementById('video-preview').innerHTML = `
      <video controls width="100%" style="border-radius:12px;">
        <source src="${URL.createObjectURL(file)}" type="${file.type}">
      </video>
    `;
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

  if (!title && !content && selectedFiles.length === 0 && !selectedVideoFile) {
    showToast('Please add content ✏️');
    return;
  }

  showLoading('Saving your memory...');

  try {
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

    const mediaInserts = [];

    // upload images
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = file.name.split('.').pop();
      const path = `${currentUser.id}/${post.id}/img_${Date.now()}_${i}.${ext}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      mediaInserts.push({
        post_id: post.id,
        url: publicUrl,
        type: 'image',
        order_index: i
      });
    }

    // upload video
    if (selectedType === 'vlog' && selectedVideoFile) {
      const ext = selectedVideoFile.name.split('.').pop();
      const path = `${currentUser.id}/${post.id}/video_${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(path, selectedVideoFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      mediaInserts.push({
        post_id: post.id,
        url: publicUrl,
        type: 'video',
        order_index: 0
      });
    }

    if (mediaInserts.length > 0) {
      const { error } = await supabase
        .from('media')
        .insert(mediaInserts);

      if (error) throw error;
    }

    hideLoading();
    showToast('Memory saved! 🌟');

    setTimeout(() => {
      window.location.href = 'feed.html';
    }, 1000);

  } catch (err) {
    hideLoading();
    console.error(err);
    showToast(err.message);
  }
}

window.removePhoto = removePhoto;
document.addEventListener('DOMContentLoaded', init);