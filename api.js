// ==================== HELPER FUNCTIONS ====================
let currentAudio = null;
let currentPlayingId = null;

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function showNotification(message, type = "info") {
  const existingNotif = document.querySelector(".notification");
  if (existingNotif) {
    existingNotif.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  let icon = "fa-info-circle";
  if (type === "success") icon = "fa-check-circle";
  if (type === "error") icon = "fa-exclamation-circle";

  notification.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function updateSavedCount() {
  const savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];
  const badge = document.getElementById("saved-count-badge");
  if (badge) {
    badge.textContent = savedMusic.length;
  }
}

// ==================== AUDIO PREVIEW FUNCTION ====================
function playPreview(trackId, previewUrl, buttonElement) {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;

    // Reset the previous button
    if (
      currentPlayingId &&
      document.getElementById(`preview-btn-${currentPlayingId}`)
    ) {
      const prevBtn = document.getElementById(
        `preview-btn-${currentPlayingId}`,
      );
      prevBtn.innerHTML = '<i class="fas fa-play"></i> Preview 30s';
      prevBtn.style.background = "transparent";
    }
  }

  // If clicking the same track that was playing, just stop
  if (currentPlayingId === trackId) {
    currentPlayingId = null;
    return;
  }

  // Play new track
  if (previewUrl) {
    currentAudio = new Audio(previewUrl);
    currentAudio.play().catch((e) => {
      showNotification("Click anywhere to enable audio", "info");
    });

    currentPlayingId = trackId;

    // Update button to show playing state
    if (buttonElement) {
      buttonElement.innerHTML = '<i class="fas fa-stop"></i> Stop';
      buttonElement.style.background = "#ffd369";
      buttonElement.style.color = "#1f1c2c";
    }

    // When audio ends, reset button
    currentAudio.onended = function () {
      if (document.getElementById(`preview-btn-${trackId}`)) {
        const btn = document.getElementById(`preview-btn-${trackId}`);
        btn.innerHTML = '<i class="fas fa-play"></i> Preview 30s';
        btn.style.background = "transparent";
      }
      currentPlayingId = null;
      currentAudio = null;
    };
  } else {
    showNotification("No preview available for this track", "error");
  }
}

// ==================== SAVE FEATURE ====================
function saveMusic(musicData) {
  let savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  const exists = savedMusic.some(
    (item) =>
      item.trackId === musicData.trackId ||
      (item.track === musicData.track && item.artist === musicData.artist),
  );

  if (exists) {
    showNotification(
      `${musicData.track} is already in your collection!`,
      "error",
    );
    return;
  }

  musicData.savedAt = new Date().toISOString();
  savedMusic.push(musicData);
  localStorage.setItem("savedMusic", JSON.stringify(savedMusic));

  showNotification(
    `${musicData.track} added to your collection! 🎵`,
    "success",
  );
  updateSavedCount();

  const saveBtn = document.querySelector(
    `button[onclick*="'${musicData.trackId}'"]`,
  );
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
    saveBtn.disabled = true;
  }

  return musicData;
}

function loadSavedItems() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const container = document.getElementById("saved-items-container");
  if (!container) return;

  const savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  if (savedMusic.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-headphones"></i>
        <h3>Your music collection is empty</h3>
        <p>Go to Music Explorer and save your favorite tracks!</p>
        <a href="api.html" class="btn">Discover Music</a>
      </div>
    `;
    return;
  }

  container.innerHTML = savedMusic
    .map(
      (item, index) => `
    <div class="saved-item-card">
      <img src="${item.artworkUrl || "https://via.placeholder.com/300x300?text=No+Image"}" 
           alt="${item.track}" 
           class="saved-flag"
           onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
      <div class="saved-item-details">
        <h3>${item.track}</h3>
        <p class="artist-name">${item.artist}</p>
        <div class="saved-info">
          <p><i class="fas fa-compact-disc"></i> ${item.album || "Single"}</p>
          <p><i class="fas fa-calendar"></i> ${item.year || "N/A"}</p>
          ${item.genre ? `<p><i class="fas fa-tag"></i> ${item.genre}</p>` : ""}
        </div>
        ${
          item.previewUrl
            ? `
          <button id="preview-btn-${item.trackId}" class="preview-btn" onclick="playPreview('${item.trackId}', '${item.previewUrl}', this)">
            <i class="fas fa-play"></i> Preview 30s
          </button>
        `
            : '<p class="no-preview">No preview available</p>'
        }
        <p class="saved-date">
          <i class="fas fa-clock"></i> 
          Added: ${new Date(item.savedAt).toLocaleDateString()}
        </p>
        <button onclick="removeSavedItem(${index})" class="delete-btn">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

function removeSavedItem(index) {
  let savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  if (confirm(`Remove "${savedMusic[index].track}" from your collection?`)) {
    // Stop audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      currentPlayingId = null;
    }
    savedMusic.splice(index, 1);
    localStorage.setItem("savedMusic", JSON.stringify(savedMusic));
    showNotification("Track removed from collection", "info");
    loadSavedItems();
    updateSavedCount();
  }
}

