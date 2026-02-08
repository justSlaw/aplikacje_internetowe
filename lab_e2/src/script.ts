const msg: string = "Hello!";
alert(msg);
type StyleName = "style-1" | "style-2";

const STYLES: Record<StyleName, string> = {
	"style-1": "/style-1.css",
	"style-2": "/style-2.css",
};

const STORAGE_KEY = "lab_e2_style";

function getSavedStyle(): StyleName {
	const saved = localStorage.getItem(STORAGE_KEY);
	return (saved === "style-2" ? "style-2" : "style-1");
}

function setSavedStyle(style: StyleName): void {
	localStorage.setItem(STORAGE_KEY, style);
}


function applyStyle(style: StyleName): void {
	const id = "lab-style";
	let link = document.getElementById(id) as HTMLLinkElement | null;
	if (!link) {
		link = document.createElement("link");
		link.id = id;
		link.rel = "stylesheet";
		document.head.appendChild(link);
	}
	link.href = STYLES[style];
}

function createStyleSwitcher(initial: StyleName): void {
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.right = "12px";
	container.style.bottom = "12px";
	container.style.display = "flex";
	container.style.gap = "8px";
	container.style.zIndex = "9999";

	const btn1 = document.createElement("button");
	btn1.textContent = "Styl 1";
	const btn2 = document.createElement("button");
	btn2.textContent = "Styl 2";

	const styleButton = (btn: HTMLButtonElement) => {
		btn.style.padding = "8px 12px";
		btn.style.borderRadius = "8px";
		btn.style.border = "1px solid #ccc";
		btn.style.background = "#fff";
		btn.style.cursor = "pointer";
		btn.style.boxShadow = "0 2px 8px rgba(0,0,0,.12)";
	};
	styleButton(btn1);
	styleButton(btn2);

	const setActive = (style: StyleName) => {
		applyStyle(style);
		setSavedStyle(style);
		btn1.disabled = style === "style-1";
		btn2.disabled = style === "style-2";
	};

	btn1.addEventListener("click", () => setActive("style-1"));
	btn2.addEventListener("click", () => setActive("style-2"));

	container.appendChild(btn1);
	container.appendChild(btn2);
	document.body.appendChild(container);

	setActive(initial);
}

window.addEventListener("DOMContentLoaded", () => {
	const initial = getSavedStyle();
	applyStyle(initial);
	createStyleSwitcher(initial);
});
