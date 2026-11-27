# Pre-Redesign Source Fixture

`pre-redesign.json.gz` contains public `src/` and package manifests from commit
`8961884` (full revision stored inside). No environment files, credentials or QA
artifacts are included. It anchors layout, legal/news preservation and financial
AST comparisons after the redesign itself has been committed, including shallow
CI clones. Do not refresh it to make a regression pass; intentional changes need
explicit review of the corresponding assertion.
