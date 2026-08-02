# EP 6 — Give It Eyes and Ears

| Field | Value |
|---|---|
| **Episode** | 6 of 10 |
| **Title** | Give It Eyes and Ears |
| **SEO title** | Build Private Voice, Vision, and OCR with QVAC |
| **Runtime** | 10–13 minutes |
| **Tone** | Demonstration-led, sensory, privacy-conscious |
| **Primary job** | Expand the private-memory application from typed text into voice and images |
| **Upload name** | `Bring AI Home Ep.06 — Give It Eyes and Ears` |

## Spoken script

### Part 1 — Your users do not live in text boxes

```
Our application can generate language and search private documents.

But people do not experience their lives as neatly formatted text.

They speak while walking. They photograph receipts. They screenshot errors. They point a camera at a whiteboard. They receive printed letters, scan forms, and record meetings whose speakers overlap.

The phone is already a sensor platform.

The question is whether understanding those senses requires sending them somewhere else.

A voice recording can reveal identity, emotion, location, health, and every person speaking in the room.

A photograph may contain faces, addresses, financial information, children, proprietary designs, or a computer screen the user never intended to publish.

Multimodal AI and privacy are not separate topics.

The more an application can perceive, the more carefully it must decide what leaves the device, what remains, and what should be deleted.

Today, we give our local system eyes and ears.
```

### Part 2 — Perception is a pipeline

```
We are not adding one magical sense model.

We are adding several tasks.

Speech-to-text converts audio into language.

Text-to-speech converts language into audio.

OCR extracts written characters from pixels.

A multimodal language model reasons about an image together with a question.

Image classification chooses labels from a defined set.

Each task answers a different product need.

If the user photographs a printed launch brief and wants the exact date, OCR may be the most direct tool.

If the user asks what is unusual about a chart, a multimodal model may be appropriate.

If the application only needs to decide whether an image is a receipt, report, or something else, classification may be smaller and faster than a vision-language model.

Perception begins by choosing the narrowest sense that can answer the question.
```

### Part 3 — Hear the user locally

```
QVAC supports transcription through Whisper and Parakeet-based paths.

The lifecycle is familiar.

Load a transcription model.

Pass transcribe either an audio file path or an in-memory audio buffer.

Receive the completed text.

Or use transcribe stream when the interface needs partial results while the person is still speaking.

Whisper can be paired with voice-activity detection so the application can recognize when an utterance begins and ends. Parakeet variants cover capabilities such as multilingual transcription, English streaming, speaker diarization, and end-of-utterance detection.

Model selection should follow the experience.

A voice memo can tolerate processing after recording.

A conversational assistant needs streaming and reliable turn detection.

A meeting archive may value speaker separation more than immediate output.

Do not call all three products “speech-to-text” and assume they have the same requirements.
```

### Part 4 — Build the voice round trip

```
For our application, I record one question:

“What did the launch brief say about the mobile audit?”

The audio remains on this machine.

The transcription model converts it into text. That text becomes the query for the private RAG workspace we built in the previous episode.

Retrieval returns the relevant launch passage. The local language model produces a grounded answer.

Then a text-to-speech model turns that answer back into audio.

QVAC’s text-to-speech path exposes complete audio buffers and streaming audio output. Supported engines include Supertonic and Chatterbox, with model-specific choices for language, voice, speed, enhancement, and—in some configurations—voice conditioning.

The result is a complete local loop:

Microphone.

Transcription.

Retrieval.

Completion.

Speech.

The user asked with their voice and received an answer without the recording becoming a cloud upload.
```

### Part 5 — Voice interfaces have physical bugs

```
A voice loop is more than chaining three APIs.

The microphone can hear the assistant’s own speaker output and transcribe it as a new user request. Room echo may trigger another turn after playback. Silence may become a meaningless transcript. Several loaded models may exceed the memory available on a phone.

The current QVAC voice-assistant example handles this by coordinating transcription, language generation, and speech synthesis as separate stages. It gates the microphone during playback, applies a short cooldown, filters empty or non-linguistic transcripts, and keeps the necessary models loaded only for the session.

These details are not edge cases.

They are the product.

A convincing voice demo proves that audio can move through the pipeline once.

A usable voice assistant controls feedback, interruption, latency, memory, and consent over thousands of turns.
```

