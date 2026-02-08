
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendResumeEmail(toEmail: string) {
    try {
        const resumePath = path.resolve(process.cwd(), 'documents', 'Aflah,Muhammed_AI.pdf');

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

    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: "Failed to send email." };
    }
}

export async function POST(request: Request) {
    try {
        const { message, threadId } = await request.json();

        if (!ASSISTANT_ID) {
            return NextResponse.json({ error: 'Assistant ID not configured' }, { status: 500 });
        }

        let threadIdToUse = threadId;

        if (!threadIdToUse) {
            const thread = await openai.beta.threads.create();
            threadIdToUse = thread.id;
        }

        await openai.beta.threads.messages.create(threadIdToUse, {
            role: "user",
            content: message,
        });

        // Current run state variables
        let currentRunId: string | null = null;
        let requiresAction = false;

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (event: string, data: any) => {
                    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                };

                // Send thread ID immediately
                sendEvent('threadId', { threadId: threadIdToUse });

                const eventHandler: any = {
                    onTextDelta: (delta: any, snapshot: any) => {
                        if (delta.value) {
                            sendEvent('textDelta', { text: delta.value });
                        }
                    },
                    onRunStepCreated: (step: any) => {
                        // console.log(`Step created: ${step.id}`);
                    },
                    onRunStepCompleted: (step: any) => {
                        // console.log(`Step completed: ${step.id}`);
                    },
                    onToolCallCreated: (toolCall: any) => {
                        sendEvent('toolCall', { type: toolCall.type, name: toolCall.function?.name });
                    },
                    onToolCallDelta: (delta: any, snapshot: any) => {
                        // Could stream tool args if needed
                    },
                    onEvent: (event: any) => {
                        if (event.event === 'thread.run.created') {
                            currentRunId = event.data.id;
                        }
                        if (event.event === 'thread.run.requires_action') {
                            requiresAction = true;
                            handleRequiresAction(event.data, controller, threadIdToUse!, sendEvent);
                        }
                        if (event.event === 'thread.run.completed') {
                            if (!requiresAction) { // Only close if we didn't divert to action handling
                                controller.close();
                            }
                        }
                        if (event.event === 'thread.run.failed') {
                            sendEvent('error', { message: "Run failed" });
                            controller.close();
                        }
                    }
                };

                // Helper to handle actions (tools)
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
                                        sendEvent('error', { message: `Failed to send email.` });
                                    }
                                }
                            }
                        }

                        // Submit outputs and continue streaming the follow-up response
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
                                    sendEvent('error', { message: "Run failed during tool output submission" });
                                    controller.close();
                                }
                            }
                        } else {
                            controller.close();
                        }

                    } catch (error) {
                        console.error("Error submitting tool outputs:", error);
                        sendEvent('error', { message: "Error processing tools" });
                        controller.close();
                    }
                }

                // Start the initial stream
                const runStream = openai.beta.threads.runs.stream(threadIdToUse, {
                    assistant_id: ASSISTANT_ID!,
                });

                for await (const event of runStream) {
                    // Manual dispatch to our event handler logic
                    // The SDK's 'stream' object is an async iterable of AssistantStreamEvent
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
                        sendEvent('error', { message: "Run failed" });
                        controller.close();
                    }
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

    } catch (error) {
        console.error('Error in chat route:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
