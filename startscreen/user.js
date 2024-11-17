function toggleDropdown() {
  const dropdownMenu = document.getElementById('dropdownMenu');
  dropdownMenu.classList.toggle('show');
}

  window.addEventListener('click', function (e) {
    const userIcon = document.getElementById('userIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');
  
    if (!userIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
    }
  });

  function changeUserIcon() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const userIcon = document.getElementById('userIcon').querySelector('img');
                userIcon.src = reader.result;

                window.electronAPI.updateProfilePicture(file.path);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function lockScreen() {
    ipcRenderer.send('lock-screen');
}

function signOut() {
    ipcRenderer.send('sign-out');
}

const userIcon = document.getElementById('userIcon');

userIcon.addEventListener('mousedown', function () {
  userIcon.classList.add('tile-pressed');
});

userIcon.addEventListener('mouseup', function () {
  userIcon.classList.remove('tile-pressed');
});

userIcon.addEventListener('mouseleave', function () {
  userIcon.classList.remove('tile-pressed');
});
