// ==========================
// FRONTEND FILE UPLOAD
// ==========================

const fileInput = document.getElementById("fileInput");
const chat = document.getElementById("chat-container");

// helper to show message
function addFileMessage(text) {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.margin = "8px";
  div.style.textAlign = "right";
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ==========================
// FILE SELECT & UPLOAD
// ==========================
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  addFileMessage(`📎 Uploading: ${file.name}`);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      addFileMessage(`✅ Uploaded: ${data.originalName}`);
    } else {
      addFileMessage("❌ Upload failed");
    }

  } catch (err) {
    console.error(err);
    addFileMessage("⚠️ Server not reachable");
  }

  // reset input
  fileInput.value = "";
});
