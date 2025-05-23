// Load Particles.js
particlesJS.load("particles-js", "config/particles.json", function () {
    console.log("[Loaded] Config for Particles.js");
});

function connectForm() {
    document.getElementById("blurBox").style.visibility = "visible";
    document.getElementById("contactForm").style.visibility = "visible";
}

function emailForm() {
    document.getElementById("blurBox").style.visibility = "visible";
    document.getElementById("mailForm").style.visibility = "visible";
}

function copyEmail() {
    var copyText = document.getElementById("emailBox");
    navigator.clipboard.writeText(copyText.value);
}

function closePopup() {
    document.getElementById("blurBox").style.visibility = "hidden";
    if (document.getElementById("contactForm").style.visibility == "visible") {
        document.getElementById("contactForm").style.visibility = "hidden";
    }
    else if (document.getElementById("mailForm").style.visibility == "visible") {
        document.getElementById("mailForm").style.visibility = "hidden";
    }
    else {
        console.log("No popup to close");
    }
}

const form = document.getElementById('contactForm');
const submitButton = document.getElementById('formSubmit');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.innerText = "Submitting...";

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: json
    })
    .then(async (response) => {
        if (response.status == 200) {
            submitButton.innerText = "Success!";
            submitButton.style.backgroundColor = "#28a745";
        } else {
            const error = await response.text();
            console.log("Error: ", error);
            submitButton.innerText = "Error!";
            submitButton.style.backgroundColor = "#dc3545";
        }
    })
    .catch(error => {
        console.log(error?.message || String(error));
        submitButton.innerText = "Failed!";
        submitButton.style.backgroundColor = "#dc3545";
    })
    .finally(() => {
        setTimeout(() => {
            submitButton.innerText = "Submit";
            submitButton.style.backgroundColor = "";
            submitButton.disabled = false;
            form.reset();
            closePopup();
        }, 2500);
    });
});
