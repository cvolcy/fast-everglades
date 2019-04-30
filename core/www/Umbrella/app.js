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

    const url = "https://api.openweathermap.org/data/2.5/forecast?q=montreal,ca&appid=2baee98d271c379b0171d69b19def603";
    const shouldBringUmbrella = await fetch(url)
        .then((resp) => resp.json())
        .then((data) => data.list.slice(0, 8))
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
});