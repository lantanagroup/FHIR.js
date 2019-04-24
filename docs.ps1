If (!(Test-Path .\docs)) {
    New-Item -ItemType Directory -Force -Path .\docs
}
Move-Item .\docs\.git .\docs-git -ErrorAction Ignore
npm run docs
Move-Item .\docs-git .\docs\.git -ErrorAction Ignore