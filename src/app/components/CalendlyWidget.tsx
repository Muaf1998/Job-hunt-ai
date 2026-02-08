"use client";

import { useEffect, useState } from 'react';

// You can replace this with your actual Calendly URL
// e.g., "https://calendly.com/yourname/30min"
const CALENDLY_URL = "https://calendly.com/aflahofficialmail/30min";

export default function CalendlyWidget() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="w-full h-[600px] border border-border rounded-lg overflow-hidden bg-card mt-4">
            <iframe
                src={CALENDLY_URL}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Select a Date & Time - Calendly"
            ></iframe>
        </div>
    );
}
