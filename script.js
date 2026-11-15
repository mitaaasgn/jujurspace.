const SUPABASE_URL = "https://nirbqcefmjyzklgcramp.supabase.co";
const SUPABASE_KEY = "sb_publishable_kohKTncsKjy9ziQQ5JgEsg_LgVi-BpP";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const messageForm = document.getElementById("messageForm");
const messageStatus = document.getElementById("messageStatus");

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.getElementById("message").value.trim();

  if (!message) return;

  messageStatus.textContent = "Mengirim pesan...";

  const { error } = await db
    .from("messages")
    .insert([{ message, status: "pending" }]);

  if (error) {
    messageStatus.textContent = "Pesan gagal dikirim. Coba lagi.";
    console.error(error);
    return;
  }

  messageForm.reset();
  messageStatus.textContent = "Pesan berhasil dikirim. Terima kasih!";
});

const loginButton = document.getElementById("loginButton");

loginButton.addEventListener("click", loginAdmin);

async function loginAdmin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const loginStatus = document.getElementById("loginStatus");
  loginStatus.textContent = "Memeriksa akun...";

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginStatus.textContent = "Login gagal. Periksa email dan password.";
    return;
  }

  const { data: admin, error: adminError } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError || !admin) {
    await db.auth.signOut();
    loginStatus.textContent = "Akun ini tidak terdaftar sebagai admin.";
    return;
  }

  document.getElementById("adminLogin").hidden = true;
  document.getElementById("dashboard").hidden = false;

  await loadMessages();
}

async function loadMessages() {
  const list = document.getElementById("messageList");
  list.textContent = "Memuat pesan...";

  const { data, error } = await db
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.textContent = "Gagal memuat pesan.";
    console.error(error);
    return;
  }

  list.replaceChildren();

  if (!data.length) {
    list.textContent = "Belum ada pesan masuk.";
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "message-item";

    // Format waktu untuk tampilan Dashboard Admin
    let waktuFormatted = "Waktu tidak tersedia";
    if (item.created_at) {
      const d = new Date(item.created_at);
      const tanggal = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const jam = String(d.getHours()).padStart(2, '0');
      const menit = String(d.getMinutes()).padStart(2, '0');
      waktuFormatted = `${tanggal}, ${jam}:${menit} WIB`;
    }

    const heading = document.createElement("h3");
    heading.textContent = `📅 ${waktuFormatted}`;
    heading.style.fontSize = "14px";
    heading.style.color = "#666";

    const status = document.createElement("p");
    status.textContent = "Status: " + item.status;

    const editor = document.createElement("textarea");
    editor.value = item.edited_message || item.message;

    const save = makeButton("Simpan Edit", async () => {
      await updateMessage(item.id, {
        edited_message: editor.value.trim()
      });
    });

    const select = makeButton("Pilih", async () => {
      await updateMessage(item.id, {
        edited_message: editor.value.trim(),
        status: "selected"
      });
    });

    const publish = makeButton("Terbitkan", async () => {
      await updateMessage(item.id, {
        edited_message: editor.value.trim(),
        status: "published"
      });
    });

    const reject = makeButton("Tolak", async () => {
      await updateMessage(item.id, {
        status: "rejected"
      });
    });

    // Mengirim pesan DAN item.created_at ke fungsi downloadStory
    const story = makeButton("Unduh Story", () => {
      downloadStory(editor.value.trim(), item.created_at);
    });

    card.append(heading, status, editor, save, select, publish, reject, story);
    list.appendChild(card);
  });
}

