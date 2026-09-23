# Helper script to trigger a targeted code review from Claude (via GitLab Duo CLI)
param (
    [string]$Prompt = "Review the recent changes and git diff on this branch against Prompt.md. Identify any regressions, edge cases, or performance bottlenecks."
)

$env:NODE_OPTIONS = "--dns-result-order=ipv4first"

Write-Host "Invoking Claude (GitLab Duo Fable 5.1) for code review..." -ForegroundColor Cyan

& duo run -g $Prompt --model claude_fable_5_1_vertex
