# Contribute To The Docs

The Cleftly documentation is created in Markdown and served as a static site using [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

The documentation can be found in the `/docs` directory in the repository.

## Run Development Server

### Requirements

- [Python 3.11+](https://www.python.org/downloads/)
- [Poetry](https://python-poetry.org/)

### Run

```bash
poetry install
poetry run mkdocs serve
```

## Publish changes

Updates are automatically published to GitHub Pages via GitHub Actions.
