
import { NextResponse } from 'next/server';
import { openai, ASSISTANT_ID } from '@/lib/openai';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Vercel Route Config
export const maxDuration = 60; // 5 minutes (max for hobby is 10s-60s depending on plan)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Explicitly use Node.js runtime


async function sendResumeEmail(toEmail: string) {
    try {
        // In Next.js standalone mode, the current working directory might be inside .next/standalone
        // We ensure we resolve relative to the process root where public is copied.
        let resumePath = path.join(process.cwd(), 'public', 'documents', 'Aflah_Muhammed.pdf');

        if (!fs.existsSync(resumePath)) {
            // Fallback for standalone server execution context
            resumePath = path.join(process.cwd(), '.next', 'standalone', 'public', 'documents', 'Aflah_Muhammed.pdf');
        }

        if (!fs.existsSync(resumePath)) {
            console.error('❌ Resume file not found at:', resumePath);
            return { success: false, error: "Resume file not found on server." };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: "Resume of Muhammed Aflah",
            text: `Hello,\n\nPlease find attached the resume of Muhammed Aflah as requested.\n\nBest regards,\nMosaic (AI Assistant)`,
            attachments: [
                {
                    filename: 'Muhammed_Aflah_Resume.pdf',
                    path: resumePath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return { success: true };

    } catch (error: any) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: `Failed to send email: ${error.message || String(error)}` };
    }
}

export async function POST(request: Request) {
    try {
        // 1. Validate Environment Variables
        if (!process.env.OPENAI_API_KEY) {
            console.error("❌ Missing OPENAI_API_KEY");
            return NextResponse.json({ error: 'Server Misconfiguration: Missing API Key' }, { status: 500 });
        }
        if (!process.env.OPENAI_ASSISTANT_ID) {
            console.error("❌ Missing OPENAI_ASSISTANT_ID");
            return NextResponse.json({ error: 'Server Misconfiguration: Missing Assistant ID' }, { status: 500 });
        }

        const { message, threadId } = await request.json();
        let threadIdToUse = threadId;

        // 2. Setup Thread
        if (!threadIdToUse) {
            try {
                const thread = await openai.beta.threads.create();
                threadIdToUse = thread.id;
            } catch (e: any) {
                console.error("❌ Failed to create thread:", e);
                return NextResponse.json({ error: `Failed to create thread: ${e.message}` }, { status: 500 });
            }
        }

        // 3. Add Message
        try {
            await openai.beta.threads.messages.create(threadIdToUse, {
                role: "user",
                content: message,
            });
        } catch (e: any) {
            console.error("❌ Failed to add message:", e);
            return NextResponse.json({ error: `Failed to add message: ${e.message}` }, { status: 500 });
        }

        // Current run state variables
        let currentRunId: string | null = null;
        let requiresAction = false;

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (event: string, data: any) => {
                    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                };

                // Send heartbeat to confirm connection
                sendEvent('ping', { message: 'connected' });

                // Send thread ID immediately
                sendEvent('threadId', { threadId: threadIdToUse });

                async function handleRequiresAction(runData: any, controller: ReadableStreamDefaultController, threadId: string, sendEvent: Function) {
                    try {
                        const toolCalls = runData.required_action?.submit_tool_outputs.tool_calls;
                        const toolOutputs = [];

                        if (toolCalls) {
                            for (const toolCall of toolCalls) {
                                if (toolCall.function.name === 'book_meeting') {
                                    sendEvent('action', { action: 'book_meeting' });
                                    toolOutputs.push({
                                        tool_call_id: toolCall.id,
                                        output: JSON.stringify({ success: true, status: "widget_displayed" })
                                    });
                                }
                                else if (toolCall.function.name === 'email_resume') {
                                    const args = JSON.parse(toolCall.function.arguments);
                                    sendEvent('status', { message: `Sending resume to ${args.email}...` });

                                    const emailResult = await sendResumeEmail(args.email);

                                    if (emailResult.success) {
                                        toolOutputs.push({
                                            tool_call_id: toolCall.id,
                                            output: JSON.stringify({ success: true, message: `Resume sent to ${args.email}` })
                                        });
                                        sendEvent('status', { message: `Resume sent!` });
                                    } else {
                                        toolOutputs.push({
                                            tool_call_id: toolCall.id,
                                            output: JSON.stringify({ success: false, error: emailResult.error })
                                        });
                                        sendEvent('error', { error: `Failed to send email: ${emailResult.error}` });
                                    }
                                }
                            }
                        }

                        if (toolOutputs.length > 0) {
                            const stream = openai.beta.threads.runs.submitToolOutputsStream(
                                threadId,
                                runData.id,
                                { tool_outputs: toolOutputs }
                            );

                            for await (const event of stream) {
                                if (event.event === 'thread.message.delta') {
                                    if (event.data.delta.content?.[0]?.type === 'text') {
                                        sendEvent('textDelta', { text: event.data.delta.content[0].text?.value });
                                    }
                                }
                                if (event.event === 'thread.run.completed') {
                                    controller.close();
                                }
                                if (event.event === 'thread.run.failed') {
                                    sendEvent('error', { error: "Run failed during tool output submission" });
                                    controller.close();
                                }
                            }
                        } else {
                            controller.close();
                        }

                    } catch (error) {
                        console.error("Error submitting tool outputs:", error);
                        sendEvent('error', { error: "Error processing tools" });
                        controller.close();
                    }
                }

                try {
                    const runStream = openai.beta.threads.runs.stream(threadIdToUse, {
                        assistant_id: ASSISTANT_ID!,
                    });

                    for await (const event of runStream) {
                        if (event.event === 'thread.message.delta') {
                            if (event.data.delta.content?.[0]?.type === 'text') {
                                sendEvent('textDelta', { text: event.data.delta.content[0].text?.value });
                            }
                        }
                        if (event.event === 'thread.run.created') currentRunId = event.data.id;
                        if (event.event === 'thread.run.requires_action') {
                            requiresAction = true;
                            await handleRequiresAction(event.data, controller, threadIdToUse!, sendEvent);
                        }
                        if (event.event === 'thread.run.completed') {
                            if (!requiresAction) controller.close();
                        }
                        if (event.event === 'thread.run.failed') {
                            // Enhanced error details
                            console.error("❌ Run failed event received:", JSON.stringify(event.data));
                            sendEvent('error', { error: "AI Run Failed. Check server logs." });
                            controller.close();
                        }
                    }
                } catch (e: any) {
                    console.error("❌ Error during stream loop:", e);
                    sendEvent('error', { error: `Stream connection error: ${e.message}` });
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('❌ Critical Error in chat route:', error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
