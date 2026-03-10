const game = document.getElementById("game");

const gnome = document.createElement("img");
gnome.src = "gnome-main.png";
gnome.style.position = "absolute";
gnome.style.width = "120px";
gnome.style.left = "430px";
gnome.style.top = "220px";

gnome.onerror = () => {
  console.log("Gnome image failed to load");
};

game.appendChild(gnome);

const title = document.createElement("div");
title.innerText = "The Lost Realm";
title.style.position = "absolute";
title.style.top = "20px";
title.style.left = "50%";
title.style.transform = "translateX(-50%)";
title.style.fontSize = "40px";
title.style.fontWeight = "bold";
title.style.color = "white";
game.appendChild(title);

function spawnRooster() {
  const r = document.createElement("img");
  r.src = "rooster.png";
  r.style.position = "absolute";
  r.style.width = "70px";
  r.style.left = Math.random() * 880 + "px";
  r.style.top = Math.random() * 520 + "px";

  r.onerror = () => {
    console.log("Rooster image failed to load");
  };

  game.appendChild(r);
}

setInterval(spawnRooster, 2000);
spawnRooster();