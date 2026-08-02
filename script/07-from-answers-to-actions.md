# EP 7 — From Answers to Actions

| Field | Value |
|---|---|
| **Episode** | 7 of 10 |
| **Title** | From Answers to Actions |
| **SEO title** | Build Safe Local AI Agents with QVAC Tools and MCP |
| **Runtime** | 10–13 minutes |
| **Tone** | Systems-minded, practical, serious about authority |
| **Primary job** | Build one observable local tool loop with validation, approval, and a stopping condition |
| **Upload name** | `Bring AI Home Ep.07 — From Answers to Actions` |

## Spoken script

### Part 1 — The line between saying and doing

```
A chatbot can tell you that a task should be created.

An agent can create it.

That sounds like a small difference. Architecturally, it is the moment language gains consequences.

The model’s output is no longer only text a person may choose to follow. It can become an argument passed to a function that reads a file, writes a database row, sends a message, runs a command, or controls another system.

This is why “agent” should not mean “a chatbot with a more dramatic system prompt.”

An agent is a model participating in a loop with tools, observations, policy, state, and a stopping condition.

The model may propose an action.

The application decides whether that action is valid and authorized.

The tool performs it.

The result returns to the model.

The loop continues until the goal is complete—or until the application stops it.
```

### Part 2 — Give the model a contract, not a shell

```
We begin with one tool: create task.

Its schema describes a name, a purpose, and typed arguments: title, due date, and source reference.

The schema is a contract between probabilistic language and deterministic code.

The model does not receive direct access to our task database. It receives a description of an operation it may request.

QVAC completion can accept tool definitions and surface structured tool calls in the ordered completion event stream. Depending on the model, QVAC handles the appropriate tool-call dialect and returns the proposed tool name and arguments.

Proposed is the important word.

A tool call emitted by a model is untrusted input.

We validate the tool name against an allowlist. We validate every argument against the schema. We reject unknown fields. We normalize dates. We enforce length limits. We confirm the source record exists.

The model requests.

Application code authorizes.
```

### Part 3 — Build the smallest useful loop

```
Our user asks:

“Create a task for the mobile audit mentioned in the launch brief.”

The application first retrieves the relevant launch passage from local memory. The grounded context says the audit needs another week and identifies the meeting where the decision was made.

We call completion with the conversation history and the create-task tool definition.

The model produces a structured call containing a task title, proposed due date, and source reference.

Our application validates the arguments.

It has not executed anything yet.

The interface displays a preview:

Create task: complete mobile audit.

Due: before October fifth.

Source: launch-planning meeting.

The user approves.

Only then does deterministic code write the task.

The tool result is added to the conversation as an observation. The model receives that result and produces the final confirmation.

One request. One tool. One approval. One result.

That is enough to teach the whole agent loop.
```

### Part 4 — Approval is not a failure of automation

```
People sometimes describe approval screens as friction that a sufficiently intelligent agent will eliminate.

That misunderstands the product.

Approval is where the user sees an intention before it becomes a consequence.

Not every tool requires the same gate.

Reading a public documentation file may be low risk.

Reading a private key is not.

Drafting an email may be reversible.

Sending it is externally visible.

Proposing a file deletion is different from deleting the file.

Define permission by effect, not by how ordinary the function name sounds.

A strong agent interface shows what will happen, which data will be used, what can be undone, and why the tool is needed.

The goal is not to ask “Are you sure?” so often that users stop reading.

The goal is to place meaningful authority boundaries around meaningful consequences.
```

### Part 5 — Focus the toolset

```
An application with fifty tools should not expose all fifty on every turn.

Large tool lists consume context, confuse smaller local models, increase the chance of selecting the wrong operation, and expand the authority available to a compromised prompt.

Route first.

If the user is asking about documents, expose retrieval and perhaps note creation.

If they are managing a calendar, expose calendar tools.

If they are discussing source code, expose tools scoped to the selected repository.

Focused toolsets improve accuracy and safety at the same time.

They also make evaluation possible. You can test whether a model selects one of five relevant tools far more meaningfully than whether it survives a catalogue of every function in your product.

Least privilege is not only a security principle.

For local models, it is a performance strategy.
```