// ==================== MUSIC SEARCH (iTunes API) ====================
function searchMusic() {
  const searchTerm = document.getElementById("musicInput").value.trim();
  const result = document.getElementById("result");

  if (searchTerm === "") {
    result.innerHTML = `
      <div class="api-error">
        <i class="fas fa-exclamation-circle"></i>
        <p>Please enter an artist or song name.</p>
      </div>`;
    return;
  }

  result.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      Searching for "${searchTerm}"...
    </div>`;

  fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&limit=25&media=music`,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Search failed");
      }
      return response.json();
    })
    .then((data) => {
      if (!data.results || data.results.length === 0) {
        result.innerHTML = `
          <div class="api-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>No results found for "${searchTerm}".</p>
            <small>Try different keywords or check spelling.</small>
          </div>
        `;
        return;
      }
      displayMusicResults(data.results, searchTerm);
    })
    .catch((error) => {
      result.innerHTML = `
        <div class="api-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error searching for music.</p>
          <small>Please try again later.</small>
        </div>
      `;
    });
}

function displayMusicResults(results, searchTerm) {
  const result = document.getElementById("result");
  const savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  let html = `
    <div class="music-results">
      <div class="results-header">
        <h2><i class="fas fa-search"></i> Results for "${searchTerm}"</h2>
        <p>Found ${results.length} songs • Click the preview button to listen to 30-second samples!</p>
      </div>
      
      <div class="tracks-grid">
  `;

  results.forEach((track) => {
    const isSaved = savedMusic.some((item) => item.trackId === track.trackId);
    const year = track.releaseDate
      ? new Date(track.releaseDate).getFullYear()
      : "N/A";
    const trackId = track.trackId;
    const previewUrl = track.previewUrl || "";

    html += `
      <div class="track-card">
        <img src="${track.artworkUrl100 || "https://via.placeholder.com/100x100?text=No+Image"}" 
             alt="${track.trackName}" 
             class="track-image"
             onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
        <div class="track-details">
          <h4>${track.trackName}</h4>
          <p class="track-artist">${track.artistName}</p>
          <p class="track-album">
            <i class="fas fa-compact-disc"></i> ${track.collectionName || "Single"}
          </p>
          <p class="track-year">
            <i class="fas fa-calendar"></i> ${year}
          </p>
          <div class="track-actions">
            <button onclick='saveMusic(${JSON.stringify({
              trackId: track.trackId,
              track: track.trackName,
              artist: track.artistName,
              album: track.collectionName || "Single",
              year: year,
              genre: track.primaryGenreName || "Unknown",
              artworkUrl: track.artworkUrl100
                ? track.artworkUrl100.replace("100x100", "300x300")
                : "",
              previewUrl: track.previewUrl || "",
            })})' class="save-btn-small" ${isSaved ? "disabled" : ""}>
              <i class="fas ${isSaved ? "fa-check" : "fa-bookmark"}"></i>
              ${isSaved ? "In Collection" : "Save"}
            </button>
            ${
              previewUrl
                ? `
              <button id="preview-btn-${trackId}" class="preview-btn" onclick="playPreview('${trackId}', '${previewUrl}', this)">
                <i class="fas fa-play"></i> Preview 30s
              </button>
            `
                : '<button class="preview-btn disabled" disabled><i class="fas fa-music"></i> No Preview</button>'
            }
          </div>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
  result.innerHTML = html;
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  if (
    window.location.pathname.includes("api.html") ||
    window.location.pathname.includes("saved-items.html")
  ) {
    if (!isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }
  }

  const input = document.getElementById("musicInput");
  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchMusic();
      }
    });
  }

  updateSavedCount();

  if (window.location.pathname.includes("saved-items.html")) {
    loadSavedItems();
  }
});
