document.getElementById("embedForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const imageFile = document.getElementById("embedImage").files[0];
    const message = document.getElementById("embedMessage").value.trim();
    const key = document.getElementById("encryptionKey").value.trim();
    const outputFilename = document.getElementById("outputFilename").value.trim(); // Get the custom output filename

    // Validate inputs
    const embedResult = document.getElementById("embedResult");
    if (!imageFile || !message || !key || !outputFilename) {
        if (embedResult) embedResult.textContent = "Error: All fields are required.";
        return;
    }

    if (isNaN(key) || parseInt(key) <= 0) {
        if (embedResult) embedResult.textContent = "Error: Key must be a positive integer.";
        return;
    }

    // Append all form data
    formData.append("image", imageFile);
    formData.append("message", message);
    formData.append("key", key);
    formData.append("outputFilename", outputFilename); // Add output filename to formData

    try {
        const response = await fetch("http://localhost:3000/embed", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const result = await response.json(); // Parse the JSON response
            if (embedResult) {
                embedResult.textContent = `Embedding successful! File saved as "${result.filename}".`;

                // Create a download link for the embedded file
                const downloadLink = document.createElement("a");
                downloadLink.href = `http://localhost:3000/${result.filename}`;
                downloadLink.download = result.filename; // Use the output filename for download
                downloadLink.textContent = "Download Embedded File";
                downloadLink.style.display = "block";
                downloadLink.style.marginTop = "10px";
                embedResult.appendChild(downloadLink);
            }
        } else {
            const errorText = await response.text();
            if (embedResult) embedResult.textContent = `Error: ${errorText}`;
        }
    } catch (err) {
        if (embedResult) embedResult.textContent = `Error: ${err.message}`;
    }
});

document.getElementById("retrieveForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const imageFile = document.getElementById("retrieveImage").files[0];
    const key = document.getElementById("decryptionKey").value.trim();

    // Validate inputs
    const retrieveResult = document.getElementById("retrieveResult");
    const retrieveResultContainer = document.getElementById("retrieveResultContainer");

    if (!imageFile || !key) {
        if (retrieveResult) retrieveResult.textContent = "Error: Both fields are required.";
        return;
    }

    if (isNaN(key) || parseInt(key) <= 0) {
        if (retrieveResult) retrieveResult.textContent = "Error: Key must be a positive integer.";
        return;
    }

    // Append all form data
    formData.append("image", imageFile);
    formData.append("key", key);

    try {
        const response = await fetch("http://localhost:3000/retrieve", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const result = await response.json(); // Parse the JSON response
            if (retrieveResultContainer) {
                retrieveResultContainer.textContent = ""; // Clear previous messages
                const resultMessage = document.createElement("p");
                resultMessage.textContent = `Retrieved message: "${result.retrievedData}"`;
                resultMessage.classList.add("retrieved-message");
                retrieveResultContainer.appendChild(resultMessage);
            }

            if (retrieveResult) retrieveResult.textContent = "Message retrieved successfully!";
        } else {
            const errorText = await response.text();
            if (retrieveResult) retrieveResult.textContent = `Error: ${errorText}`;
        }
    } catch (err) {
        if (retrieveResult) retrieveResult.textContent = `Error: ${err.message}`;
    }
});
