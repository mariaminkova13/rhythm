// triple press space in quick succession to pause song

const note = document.createElement("note");
const lane1 = document.getElementById("lane1")
lane1.appendChild(note);

// Move the note down the track
let position = -50;
const speed = 5; // pixels per frame
const fallInterval = setInterval(() => {
    position += speed;
    note.style.top = position + "px";

    // Delete the note when it goes offscreen
    if (position > window.innerHeight) {
        note.remove();
        clearInterval(fallInterval);
    }
}, 1000 / 60); // 60 FPS


// Event listener for lane1
document.addEventListener("keydown", (event) => {
    if (event.key === "1" || event.key === "s" || event.key === "S") {
        lane1.parentElement.setAttribute("aria-pressed", "true");

        // Set back to false after 500ms
        setTimeout(() => {
            lane1.parentElement.setAttribute("aria-pressed", "false");
        }, 100);
    }
});