import fs from 'fs';
import pdf from 'pdf-parse';

async function readPdf() {
    try {
        let dataBuffer = fs.readFileSync('public/documents/Aflah_Muhammed.pdf');
        const data = await pdf(dataBuffer);
        console.log("----- PDF TEXT START -----");
        console.log(data.text);
        console.log("----- PDF TEXT END -----");
    } catch (e) {
        console.error("Error parsing", e);
    }
}
readPdf();
