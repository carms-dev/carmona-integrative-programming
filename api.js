// ==================== HELPER FUNCTIONS ====================
function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Show notification (reused from script.js)
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

// Update the saved count badge
function updateSavedCount() {
  const savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];
  const badge = document.getElementById("saved-count-badge");
  if (badge) {
    badge.textContent = savedMusic.length;
  }
}

// ==================== SAVE FEATURE FUNCTIONS ====================
function saveMusic(musicData) {
  // Get existing saved music from localStorage
  let savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  // Check for duplicates (by track ID or name+artist)
  const exists = savedMusic.some(
    (item) =>
      item.trackId === musicData.trackId ||
      (item.track === musicData.track && item.artist === musicData.artist),
  );

  if (exists) {
    showNotification(
      `${musicData.track} by ${musicData.artist} is already saved!`,
      "error",
    );
    return;
  }

  // Add timestamp when saved
  musicData.savedAt = new Date().toISOString();

  // Add to array
  savedMusic.push(musicData);

  // Save back to localStorage
  localStorage.setItem("savedMusic", JSON.stringify(savedMusic));

  // Show success message
  showNotification(`${musicData.track} saved successfully!`, "success");

  // Update saved count badge
  updateSavedCount();

  return musicData;
}

function loadSavedItems() {
  // Check if user is logged in
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const container = document.getElementById("saved-items-container");
  if (!container) return; // Exit if not on saved-items page

  const savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  if (savedMusic.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-music"></i>
        <h3>No saved music yet</h3>
        <p>Go to the Music Search page and save your favorite tracks!</p>
        <a href="api.html" class="btn">Search Music</a>
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
          <p><i class="fas fa-compact-disc"></i> Album: ${item.album || "N/A"}</p>
          <p><i class="fas fa-calendar"></i> Year: ${item.year || "N/A"}</p>
          ${item.genre ? `<p><i class="fas fa-tag"></i> ${item.genre}</p>` : ""}
        </div>
        <p class="saved-date">
          <i class="fas fa-clock"></i> 
          Saved: ${new Date(item.savedAt).toLocaleDateString()}
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

  if (confirm(`Remove "${savedMusic[index].track}" from saved?`)) {
    savedMusic.splice(index, 1);
    localStorage.setItem("savedMusic", JSON.stringify(savedMusic));

    showNotification("Track removed from saved", "info");
    loadSavedItems(); // Refresh the display
    updateSavedCount(); // Update badge
  }
}

// ==================== MUSIC SEARCH FUNCTION (iTunes API) ====================
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

  // Using iTunes API - no key needed, works perfectly!
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
      // Check if results were found
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

  // Get saved music to check if already saved
  const savedMusic = JSON.parse(localStorage.getItem("savedMusic")) || [];

  // Group by artist for better display
  const artistInfo = results[0].artistName;

  let html = `
    <div class="music-results">
      <div class="results-header">
        <h2><i class="fas fa-search"></i> Results for "${searchTerm}"</h2>
        <p>Found ${results.length} tracks</p>
      </div>
      
      <div class="tracks-grid">
  `;

  // Display each track
  results.forEach((track, index) => {
    const isSaved = savedMusic.some(
      (item) =>
        item.trackId === track.trackId ||
        (item.track === track.trackName && item.artist === track.artistName),
    );

    // Get year from release date
    const year = track.releaseDate
      ? new Date(track.releaseDate).getFullYear()
      : "N/A";

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
          <p class="track-genre">
            <i class="fas fa-tag"></i> ${track.primaryGenreName || "N/A"}
          </p>
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
          })})' class="btn save-btn-small" ${isSaved ? "disabled" : ""}>
            <i class="fas ${isSaved ? "fa-check" : "fa-bookmark"}"></i>
            ${isSaved ? "Saved" : "Save Track"}
          </button>
          ${
            track.previewUrl
              ? `
            <button onclick="playPreview('${track.previewUrl}')" class="preview-btn">
              <i class="fas fa-play"></i> Preview
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
  result.innerHTML = html;
}

// Optional: Add preview playback
function playPreview(url) {
  // Stop any currently playing audio
  if (window.audioPlayer) {
    window.audioPlayer.pause();
  }

  // Create and play new audio
  window.audioPlayer = new Audio(url);
  window.audioPlayer.play().catch((e) => {
    showNotification("Click to enable audio", "info");
  });
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in for protected pages
  if (
    window.location.pathname.includes("api.html") ||
    window.location.pathname.includes("saved-items.html")
  ) {
    if (!isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }
  }

  // Add enter key support for api.html
  const input = document.getElementById("musicInput");
  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchMusic();
      }
    });
  }

  // Update saved count badge if on api.html
  updateSavedCount();

  // Load saved items if on saved-items.html
  if (window.location.pathname.includes("saved-items.html")) {
    loadSavedItems();
  }
});
