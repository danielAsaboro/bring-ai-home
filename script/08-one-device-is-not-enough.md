# EP 8 — One Device Is Not Enough

| Field | Value |
|---|---|
| **Episode** | 8 of 10 |
| **Title** | One Device Is Not Enough |
| **SEO title** | Delegate Local AI Between Trusted Devices with QVAC P2P |
| **Runtime** | 11–14 minutes |
| **Tone** | Ambitious but exact; trust and failure behavior before spectacle |
| **Primary job** | Demonstrate delegated inference from a constrained device to a trusted stronger peer |
| **Upload name** | `Bring AI Home Ep.08 — One Device Is Not Enough` |

## Spoken script

### Part 1 — Local does not mean lonely

```
The phrase on-device AI creates the wrong picture.

One lonely phone, disconnected from everything, struggling to run the largest model somebody could fit into a benchmark.

Real people already own small fleets.

A phone with a microphone, camera, location, and constant presence.

A laptop with more memory and better sustained performance.

Perhaps a desktop, home server, or workstation that remains plugged in and can handle heavier jobs.

The cloud coordinates devices by making every device a client of somebody else’s computer.

A local-first system can coordinate devices differently.

The phone can remain the personal interface. The stronger machine can provide a capability. The user can control both ends of the relationship.

Local does not have to mean one device.

It means the user controls the boundary within which the intelligence operates.
```

### Part 2 — Delegation is a placement decision

```
Delegated inference separates where a request begins from where its model executes.

The consumer device owns the experience. It prepares a task and sends that task to a provider device.

The provider runs the model and streams the result back.

This is not model splitting. We are not dividing individual neural-network layers across two unreliable phones.

We are placing a complete intelligence task on the machine best able to perform it.

Transcribe this recording here.

Run this larger language model there.

Analyze this image on the workstation.

The application can preserve one task API while changing where the task runs.

That is the powerful abstraction in QVAC delegation: after a delegated model is registered, completion, transcription, translation, and other supported calls follow the same shape as local execution.

Placement changes.

The product surface does not have to.
```

### Part 3 — Start the provider

```
On the stronger machine, QVAC starts a provider service.

The provider binds a server using its keypair and exposes a public key that identifies how a consumer should connect.

In the current delegated-inference design, there is no broad discovery topic where consumers search for any available stranger. The consumer is given the provider’s public key and connects directly through the Hyperswarm DHT.

That is useful for trust because pairing can be explicit.

Display the key as a QR code on the laptop. Scan it from the phone. Verify a short fingerprint on both devices. Store the paired identity only after the user confirms it.

The provider can also apply a firewall rule that allows or denies specific consumer public keys.

Possessing an address is not the same as receiving permission to use the machine.

Identity begins the connection.

Policy decides whether it is accepted.
```

### Part 4 — Register a delegated model

```
On the consumer, we call load model as before, but this time we include a delegate configuration.

That configuration names the provider public key, a connection timeout, and optional failure behavior.

QVAC returns a model identifier representing the delegated model.

The application can now call completion with that identifier and consume the same token stream it used for a model running locally.

This design keeps placement policy out of the interface layer.

The chat screen does not need one implementation for local tokens and a completely separate implementation for peer tokens.

It submits a task to a model identifier.

The model registration determines where execution occurs.

That makes it possible to test local and delegated paths without rebuilding the entire feature.
```

### Part 5 — Perform the two-device test

```
Our phone has captured and transcribed a private question:

“Using the launch notes, produce a concise risk summary for the mobile audit.”

Retrieval runs where the private workspace lives and returns only the passages required for this answer.

The phone then sends the grounded completion task to the paired laptop.

On the provider, we can see the request arrive and the model begin inference.

On the phone, the answer streams into the same interface used in episode four.

The phone did not become more powerful.

The product became aware of another capability inside the user’s trusted environment.

Pocket interface.

Desk brain.

One experience.
```

### Part 6 — Peer-to-peer is not automatically private