### Part 6 — Tools need boundaries beneath the schema

```
A valid argument can still request an invalid effect.

A read-file tool may receive a perfectly formatted path that escapes the project directory.

A shell tool may receive a syntactically valid destructive command.

A message tool may target a recipient the user never approved.

So validation must continue beneath the schema.

Resolve filesystem paths and enforce an explicit root.

Use allowlists for commands or avoid general shell access entirely.

Separate read operations from write operations.

Use recoverable changes where possible.

Set timeouts and output limits.

Record the tool request, approval decision, execution result, and error.

And never place secrets in the model context merely because the model and tool happen to run locally.

Local execution reduces one class of exposure.

It does not transform untrusted generated arguments into trusted code.
```

### Part 7 — The loop must know when to stop

```
An agent loop needs a budget.

Set a maximum number of steps.

Set a wall-clock timeout.

Allow the user to cancel.

Stop when the model returns a final answer without another tool call.

Stop when the same failing action repeats.

Stop when the next action requires authority the user has not granted.

And preserve enough state to explain why the loop stopped.

Without those controls, the application can spend unlimited time asking a local model to repeat a mistake. There may be no cloud bill, but there is still battery, heat, memory, disk activity, and the user’s attention.

An infinite loop is not free merely because it runs on hardware you own.
```

### Part 8 — MCP expands tools, not trust

```
QVAC completion can also work with Model Context Protocol clients.

MCP gives applications a standard way to discover and call tools exposed by external servers. That can connect a local model to files, search, databases, development environments, or services without inventing a unique integration format for each one.

But MCP is a protocol, not a permission system for your product.

Connecting a server does not mean every tool it exposes should be available on every turn. A tool description can be wrong. A remote server can be compromised. A tool result can contain hostile instructions aimed at the model.

Apply the same controls:

Select tools deliberately.

Validate calls.

Approve consequential effects.

Treat tool output as untrusted data.

Record what happened.

Standards make integration easier.

They do not remove responsibility.
```

### Part 9 — Local agents change the economics of patience

```
A local agent can work with a repository, private notes, or internal tools without sending every reasoning turn to a model provider.

It can continue through a long task without consuming a per-token cloud budget.

Its model version can remain stable while you evaluate behavior.

And its tool history can remain on the user’s hardware.

Those advantages are real.

So are the limits.

Small models may choose tools less reliably. Long loops consume context. Tool results can overwhelm the model. A task that appears cheap may occupy the machine for an hour.

The answer is not to imitate the largest cloud agent with a smaller local model.

Design the agent around local strengths: narrow goals, focused tools, explicit state, reusable skills, retrieval before guessing, and escalation to a stronger trusted device when the task genuinely requires it.
```

### Part 10 — Agency with receipts

```
Our system can now perceive a launch brief, retrieve the relevant decision, propose a task, wait for approval, execute deterministic code, and report the result.

Every transition is visible.

The source passage explains why the task exists.

The tool schema explains what the model may request.

The approval explains what the user authorized.

The execution log explains what actually happened.

That is agency with receipts.

In the next episode, we confront a physical limit.

The device holding the user’s private context may not be the device capable of running the best model for the task.

We could surrender to a compulsory cloud endpoint.

Or we could let a trusted machine the user controls provide the missing capability.

One experience.

More than one device.

Next, we build the private delegation path.
```

## Research receipts

- [QVAC text generation, events, tool calls, and MCP](https://docs.qvac.tether.io/ai-capabilities/text-generation/)
- [QVAC API summary](https://docs.qvac.tether.io/reference/api/)
- [QVAC plugin system](https://docs.qvac.tether.io/configuration/plugins/)

