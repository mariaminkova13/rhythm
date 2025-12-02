//https://codepen.io/ccrch/pen/yyaraz

const scaleMultiplier = '1.1';

// Get all tile elements
const tiles = document.querySelectorAll('tile');

tiles.forEach(function(tile) {
  // Add a photo container
  const photoDiv = document.createElement('div');
  photoDiv.className = 'photo';
  tile.appendChild(photoDiv);

  // Set up background image based on data-image attribute
  const dataImage = tile.getAttribute('data-image');
  if (dataImage) {
    photoDiv.style.backgroundImage = 'src(' + dataImage + ')';
  }

  // Tile mouse actions
  tile.addEventListener('mouseover', function() {
    const photo = this.querySelector('.photo');
    if (photo) {
      photo.style.transform = 'scale(' + scaleMultiplier + ')';
    }
  });

  tile.addEventListener('mouseout', function() {
    const photo = this.querySelector('.photo');
    if (photo) {
      photo.style.transform = 'scale(1)';
    }
  });

  tile.addEventListener('mousemove', function(e) {
    const photo = this.querySelector('.photo');
    if (photo) {
      const rect = this.getBoundingClientRect();
      const x = ((e.pageX - rect.left - window.scrollX) / this.offsetWidth) * 100;
      const y = ((e.pageY - rect.top - window.scrollY) / this.offsetHeight) * 100;
      photo.style.transformOrigin = x + '% ' + y + '%';
    }
  });
});