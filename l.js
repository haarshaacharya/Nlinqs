const STORAGE_KEY = "netlinks";
const THEME_KEY = "netlinks_theme";

let links = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let draggedElementIndex = null; // Track karne ke liye ki kaunsa card uthaya hai

// -------------------- THEME & LOGO LOGIC --------------------

function updateLogo() {
    const logoImg = document.getElementById("mainLogo");
    if (!logoImg) return;

    const isDark = document.body.classList.contains("dark");
    
    if (isDark) {
        logoImg.src = "rdark.png";  // Dark mode logo (White text)
    } else {
        logoImg.src = "nlinqs.png"; // Light mode logo (Black text)
    }
}

function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === "dark") {
        document.body.classList.add("dark");
    }
    updateLogo();
}

function toggleMode() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
    );

    updateLogo();
}

// -------------------- HELPERS --------------------

function saveLinks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function getDomainName(url) {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url;
    }
}

function getFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
        return "";
    }
}

function openLink(url) {
    window.open(url, "_blank");
}

// -------------------- DRAG AND DROP EVENTS --------------------

function handleDragStart(e) {
    draggedElementIndex = parseInt(this.getAttribute("data-index"));
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
    // default mechanism ko block karna zaroori hai taaki drop detect ho sake
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.getAttribute("data-index"));
    
    if (draggedElementIndex !== null && draggedElementIndex !== targetIndex) {
        // Splice implementation se elements ki current positions matrix array me safe-swap ho jati hai
        const movedItem = links.splice(draggedElementIndex, 1)[0];
        links.splice(targetIndex, 0, movedItem);
        
        // Dynamic reordering sequence ko local payload matrix pe stream karein
        saveLinks();
        
        // Synchronized system pipeline update
        renderLinks();
    }
}

function handleDragEnd() {
    this.classList.remove("dragging");
    draggedElementIndex = null;
}

// -------------------- ACTIONS --------------------

function deleteLink(index) {
    if (confirm("Delete this link?")) {
        links.splice(index, 1);
        saveLinks();
        renderLinks();
    }
}

function addLink() {
    let url = document.getElementById("siteUrl").value.trim();

    if (!url) {
        alert("Please enter URL");
        return;
    }

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        url = "https://" + url;
    }

    const domainName = getDomainName(url);
    const alreadyExists = links.some(link => link.url === url);

    if (alreadyExists) {
        alert("Link already exists");
        return;
    }

    links.push({
        name: domainName,
        url: url
    });

    saveLinks();
    renderLinks();

    document.getElementById("siteUrl").value = "";
}

// -------------------- RENDER --------------------

function renderLinks() {
    const container = document.getElementById("linksContainer");
    if (!container) return;

    if (links.length === 0) {
        container.innerHTML = `
            <div class="empty" style="grid-column: 1/-1;">
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    links.forEach((link, index) => {
        const card = document.createElement("div");
        card.className = "card";
        
        // --- DRAG AND DROP RUNTIME ATTRIBUTES ---
        card.setAttribute("draggable", "true");
        card.setAttribute("data-index", index);

        card.innerHTML = `
            <div class="logo-box" onclick="openLink('${link.url}')">
                <img src="${getFavicon(link.url)}" onerror="this.src='🔗'" alt="icon" />
            </div>

            <div class="site-name">
                ${link.name}
            </div>

            <div class="actions">
                <button class="open-btn" onclick="openLink('${link.url}')">
                    Open
                </button>
                <button class="delete-btn" onclick="deleteLink(${index})">
                    Delete
                </button>
            </div>
        `;

        // --- BINDING EVENT LISTENERS ---
        card.addEventListener("dragstart", handleDragStart);
        card.addEventListener("dragover", handleDragOver);
        card.addEventListener("drop", handleDrop);
        card.addEventListener("dragend", handleDragEnd);

        container.appendChild(card);
    });
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    renderLinks();
    
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.checked = document.body.classList.contains("dark");
    }
});