# Fixium Code Review Bot - Setup Guide

## Overview
This repository is configured to use the Fixium Code Review Bot, which provides AI-powered code reviews on Pull Requests using IBM Bob AI Assistant.

## How It Works

1. **Trigger**: Comment `Fixium:review` on any Pull Request
2. **Execution**: GitHub Actions runs the Fixium Docker container
3. **Review**: Bob AI analyzes the PR changes and provides detailed feedback
4. **Results**: Review findings are posted as inline PR comments

## Prerequisites

### Required GitHub Secrets

Configure these secrets in your repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `MY_GITHUB_TOKEN` | GitHub Personal Access Token with repo permissions | Create at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) |
| `BOBSHELL_API_KEY` | IBM Bob AI API key | Get from [Bob Dashboard](https://bob.ibm.com) |
| `FIXIUM_AUTHORIZED_USERS` | Comma-separated list of GitHub usernames allowed to trigger reviews | Example: `user1,user2,user3` |

**Note**: `MY_GITHUB_TOKEN` requires `repo` scope for reading PR files and posting comments.

### Docker Image

The workflow uses the Fixium Docker image published from the `code-review-workflow` repository:

```
ghcr.io/your-org/fixium:latest
```

**Update Required**: Replace `your-org` in `.github/workflows/fixium.yml` with your actual GitHub organization/username.

## Usage

### Triggering a Review

1. Open a Pull Request
2. Add a comment with the trigger phrase:
   ```
   Fixium:review
   ```
3. Wait for the GitHub Action to complete
4. Review findings will be posted as inline comments on the PR

### Review Options

You can customize the review by adding options to your comment:

```
Fixium:review --severity high,medium
```

Available options:
- `--severity` - Filter by severity: `critical`, `high`, `medium`, `low`
- `--type` - Filter by type: `bug`, `security`, `maintainability`, `performance`
- `--exclude-severity` - Exclude specific severities
- `--exclude-type` - Exclude specific types

### Example Comments

**Full review:**
```
Fixium:review
```

**High severity only:**
```
Fixium:review --severity high
```

**Bugs and security issues:**
```
Fixium:review --type bug,security
```

**Exclude low severity:**
```
Fixium:review --exclude-severity low
```

## Authorization

Only users listed in the `FIXIUM_AUTHORIZED_USERS` secret can trigger reviews. This prevents:
- Unauthorized API usage
- Excessive Bob AI costs
- Spam reviews

To add authorized users:
1. Go to `Settings > Secrets and variables > Actions`
2. Edit `FIXIUM_AUTHORIZED_USERS`
3. Add usernames as comma-separated list: `user1,user2,user3`

## Review Output

### Inline Comments

Fixium posts inline comments on specific lines with:
- 🔴 **HIGH SEVERITY** | 🐛 **BUG**
- 🟡 **MEDIUM SEVERITY** | 🔧 **MAINTAINABILITY**
- 🔵 **LOW SEVERITY** | ⚡ **PERFORMANCE**

Each comment includes:
- **Issue**: Description of the problem
- **Details**: Explanation and context
- **Suggestion**: Recommended fix with code examples

### Artifacts

Review results are saved as artifacts:
- **Name**: `fixium-review-{PR_NUMBER}`
- **File**: `review_pr{PR_NUMBER}.json`
- **Retention**: 30 days

Download artifacts from the GitHub Actions run page.

## Workflow Configuration

### File Location
`.github/workflows/fixium.yml`

### Key Settings

**Concurrency**: Only one review per PR at a time
```yaml
concurrency:
  group: fixium-review-${{ github.event.issue.number }}
  cancel-in-progress: false
```

**Trigger**: PR comments containing "Fixium:review"
```yaml
on:
  issue_comment:
    types: [created]
```

**Docker Image**: Update with your organization
```yaml
ghcr.io/your-org/fixium:latest
```

## Troubleshooting

### Review Not Starting

**Check:**
1. Comment contains exact phrase: `Fixium:review`
2. Comment is on a Pull Request (not an issue)
3. User is in `FIXIUM_AUTHORIZED_USERS` list
4. GitHub Actions are enabled for the repository

### Authentication Errors

**Check:**
1. `MY_GITHUB_TOKEN` is set correctly with `repo` scope
2. `BOBSHELL_API_KEY` is set correctly
3. API keys are valid and not expired
4. Bob API key has sufficient credits

### Docker Image Not Found

**Check:**
1. Docker image is published to GitHub Container Registry
2. Image name in workflow matches published image
3. Repository has access to pull the image

### No Comments Posted

**Check:**
1. Review completed successfully (check Actions logs)
2. `MY_GITHUB_TOKEN` has `repo` scope with write permissions
3. Review found issues (check artifacts for JSON output)
4. Token has access to the repository

## Cost Management

### Bob AI Credits

Each review consumes Bob AI credits based on:
- Number of files reviewed
- Size of files
- Complexity of analysis

**Recommendations:**
1. Limit authorized users
2. Review only changed files (default behavior)
3. Use severity filters for quick checks
4. Monitor credit usage in Bob Dashboard

### GitHub Actions Minutes

Reviews run on GitHub-hosted runners:
- **Public repos**: Free unlimited minutes
- **Private repos**: Consult your GitHub plan

## Advanced Configuration

### Custom Docker Image

To use a custom Docker image:

1. Build and publish your image:
   ```bash
   docker build -t ghcr.io/your-org/fixium:custom .
   docker push ghcr.io/your-org/fixium:custom
   ```

2. Update workflow:
   ```yaml
   ghcr.io/your-org/fixium:custom
   ```

### Custom Prompts

Prompts are embedded in the Docker image. To customize:

1. Fork `code-review-workflow` repository
2. Modify prompts in `prompts/` directory
3. Rebuild and publish Docker image
4. Update workflow to use your image

### Environment Variables

Additional environment variables can be passed to the container:

```yaml
-e CUSTOM_VAR="value" \
```

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review artifacts (JSON output)
3. Consult [code-review-workflow documentation](https://github.com/your-org/code-review-workflow)
4. Contact repository maintainers

## Related Documentation

- [Fixium Main Documentation](../code-review-workflow/README.md)
- [PR Comments Guide](../code-review-workflow/README-pr-comments.md)
- [Quick Start](../code-review-workflow/QUICKSTART-pr-comments.md)
- [Bob AI Documentation](https://bob.ibm.com/docs)

---

**Last Updated**: 2026-05-08  
**Version**: 1.0.0  
**Maintainer**: Development Team