function makeButton(label, action) {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

async function updateMessage(id, changes) {
  const { error } = await db
    .from("messages")
    .update(changes)
    .eq("id", id);

  if (error) {
    alert("Gagal memperbarui pesan.");
    console.error(error);
    return;
  }

  alert("Pesan berhasil diperbarui.");
  await loadMessages();
}

async function downloadStory(message, createdAt) {
  if (!message || !message.trim()) {
    alert("Pesan masih kosong.");
    return;
  }

  // Format waktu untuk dicetak di dalam gambar Story
  let waktuStory = "";
  if (createdAt) {
    const d = new Date(createdAt);
    const tanggal = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jam = String(d.getHours()).padStart(2, '0');
    const menit = String(d.getMinutes()).padStart(2, '0');
    waktuStory = `${tanggal}, ${jam}:${menit} WIB`;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  const bg = "#F5F0E8";
  const ink = "#51465D";
  const muted = "#897C91";
  const lavender = "#E8DFEB";
  const pink = "#EAD7D9";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.arc(1010, 250, 170, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = lavender;
  ctx.beginPath();
  ctx.arc(70, 1660, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = muted;
  ctx.font = "bold 25px Arial";
  ctx.fillText("ADKESMA PRESENTS", 540, 210);

  ctx.fillStyle = ink;
  ctx.font = "bold 83px Georgia";
  ctx.fillText("jujur space.", 540, 330);

  ctx.fillStyle = muted;
  ctx.font = "italic 30px Georgia";
  ctx.fillText("your voice matters ♡", 540, 390);

  const x = 105;
  const y = 540;
  const w = 870;
  const h = 850;
  const r = 38;

  ctx.fillStyle = lavender;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = muted;
  ctx.font = "bold 24px Arial";
  ctx.fillText("SUARA MAHASISWA", 165, 635);

  const maxWidth = 750;
  const words = message.trim().split(/\s+/);
  let fontSize = 48;
  let lines = [];

  function makeLines(size) {
    ctx.font = size + "px Georgia";
    const result = [];
    let line = "";

    words.forEach((word) => {
      const test = line ? line + " " + word : word;

      if (ctx.measureText(test).width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = test;
      }
    });

    if (line) result.push(line);
    return result;
  }

  while (fontSize > 32) {
    lines = makeLines(fontSize);
    if (lines.length <= 12) break;
    fontSize -= 2;
  }

  if (lines.length > 12) {
    alert("Pesan terlalu panjang. Silakan ringkas melalui fitur edit sebelum mengunduh Story.");
    return;
  }

  ctx.fillStyle = ink;
  ctx.textAlign = "left";
  ctx.font = fontSize + "px Georgia";

  const lineHeight = fontSize * 1.5;
  const totalHeight = lines.length * lineHeight;
  let startY = y + (h - totalHeight) / 2 + 15;

  lines.forEach((line, index) => {
    ctx.fillText(line, 165, startY + index * lineHeight);
  });

  // Tanda Tangan Anonim di pojok kiri bawah kartu
  ctx.fillStyle = muted;
  ctx.font = "italic 25px Georgia";
  ctx.textAlign = "left";
  ctx.fillText("— anonymous ♡", 165, y + h - 65);

  // Tanggal & Jam Kirim di pojok kanan bawah kartu
  if (waktuStory) {
    ctx.fillStyle = muted;
    ctx.font = "20px Arial";
    ctx.textAlign = "right";
    ctx.fillText(waktuStory, x + w - 45, y + h - 65);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = "bold 27px Arial";
  ctx.fillText("ADKESMA BEM_KM UNIDHA", 540, 1660);

  ctx.fillStyle = muted;
  ctx.font = "italic 26px Georgia";
  ctx.fillText("Setiap suara punya ruang untuk didengar.", 540, 1710);

  canvas.toBlob(function(blob) {
    if (!blob) {
      alert("Gagal membuat gambar.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Jujur-Space-Story.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 10000);
  }, "image/png");
}

document.getElementById("logoutButton").addEventListener("click", async () => {
  await db.auth.signOut();

  document.getElementById("dashboard").hidden = true;
  document.getElementById("adminLogin").hidden = false;
  document.getElementById("loginStatus").textContent = "Kamu sudah logout.";
});

async function checkSession() {
  const { data } = await db.auth.getSession();

  if (!data.session) return;

  const { data: admin } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", data.session.user.id)
    .maybeSingle();

  if (admin) {
    document.getElementById("adminLogin").hidden = true;
    document.getElementById("dashboard").hidden = false;
    await loadMessages();
  } else {
    await db.auth.signOut();
  }
}

checkSession();
