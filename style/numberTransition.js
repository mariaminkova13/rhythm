export function animateNumber(start, end, duration, element) {
     const startTime = Date.now();

     function update(currentTime) {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);
          const value = start + t * (end - start);

          element.textContent = Math.round(value);
          if (t < 1) requestAnimationFrame(update);
     }

     requestAnimationFrame(update);
}