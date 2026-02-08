/* global L, html2canvas */

let map;
let marker;

const state = {
	notificationGranted: false,
	puzzleSolved: false,
	currentCanvas: null,
	dragTileId: null,
};

function $(id) {
	return document.getElementById(id);
}

function setStatus(message, tone = "") {
	const el = $("status");
	if (!el) return;
	el.textContent = message;
	el.style.color = tone === "good" ? "#3ddc97" : tone === "bad" ? "#ff6b6b" : "";
}

function initMap() {
	map = L.map("map", { zoomControl: true }).setView([52.2297, 21.0122], 12);

	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: "© OpenStreetMap",
		crossOrigin: true,
	}).addTo(map);
}

function setLatLon(lat, lon) {
	$("latitude").textContent = lat.toFixed(6);
	$("longitude").textContent = lon.toFixed(6);
}

async function requestNotificationsPermission() {
	if (!("Notification" in window)) {
		setStatus("Twoja przeglądarka nie obsługuje powiadomień.", "bad");
		return false;
	}

	const permission = await Notification.requestPermission();
	state.notificationGranted = permission === "granted";

	if (permission === "granted") {
		setStatus("Powiadomienia włączone.", "good");
		return true;
	}

	if (permission === "denied") {
		setStatus("Powiadomienia zablokowane w przeglądarce.", "bad");
		return false;
	}

	setStatus("Powiadomienia nie zostały włączone.");
	return false;
}

function notifySolved() {
	setStatus("Ułożone! Wszystkie elementy są na miejscu.", "good");

	if (!("Notification" in window)) return;
	if (Notification.permission !== "granted") return;

	// Notyfikacja systemowa po ułożeniu
	new Notification("Puzzle ułożone!", {
		body: "Gratulacje — mapa została poprawnie ułożona.",
	});
}

function getLocation() {
	if (!navigator.geolocation) {
		setStatus("Geolokalizacja nie jest dostępna.", "bad");
		return;
	}

	setStatus("Pobieram lokalizację…");
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			const { latitude, longitude } = pos.coords;
			setLatLon(latitude, longitude);

			const latLng = [latitude, longitude];
			map.setView(latLng, 15);

			if (!marker) {
				marker = L.marker(latLng).addTo(map);
			} else {
				marker.setLatLng(latLng);
			}

			setStatus("Lokalizacja ustawiona.", "good");
		},
		(err) => {
			setStatus(`Błąd geolokalizacji: ${err.message}`, "bad");
		},
		{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
	);
}

function clearPuzzle() {
	state.puzzleSolved = false;
	$("tray").replaceChildren();
	$("board").replaceChildren();
}

function buildBoard() {
	const board = $("board");
	board.replaceChildren();

	for (let i = 0; i < 16; i += 1) {
		const slot = document.createElement("div");
		slot.className = "slot";
		slot.dataset.index = String(i);
		slot.addEventListener("dragover", (e) => {
			e.preventDefault();
			slot.dataset.highlight = "1";
		});
		slot.addEventListener("dragleave", () => {
			delete slot.dataset.highlight;
		});
		slot.addEventListener("drop", (e) => {
			e.preventDefault();
			delete slot.dataset.highlight;
			handleDropOnSlot(slot);
		});
		board.appendChild(slot);
	}
}

function allowTrayDrop() {
	const tray = $("tray");
	tray.addEventListener("dragover", (e) => e.preventDefault());
	tray.addEventListener("drop", (e) => {
		e.preventDefault();
		handleDropOnTray();
	});
}

function createTile(id, dataUrl, correctIndex) {
	const tile = document.createElement("div");
	tile.className = "tile";
	tile.id = id;
	tile.draggable = true;
	tile.dataset.correctIndex = String(correctIndex);

	const img = document.createElement("img");
	img.alt = `Fragment mapy ${correctIndex + 1}`;
	img.src = dataUrl;
	tile.appendChild(img);

	tile.addEventListener("dragstart", () => {
		state.dragTileId = tile.id;
		setStatus("Przeciągnij element na planszę.");
	});

	tile.addEventListener("dragend", () => {
		state.dragTileId = null;
	});

	return tile;
}

