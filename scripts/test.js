async function testChat() {
    console.log("Sending chat request...");
    const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Send my resume to aflahofficialmail@gmail.com please." })
    });

    console.log("Status:", res.status);

    if (!res.body) return;

    for await (const chunk of res.body) {
        console.log("CHUNK:", chunk.toString());
    }
}

testChat().catch(console.error);
