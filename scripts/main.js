// Load Particles.js
particlesJS.load("particles-js", "config/particles.json", function () {
    console.log("[Loaded] Config for Particles.js");
});

function connectForm() {
    document.getElementById("blurBox").style.visibility = "visible";
    document.getElementById("contactForm").style.visibility = "visible";
}

function closePopup() {
    document.getElementById("blurBox").style.visibility = "hidden";
    if (document.getElementById("contactForm").style.visibility == "visible") {
        document.getElementById("contactForm").style.visibility = "hidden";
    }
    else {
        console.log("No popup to close");
    }
}