```
Delegation moves data.

The prompt, attachments, or audio required for the task leave the consumer device and become available to the provider performing inference.

Peer-to-peer removes a compulsory central inference service. It does not make every peer trustworthy.

Before delegation, the application must answer:

Who controls the provider?

How was it paired?

Which data will be sent?

Does the provider need the complete source document, or only retrieved passages?

Will it retain logs, caches, attachments, or generated output?

Can the user revoke the relationship?

For our system, private work may travel only to devices explicitly paired by the user. Unknown providers are excluded regardless of speed or price.

Sensitivity is evaluated before capability.

A faster untrusted model is not an upgrade.
```

### Part 7 — Route the minimum necessary context

```
The safest byte is the byte you never send.

If the laptop only needs three retrieved passages to create a summary, do not delegate the entire document archive.

If OCR can run on the phone, send extracted text rather than the original image containing unrelated faces and addresses.

If the task can be completed locally within the user’s latency budget, do not delegate merely because another device exists.

Routing should consider at least four signals.

Sensitivity: where is this data permitted to go?

Capability: which device has the required model and hardware?

Availability: is the device connected, loaded, and healthy?

Cost: what time, energy, bandwidth, or payment does the route require?

Apply them in that order.

Privacy is a gate.

The others are optimization.
```

### Part 8 — Failure behavior reveals the architecture

```
What happens when the laptop sleeps halfway through a task?

What happens when the provider restarts?

What happens when the first DHT connection takes longer than the interface expects?

The current QVAC documentation warns that cold DHT bootstrap may take fifteen to forty-five seconds, while subsequent calls can reuse the connection and become much faster. It also notes that consumer reconnection after a provider restart is not automatic yet.

Those facts must shape the product.

Show a real connecting state.

Allow cancellation.

Use a generous first-connection timeout.

Do not silently submit the same consequential tool action twice after uncertainty.

And decide the fallback before failure occurs.

Fallback to a smaller local model may be acceptable.

Fallback to an unknown public provider may violate the entire privacy contract.

Failure policy is privacy policy under pressure.
```

### Part 9 — Relays solve reachability, not trust

```
Devices behind restrictive networks may be unable to establish a direct path.

QVAC supports blind relays to help peers connect across NATs and firewalls. Relay public keys are configured explicitly, and the same relay configuration can support model distribution and delegated inference.

A relay changes how traffic reaches the provider.

It should not change who is authorized to request inference.

Use relays you operate or deliberately trust. Keep provider firewalls and consumer pairing in place. Monitor whether requests are direct or relayed when diagnosing latency.

Networking infrastructure can help two trusted endpoints reach each other.

It cannot decide that the endpoints should trust each other.
```

### Part 10 — Private mesh before public market

```
Delegated inference can eventually support broader compute relationships: borrowing a friend’s GPU, using a community provider, or paying for a specialized model on somebody else’s hardware.

Those systems require identity, metering, receipts, abuse controls, dispute handling, and a much more complicated privacy story.

Do not begin there.

Begin with two devices one person controls.

Make pairing legible.

Make revocation work.

Make the firewall deny an unapproved consumer.

Make delegated output stream reliably.

Make failures visible.

Then expand the trust model only when the product has a reason.

A private mesh is already valuable without becoming a public marketplace.

Your phone borrowing your laptop’s model is not a small idea.

It is the cloud experience without compulsory cloud ownership.
```

### Part 11 — From layers to a living system

```
We now have every major piece of a local-first AI system.

Execution on a device the user controls.

Private retrieval and inspectable memory.

Voice, vision, and OCR.

Tools constrained by policy and approval.

Delegation to a stronger trusted peer.

Each episode isolated one layer so we could understand it.

Real products must make those layers cooperate.

They must decide which device owns memory, how requests are routed, how tools are approved, how state synchronizes, what survives offline, and what evidence the interface shows to the user.

That is the work behind Leash.

In the next episode, I will open the complete system: what we built, what genuinely worked, what broke, why it won, and what I would redesign now.

One device was not enough.

The answer was not surrendering the product to the cloud.

The answer was teaching the user’s devices to cooperate.
```

## Research receipts

- [QVAC delegated inference](https://docs.qvac.tether.io/p2p-capabilities/delegated-inference/)
- [QVAC blind relays](https://docs.qvac.tether.io/p2p-capabilities/blind-relays/)
- [QVAC introduction and P2P capabilities](https://docs.qvac.tether.io/introduction/)
