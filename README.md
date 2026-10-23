# Bring AI Home docs

Mintlify documentation source for Bring AI Home.

## Preview

```bash
cd /Users/MAC/development/bring-ai-home/blog
mint dev --port 3333
```

Install the CLI if needed: `npm install -g mint`.

## Verify

```bash
mint validate
mint broken-links
```

Edit branding and navigation in `docs.json`. Add content as `.mdx` pages.

## Hosting

Local setup does not create a hosted Mintlify site. Connect a repository through the Mintlify dashboard and select `blog` as the documentation directory when using the parent repository. No publishing is performed by this setup.