function handleDropOnSlot(slot) {
	if (!state.dragTileId) return;

	const dragged = document.getElementById(state.dragTileId);
	if (!dragged) return;

	const fromParent = dragged.parentElement;
	if (!fromParent) return;

	// Jeżeli slot zajęty -> zamień elementy miejscami
	if (slot.firstElementChild) {
		const existing = slot.firstElementChild;
		fromParent.appendChild(existing);
	}

	slot.appendChild(dragged);
	verifyPuzzle();
}

function handleDropOnTray() {
	if (!state.dragTileId) return;

	const dragged = document.getElementById(state.dragTileId);
	if (!dragged) return;
	$("tray").appendChild(dragged);
	verifyPuzzle();
}

function verifyPuzzle() {
	const board = $("board");
	const slots = Array.from(board.querySelectorAll(".slot"));
	let allCorrect = true;

	for (const slot of slots) {
		const idx = Number(slot.dataset.index);
		const tile = slot.firstElementChild;
		if (!tile) {
			allCorrect = false;
			continue;
		}

		const correct = Number(tile.dataset.correctIndex) === idx;
		tile.classList.toggle("correct", correct);
		if (!correct) allCorrect = false;
	}

	if (allCorrect && !state.puzzleSolved) {
		state.puzzleSolved = true;
		notifySolved();
	}
}

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

async function exportMapAsPuzzle() {
	if (!map) return;

	setStatus("Eksport mapy… (to może potrwać 1–2 sekundy)");
	clearPuzzle();
	buildBoard();
	allowTrayDrop();

	// Leaflet potrzebuje chwili na dorysowanie
	map.invalidateSize();
	await new Promise((r) => setTimeout(r, 300));

	const mapEl = $("map");
	const canvas = await html2canvas(mapEl, {
		useCORS: true,
		backgroundColor: null,
		scale: 1,
	});

	state.currentCanvas = canvas;

	const cols = 4;
	const rows = 4;
	const pieceW = Math.floor(canvas.width / cols);
	const pieceH = Math.floor(canvas.height / rows);

	const pieces = [];
	let index = 0;

	for (let y = 0; y < rows; y += 1) {
		for (let x = 0; x < cols; x += 1) {
			const pieceCanvas = document.createElement("canvas");
			pieceCanvas.width = pieceW;
			pieceCanvas.height = pieceH;
			const ctx = pieceCanvas.getContext("2d");
			ctx.drawImage(
				canvas,
				x * pieceW,
				y * pieceH,
				pieceW,
				pieceH,
				0,
				0,
				pieceW,
				pieceH
			);

			const dataUrl = pieceCanvas.toDataURL("image/png");
			pieces.push({
				id: `tile-${index}`,
				correctIndex: index,
				dataUrl,
			});
			index += 1;
		}
	}

	shuffle(pieces);

	const tray = $("tray");
	for (const p of pieces) {
		tray.appendChild(createTile(p.id, p.dataUrl, p.correctIndex));
	}

	setStatus("Puzzle gotowe — ułóż elementy na planszy.");
}

function wireUI() {
	$("btnLocation").addEventListener("click", getLocation);
	$("btnNotifications").addEventListener("click", requestNotificationsPermission);
	$("btnExport").addEventListener("click", exportMapAsPuzzle);
}

document.addEventListener("DOMContentLoaded", () => {
	initMap();
	wireUI();
	setStatus("Gotowe. Ustaw lokalizację lub porusz mapą.");
});

// Zachowaj zgodność z atrybutem onclick, jeśli ktoś go zostawił w HTML
window.getLocation = getLocation;