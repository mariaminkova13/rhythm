export function countdown(){
    let numbers = ['3', '2', '1', 'GO!']
}

export var paused = false
const blurring = document.createElement("blurring");

export function pause() {
  paused = true;
  document.body.appendChild(blurring);
  document.documentElement.style.setProperty(
    "--pausemodalvisibility",
    "visible"
  );
  document.documentElement.style.setProperty("--cursor", "default");
}

export function unpause() {
  paused = false;
  document.body.removeChild(blurring);
  document.documentElement.style.setProperty(
    "--pausemodalvisibility",
    "hidden"
  );
  document.documentElement.style.setProperty("--cursor", "none");
  countdown();
}

export function showDeathMsg() {
    document.body.appendChild(blurring);
    document.documentElement.style.setProperty("--cursor", "default");
    document.documentElement.style.setProperty(
      "--deathmsgvisibility",
      "visible"
    );
}