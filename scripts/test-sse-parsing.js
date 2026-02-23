
// Simulation of the SSE parsing logic implemented in Chat.tsx
async function simulateSSEParsing() {
    console.log("Starting SSE Simulation...");

    const mockStreamData = [
        'event: threadId\ndata: {"threadId":"thread_123"}\n\n',
        'event: text\ndata: "Hello"\n\n', // Old format (should be ignored by new logic if strictly checking event: textDelta, but let's see)
        'event: textDelta\ndata: {"text": "Hello"}\n\n',
        'event: textDelta\ndata: {"text": " there"}\n\n',
        'event: status\ndata: {"message": "Sending resume..."}\n\n',
        'event: status\ndata: {"message": "Resume sent!"}\n\n'
    ];

    let assistantMessageAccumulated = '';
    let threadId = null;

    console.log("Processing stream chunks...");

    for (const chunk of mockStreamData) {
        console.log(`\nReceived Chunk: ${JSON.stringify(chunk)}`);

        const events = chunk.split('\n\n');
        for (const eventStr of events) {
            if (!eventStr.trim()) continue;

            let eventName = '';
            let eventData = null;

            const eventLines = eventStr.split('\n');
            for (const line of eventLines) {
                if (line.startsWith('event: ')) {
                    eventName = line.substring('event: '.length).trim();
                } else if (line.startsWith('data: ')) {
                    try {
                        eventData = JSON.parse(line.substring('data: '.length).trim());
                    } catch (e) {
                        console.error('Error parsing JSON data', e);
                    }
                }
            }

            if (eventName && eventData) {
                console.log(`Parsed Event: ${eventName}`, eventData);

                if (eventName === 'threadId') {
                    threadId = eventData.threadId;
                    console.log(`-> Set threadId: ${threadId}`);
                } else if (eventName === 'textDelta') {
                    assistantMessageAccumulated += eventData.text;
                    console.log(`-> Updated Message: "${assistantMessageAccumulated}"`);
                } else if (eventName === 'status') {
                    assistantMessageAccumulated += `\n\n*${eventData.message}*`;
                    console.log(`-> Updated Message (Status): "${assistantMessageAccumulated}"`);
                }
            }
        }
    }

    console.log("\nFinal State:");
    console.log("Thread ID:", threadId);
    console.log("Assistant Message:", assistantMessageAccumulated);
}

simulateSSEParsing();
