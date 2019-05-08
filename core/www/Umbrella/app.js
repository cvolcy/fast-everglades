window.addEventListener('load', async e => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/Umbrella/sw.js', { scope: '/Umbrella/' }).then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    }

    if (window.outerWidth * window.outerHeight > 438000) {
        document.querySelector("#bring-umbrella").classList.add("w3-jumbo");
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        let deferredPrompt = e;

        let btnAdd = document.querySelector('#btnA2HS');
        // Update UI notify the user they can add to home screen
        btnAdd.style.display = 'block';

        btnAdd.addEventListener('click', (e) => {
            // hide our user interface that shows our A2HS button
            btnAdd.style.display = 'none';
            // Show the prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice
                .then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                });
        });
    });

    function notifyMe(message, silent) {
        if (!("Notification" in window)) {
            console.log("The device doesn't support notifications.");

        } else if (Notification.permission === "granted") {
            new Notification("Umbrella", {
                icon: "./images/icons/icon-72x72.png",
                body: message,
                silent
            });

        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {

                if (!('permission' in Notification)) {
                    Notification.permission = permission;
                }

                if (permission === "granted") {
                    new Notification("Umbrella", {
                        icon: "./images/icons/icon-72x72.png",
                        body: message,
                        silent
                    });
                }
            });
        }
    }

    async function checkForRain() {
        const url = "https://api.openweathermap.org/data/2.5/forecast?q=montreal,ca&appid=2baee98d271c379b0171d69b19def603";
        const shouldBringUmbrella = await fetch(url)
            .then((resp) => resp.json())
            .then((data) => data.list.slice(0, 4)) // 3 hours step -> 4 = 12 hours
            .then((data) => data.filter(
                (e) => e.weather.some(
                    (w) => (w.id >= 200 && w.id < 300) || w.description.includes("rain")
                )
            ))
            .then((data) => data.length > 0);

        const shouldBringHeader = document.querySelector("#bring-umbrella");
        const shouldBringMsg = document.querySelector("#bring-umbrella-message");
        shouldBringHeader.textContent = shouldBringUmbrella ? "You should bring your umbrella" : "You should not need your umbrella today";
        shouldBringMsg.textContent = shouldBringUmbrella ? "Looks like it might rain today, you should bring your umbrella today" : "The forecast predicts that it should not be a rainy day";

        notifyMe(shouldBringHeader.textContent, !shouldBringUmbrella);

        const now = new Date();
        let nextCheckDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0);

        if (now.getHours() >= 7) {
            nextCheckDate.setDate(nextCheckDate.getDate() + 1);
        }

        const nextCheck = nextCheckDate.getTime() - now.getTime();
        console.log(`Next check in ${nextCheck} ms`);

        setTimeout(checkForRain, nextCheck);
    }

    await checkForRain();

});