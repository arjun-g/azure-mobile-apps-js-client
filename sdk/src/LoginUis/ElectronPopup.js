// This login UI implementation uses the BrowserWindow api

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this login UI is usable in the current runtime.
    /// </summary>

    // Check for presence of process variable
    return !!((typeof process !== 'undefined') && process.versions);
};

exports.login = function (startUri, endUri, callback) {
    /// <summary>
    /// Displays the login UI and calls back on completion
    /// </summary>

    // Initially we show a page with a spinner. This stays on screen until the login form has loaded.
    var redirectionScript = "<script>location.href = unescape('" + window.escape(startUri) + "')</script>",
        startPage = "data:text/html," + encodeURIComponent(getSpinnerMarkup() + redirectionScript);

    // iOS inAppBrowser issue requires this wrapping
    setTimeout(function () {
        var loginWindow = window.open(startPage, "azure-mobile-app-login", "location=no,hardwareback=no"),
            flowHasFinished = false

        const ipc = require('electron').ipcRenderer
        ipc.once('azure-mobile-app-login-success', (sender, result) => {
            callback(result.error, result.oAuthToken)
        })

    }, 500);
};

function getSpinnerMarkup() {
    // The default experience isn't ideal, as it just shows the user a blank white screen
    // until the login form appears. This might take 10+ seconds during which it looks broken.
    // Also on iOS it's possible for the BrowserWindow to initially show the results of the *previous*
    // login flow if the BrowserWindow was dismissed before completion, which is totally undesirable.
    // To fix both of these problems, we display a simple "spinner" graphic via a data: URL until
    // the current login screen has loaded. We generate the spinner via CSS rather than referencing
    // an animated GIF just because this makes the client library smaller overall.
    var vendorPrefix = "webkitTransform" in document.documentElement.style ? "-webkit-" : "",
        numSpokes = 12,
        spokesMarkup = "";
    for (var i = 0; i < numSpokes; i++) {
        spokesMarkup += "<div style='-prefix-transform: rotateZ(" + (180 + i * 360 / numSpokes) + "deg);" +
                                    "-prefix-animation-delay: " + (0.75 * i / numSpokes) + "s;'></div>";
    }
    return [
        "<!DOCTYPE html><html>",
        "<head><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1'></head>",
        "<body><div id='spinner'>" + spokesMarkup + "</div>",
        "<style type='text/css'>",
        "    #spinner { position: absolute; top: 50%; left: 50%; -prefix-animation: spinner 10s linear infinite; }",
        "    #spinner > div {",
        "        background: #333; opacity: 0; position: absolute; top: 11px; left: -2px; width: 4px; height: 21px; border-radius: 2px;",
        "        -prefix-transform-origin: 50% -11px; -prefix-animation: spinner-spoke 0.75s linear infinite;",
        "    }",
        "    @-prefix-keyframes spinner { 0% { -prefix-transform: rotateZ(0deg); } 100% { -prefix-transform: rotateZ(-360deg); } }",
        "    @-prefix-keyframes spinner-spoke { 0% { opacity: 0; } 5% { opacity: 1; } 70% { opacity: 0; } 100% { opacity: 0; } }",
        "</style>",
        "</body></html>"
    ].join("").replace(/-prefix-/g, vendorPrefix);
}