### Part 6 — OCR reads; vision interprets

```
Now let us give the application sight.

I have a photograph of a printed launch brief.

If I need the exact words on the page, I use OCR.

QVAC’s OCR pipeline first detects regions containing text and then recognizes the characters inside those regions. The result contains text blocks and may include bounding boxes and confidence scores.

Bounding boxes let the interface show where each passage came from. Confidence scores help flag uncertain recognition for review.

If I instead ask, “What kind of document is this, and what information is visually emphasized?” OCR alone may not be enough.

For that task, I load a multimodal-capable language model together with its matching projection model. I attach the image to the user’s history and call completion through the same streaming interface used for text.

OCR extracts text.

Multimodal completion reasons across text and image structure.

Choose deliberately.
```

### Part 7 — Perception becomes memory

```
The photograph should not become an isolated demo.

We take the OCR blocks, preserve the source name and page location, and ingest the extracted text into the private RAG workspace.

Now the printed brief participates in the same memory system as typed notes and meeting transcripts.

This is the larger architecture:

Sensors create raw media.

Perception models create structured meaning.

Memory stores the useful representation.

Retrieval brings that representation back when it matters.

The application may not need to retain the original camera frame forever.

For some products, keeping the source image is necessary for verification. For others, the safer policy is to extract what the user requested, confirm the result, and delete the raw frame.

Retention should be a conscious product decision, not the accidental consequence of a debug folder nobody remembered to clear.
```

### Part 8 — The permission is part of the sense

```
Local execution does not make surveillance acceptable.

A camera running on-device can still violate the people it records. A microphone that never reaches the cloud can still capture a conversation without consent. A voice-cloning model can still be abused even when every byte remains local.

The permission model must match the sense.

The user should know when capture begins.

They should know whether raw media, extracted text, embeddings, or generated audio will be retained.

They should be able to inspect and delete those artifacts.

Background perception should require a stronger and more visible consent boundary than a photograph the user deliberately selected.

Privacy is not merely where computation happens.

It is whether people understand and control what the system perceives.
```

### Part 9 — Test the complete sensory path

```
Our application can now accept three forms of evidence.

A typed document enters directly.

A spoken note becomes a transcript.

A photographed page becomes OCR text or a multimodal observation.

All three can enter controlled local memory, appear in retrieval, and support a cited answer.

Test the system with difficult inputs.

Background noise.

An unfamiliar accent.

A rotated page.

Small text.

Two speakers.

An image whose meaning depends on layout rather than words.

Do not report one perfect sample as product quality. Record failures, confidence, latency, memory usage, and which device performed each task.

Perception is where the clean digital world collides with messy reality.
```

### Part 10 — From sensing to doing

```
We began with a model that could only respond to typed prompts.

Now the system can hear a question, retrieve private evidence, inspect an image, read a printed page, and speak an answer.

But it still cannot change anything outside the conversation.

It can recognize an action item without creating the task.

It can read the launch date without updating the calendar.

It can identify an incorrect filename without renaming the file.

Perception gives the system information.

Agency gives it consequences.

In the next episode, we will cross that boundary carefully.

We will give the model one tool, validate what it asks for, place dangerous actions behind approval, and build a loop that knows when to stop.

We have given the system senses.

Next, we decide what those senses are allowed to do.
```

## Research receipts

- [QVAC transcription](https://docs.qvac.tether.io/ai-capabilities/transcription/)
- [QVAC text-to-speech](https://docs.qvac.tether.io/ai-capabilities/text-to-speech/)
- [QVAC voice-assistant pipeline](https://docs.qvac.tether.io/ai-capabilities/voice-assistant/)
- [QVAC multimodal completion](https://docs.qvac.tether.io/ai-capabilities/multimodal/)
- [QVAC OCR](https://docs.qvac.tether.io/ai-capabilities/ocr/)

